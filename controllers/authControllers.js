const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const { verify, generate } = require("otplib");
const JWT_SECRET = process.env.JWT_SECRET;
const createNotification = require("../config/notification");

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

exports.loginVerify2FA = async (req, res) => {
  const { userId, token } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    const user = rows[0];

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({
        error: "Richiesta non valida o 2FA non configurata.",
      });
    }

    const secret = String(user.two_factor_secret).trim();
    const cleanToken = String(token ?? "").trim();

    // TEST TEMPORANEO: verifica che il secret del database funzioni
    const generated = await generate({ secret });

    const test = await verify({
      secret,
      token: generated,
    });

    // Verifica il codice inserito dall'utente
    const result = await verify({
      secret,
      token: cleanToken,
    });

    const isValid = result.valid;

    if (!isValid) {
      return res.status(400).json({
        error: "Codice errato o scaduto. Riprova.",
      });
    }

    const rememberMe = Boolean(user.rememberMe);

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: rememberMe ? "30d" : "8h",
      },
    );

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    };

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie("token", accessToken, cookieOptions);

    return res.json({ success: true });
  } catch (error) {
    console.error("Errore durante la verifica 2FA:", error);

    return res.status(500).json({
      error: "Errore interno del server",
    });
  }
};

exports.register = async (req, res) => {
  const { full_name, email, password } = req.body;

  const status = "active";
  let role = "user";

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [controllUser] = await db.execute(
      "SELECT COUNT(*) AS count FROM users",
    );

    const control = controllUser[0].count === 0;

    if (control) {
      role = "admin";
    }

    const query =
      "INSERT INTO users(full_name, email, password, role) VALUES (?, ?, ?, ?)";

    const [result] = await db.execute(query, [
      full_name,
      email,
      passwordHash,
      role,
    ]);

    const query2 =
      "INSERT INTO customers(name, email, status) VALUES (?, ?, ?)";

    await db.execute(query2, [full_name, email, status]);

    return res.status(201).json({
      message: "Dati inseriti correttamente",
      user: result,
    });
  } catch (error) {
    console.error("Errore durante l'inserimento dei dati", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        errore: "Questa email è già registrata nel sistema.",
      });
    }

    return res.status(500).json({
      errore: "Errore interno durante la registrazione.",
    });
  }
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (rememberMe) {
      await db.execute(`UPDATE users SET rememberMe = true WHERE email = ?`, [
        email,
      ]);
    } else {
      await db.execute(`UPDATE users SET rememberMe = false WHERE email = ?`, [
        email,
      ]);
    }

    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ errore: "Credenziali non valide." });
    }

    const user = rows[0];

    const passwordValida = await bcrypt.compare(password, user.password);

    if (!passwordValida) {
      return res.status(401).json({ errore: "Credenziali non valide." });
    }

    if (user.is_two_factor_enabled === 1) {
      return res.json({
        richiede2FA: true,
        userId: user.id,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "8h" },
    );
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    };

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie("token", token, cookieOptions);

    const queryLogin = `UPDATE users SET last_login = ? WHERE id = ?`;
    await db.execute(queryLogin, [new Date(), user.id]);

    res.json({
      message: "Login effettuato con successo",
      full_name: user.full_name,
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ errore: "Errore del server durante il login." });
  }
};

exports.forgot_password = async (req, res) => {
  const { email } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [result] = await db.execute(query, [email]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ error: "Email non valida. L'utente non esiste" });
    }

    const user = result[0];
    const token = crypto.randomBytes(32).toString("hex");

    const date = new Date(Date.now() + 15 * 60 * 1000);

    const insertToken =
      "UPDATE users SET reset_token = ?, reset_token_date = ? WHERE id = ?";
    await db.execute(insertToken, [token, date, user.id]);

    const resetURL = `http://localhost:5500/public/reset-password.html?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Ripristino della Password",
      text: `Hai richiesto il ripristino della password. Clicca su questo link per procedere: ${resetURL}`,
      html: `
        <h1>Richiesta di Ripristino Password</h1>
        <p>Hai richiesto di reimpostare la tua password. Clicca sul pulsante qui sotto per procedere:</p>
        <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 5px;">Reimposta Password</a>
        <p>Questo link scadrà tra 15 minuti.</p>
        <p>Se non hai richiesto tu questo ripristino, ignora questa email.</p>
      `,
    });

    res.status(201).json({ message: "Inviato il link di ripristino " });
  } catch (error) {
    console.error("Errore nell'invio della email", error);
    res.status(500).json({
      error: "Errore durante la richiesta di invio",
    });
  }
};

exports.reset_password = async (req, res) => {
  const { password, email } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Utente non trovato",
      });
    }

    const user = rows[0];

    const newPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "UPDATE users SET password = ?, password_expiry = NULL WHERE id = ?",
      [newPassword, user.id],
    );

    return res.status(200).json({
      message: "Password aggiornata con successo",
    });
  } catch (error) {
    console.error("Errore nella risposta del server", error);

    return res.status(500).json({
      message: "Errore del server",
    });
  }
};

exports.reset_password2 = async (req, res) => {
  const { password, token } = req.body;

  try {
    if (!password || !token) {
      return res.status(400).json({
        message: "Password e token sono obbligatori",
      });
    }

    const [rows] = await db.execute(
      `SELECT id, password FROM users
       WHERE reset_token = ?
       AND reset_token_date > NOW()`,
      [token],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Link non valido o scaduto",
      });
    }

    const user = rows[0];
    const id = user.id;
    const isSamePassword = await bcrypt.compare(password, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        message:
          "La nuova password inserita non può essere uguale a quella vecchia",
      });
    }
    const newPasswordHash = await bcrypt.hash(password, 10);

    await db.execute(
      `UPDATE users
       SET password = ?,
           password_expiry = NULL,
           reset_token = NULL,
           reset_token_date = NULL
       WHERE id = ?`,
      [newPasswordHash, user.id],
    );

    res.status(200).json({
      message: "Password aggiornata con successo",
    });

    return await createNotification(
      req,
      id,
      "Aggiornamento dati",
      "Aggiornamento dati utente",
      "Hai correttamente aggiornato la tua password personale. Se non sei stato tu, contatta l'assistenza",
      true,
    );
  } catch (error) {
    console.error("Errore nella risposta del server", error);

    return res.status(500).json({
      message: "Errore del server",
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT COUNT(*) AS count FROM users`);
    const setup = rows[0].count === 0;
    res.json({
      setup,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server" });
  }
};
