const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const { bytes } = require("stream/consumers");

const JWT_SECRET = process.env.JWT_SECRET;

exports.logout = async (req, res) => {
  const { password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE id = ?";
    const [rows] = await db.execute(query, [req.user.id]);
    if (rows.length === 0) {
      return res.status(401).json({ errore: "Credenziali non valide." });
    }

    const user = rows[0];

    const passwordValida = await bcrypt.compare(password, user.password);

    if (!passwordValida) {
      return res.status(401).json({ errore: "Credenziali non valide." });
    }
    await db.execute(
      "UPDATE users SET last_login = NOW(), last_activity = NOW()",
    );
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.json({ message: "Logout effettuato con successo" });
  } catch (error) {
    console.error("Errore durante il logout", error);
    res.status(500).json({ message: "Errore durante il logout" });
  }
};
