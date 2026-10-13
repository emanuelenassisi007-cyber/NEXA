const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const JWT_SECRET = process.env.JWT_SECRET;
const createNotification = require("../config/notification");

exports.notifyOrders = async (req, res) => {
  const notify = req.body.notifyOrders;

  try {
    const query = "UPDATE users SET orders = ? WHERE id = ?";
    await db.execute(query, [notify, req.user.id]);

    const messaggioNotifica = notify
      ? "Hai attivato correttamente le notifiche sugli ordini."
      : "Hai disattivato le notifiche sugli ordini.";

    await createNotification(
      req,
      req.user.id,
      "Sistema",
      "Aggiornamento impostazioni di sistema",
      messaggioNotifica,
      true,
    );

    return res.status(200).json({
      success: true,
      message: notify
        ? "Notifiche sugli ordini attivate con successo"
        : "Notifiche sugli ordini disattivate con successo",
    });
  } catch (error) {
    console.error("Errore aggiornamento notifiche ordini:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.notifyApp = async (req, res) => {
  const notify = req.body.notifyApp;

  try {
    const query = "UPDATE users SET appointments = ? WHERE id = ?";
    await db.execute(query, [notify, req.user.id]);

    const messaggioNotifica = notify
      ? "Hai attivato correttamente le notifiche sugli appuntamenti."
      : "Hai disattivato le notifiche sugli appuntamenti.";

    await createNotification(
      req,
      req.user.id,
      "Sistema",
      "Aggiornamento impostazioni di sistema",
      messaggioNotifica,
      true,
    );

    return res.status(200).json({
      success: true,
      message: notify
        ? "Notifiche sugli appuntamenti attivate con successo"
        : "Notifiche sugli appuntamenti disattivate con successo",
    });
  } catch (error) {
    console.error("Errore aggiornamento notifiche appuntamenti:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.notifyCustomers = async (req, res) => {
  const notify = req.body.notifyCustomers;

  try {
    const query = "UPDATE users SET customers = ? WHERE id = ?";
    await db.execute(query, [notify, req.user.id]);

    const messaggioNotifica = notify
      ? "Hai attivato correttamente le notifiche sui clienti."
      : "Hai disattivato le notifiche sui clienti.";

    await createNotification(
      req,
      req.user.id,
      "Sistema",
      "Aggiornamento impostazioni di sistema",
      messaggioNotifica,
      true,
    );

    return res.status(200).json({
      success: true,
      message: notify
        ? "Notifiche sui clienti attivate con successo"
        : "Notifiche sui clienti disattivate con successo",
    });
  } catch (error) {
    console.error("Errore aggiornamento notifiche customers:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.notifyProducts = async (req, res) => {
  const notify = req.body.notifyProducts;

  try {
    const query = "UPDATE users SET products = ? WHERE id = ?";
    await db.execute(query, [notify, req.user.id]);

    const messaggioNotifica = notify
      ? "Hai attivato correttamente le notifiche sui prodotti."
      : "Hai disattivato le notifiche sui prodotti.";

    await createNotification(
      req,
      req.user.id,
      "Sistema",
      "Aggiornamento impostazioni di sistema",
      messaggioNotifica,
      true,
    );

    return res.status(200).json({
      success: true,
      message: notify
        ? "Notifiche sui prodotti attivate con successo"
        : "Notifiche sui prodotti disattivate con successo",
    });
  } catch (error) {
    console.error("Errore aggiornamento notifiche prodotti:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.notifyUsers = async (req, res) => {
  const notify = req.body.notifyUsers;

  try {
    const query = "UPDATE users SET users = ? WHERE id = ?";
    await db.execute(query, [notify, req.user.id]);

    const messaggioNotifica = notify
      ? "Hai attivato correttamente le notifiche sugli utenti."
      : "Hai disattivato le notifiche sugli utenti.";

    await createNotification(
      req,
      req.user.id,
      "Sistema",
      "Aggiornamento impostazioni di sistema",
      messaggioNotifica,
      true,
    );

    return res.status(200).json({
      success: true,
      message: notify
        ? "Notifiche sugli utenti attivate con successo"
        : "Notifiche sugli utenti disattivate con successo",
    });
  } catch (error) {
    console.error("Errore aggiornamento notifiche customers:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};
