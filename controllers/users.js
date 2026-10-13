const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const { bytes } = require("stream/consumers");
const createNotification = require("../config/notification");

const JWT_SECRET = process.env.JWT_SECRET;

exports.getUsers = async (req, res) => {
  const search = req.query.search || "";
  const categoryType = req.query.categoryType || "";
  const page = Number(req.query.page) || 1;

  const limit = 5;
  const offset = (page - 1) * limit;

  const searchValue = `%${search}%`;
  const categoryValue = `%${categoryType}%`;

  const params = [searchValue, searchValue, searchValue, categoryValue];
  try {
    const query = `SELECT users.full_name AS name, users.email AS email, users.role AS role, users.last_login AS last_login, users.last_activity AS last_activity
                    FROM users
                    WHERE (users.full_name LIKE ? OR users.email LIKE ? OR users.role LIKE ?)
                    AND  users.role LIKE ?
                    ORDER BY users.id DESC
                    LIMIT ? OFFSET ?;
                `;

    params.push(limit, offset);
    const [users] = await db.execute(query, params);

    const countParams = [searchValue, searchValue, searchValue, categoryValue];

    const countQuery = `
      SELECT COUNT(users.id) AS total
      FROM users
      WHERE (users.full_name LIKE ? OR users.email LIKE ? OR users.role LIKE ?)
        AND  users.role LIKE ?
    `;

    const [countResult] = await db.execute(countQuery, countParams);
    const totalUsers = countResult[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("users_active", { action: "isActive", id: users.id });
    }
    res.json({
      users: users,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
    });
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.addUser = async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const query = `INSERT INTO users (full_name, email, role, password) VALUES (?, ?, ?, '')`;
    const [result] = await db.execute(query, [name, email, role]);

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("users_add", { action: "add", id: result.insertId });
    }
    createNotification(
      req,
      req.user.id,
      "Aggiornamento utenti",
      "Nuovo utente",
      `È stato inserito un nuovo utente nel gestionale nel ruolo di ${role}. Nome: ${name}`,
      true,
    ).catch((err) => console.error(err));

    res.status(200).json({
      message: "Utente registrato con successo",
      result: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.deleteUser = async (req, res) => {
  const { name, email } = req.body;
  try {
    if (!name || !email) {
      return res.status(401).json({ error: "I campi sono obbligatori" });
    }
    const query = `DELETE FROM users WHERE email = ? `;
    const [result] = await db.execute(query, [email]);

    if (result.affectedRows === 0) {
      return res.status(401).json({ error: "Utente non trovato" });
    }

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("users_delete", { action: "delete", id: result.insertId });
    }
    createNotification(
      req,
      req.user.id,
      "Aggiornamento utenti",
      "Rimozione utente",
      `L'utente ${name} è stato eliminato dal gestionale`,
      true,
    ).catch((err) => console.error(err));

    res.status(200).json({
      message: "Utente eliminato con successo",
      result: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.createPassword = async (req, res) => {
  try {
    const password = crypto.randomBytes(10).toString("base64").slice(0, 10);
    res.status(200).json({
      message: "Password creata",
      password: password,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.savePassword = async (req, res) => {
  const { password, email } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const scadenzaPassword = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const query = `UPDATE users SET password = ?, password_expiry = ? WHERE email = ?`;

    await db.query(query, [passwordHash, scadenzaPassword, email]);

    res.status(200).json({ message: "Password inserita con successo" });
  } catch (error) {
    console.error(error);
    res.status(501).json({ error: "Errore interno del server" });
  }
};

const escapeHtml = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

exports.sendPassword = async (req, res) => {
  const { password, email, nome } = req.body;

  if (!password || !email) {
    return res.status(400).json({ errore: "Dati mancanti" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const scadenzaPassword = new Date(Date.now() + 5 * 60 * 60 * 1000);

    const [result] = await db.query(
      `UPDATE users SET password = ?, password_expiry = ? WHERE email = ?`,
      [passwordHash, scadenzaPassword, email],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: "Utente non trovato" });
    }

    const baseUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");
    const link = `${baseUrl}/createPassword.html`;

    await sendEmail({
      to: email,
      subject: "Password temporanea",
      text: `Password temporanea per accedere a NEXA: ${password}. Valida 5 ore. Crea la tua password qui: ${link}`,
      html: `
        <h1>Password temporanea</h1>
        <p>Sig. ${escapeHtml(nome)}, il suo admin le ha inviato una password temporanea in modo da poter accedere al gestionale.</p>
        <p style="font-size:25px; color:black; font-family:monospace">${escapeHtml(password)}</p>
        <p>Usi questa password per crearne una nuova personale.</p>
        <p><a href="${link}" style="color:blue">Clicca qui per creare una nuova password</a></p>
        <p>Questa password ha validità 5 ore.</p>
      `,
    });

    res.status(201).json({ message: "Inviata password temporanea" });
  } catch (error) {
    console.error("Errore nell'invio della password", error);
    res.status(500).json({ errore: "Errore durante la richiesta di invio" });
  }
};

exports.comparePassword = async (req, res) => {
  const { password, email } = req.body;
  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Utente non trovato",
      });
    }

    const user = rows[0];

    const passwordCorretta = await bcrypt.compare(password, user.password);
    if (!passwordCorretta) {
      return res.status(401).json({ message: "Password temporanea errata." });
    }

    if (user.password_expiry && new Date() > new Date(user.password_expiry)) {
      return res.status(401).json({
        message:
          "Password temporanea scaduta. Contatta l'amministratore per una nuova password",
      });
    }

    res.status(200).json({ message: "Password temporanea corretta" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Errore del server",
    });
  }
};
