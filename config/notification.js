const db = require("../config/database");
const sendEmail = require("./mailer"); // <-- Assicurati che il percorso sia corretto

async function createNotification(
  req,
  userId,
  type,
  title,
  message,
  is_important = false,
  actionUrl = null, // Aggiunto opzionalmente se vuoi passare link di azione
) {
  try {
    const [users] = await db.execute(
      "SELECT email, email_notifications, orders, appointments, customers, users, products FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return;
    }

    const user = users[0];

    if (type === "Aggiornamento ordini" && !user.orders) {
      return;
    }

    if (type === "Aggiornamento appuntamenti" && !user.appointments) {
      return;
    }

    if (type === "Aggiornamento clienti" && !user.customer) {
      return;
    }

    if (type === "Aggiornamento utenti" && !user.users) {
      return;
    }

    if (type === "Aggiornamento prodotti" && !user.products) {
      return;
    }

    // Valori di default in caso di parametri mancanti
    const v_userId = userId !== undefined ? userId : null;
    const v_type = type !== undefined ? type : "info";
    const v_title = title !== undefined ? title : null;
    const v_message = message !== undefined ? message : null;
    const v_isImportant = is_important !== undefined ? is_important : null;

    // 3. Salvataggio nel database della notifica in-app
    const query =
      "INSERT INTO notifications(user_id, type, title, message, is_important) VALUES(?, ?, ?, ?, ?)";

    const [result] = await db.execute(query, [
      v_userId,
      v_type,
      v_title,
      v_message,
      v_isImportant,
    ]);

    if (user.email_notifications && v_isImportant) {
      try {
        // <-- CHIAMATA CORRETTA AL MAILER IMPORTATO
        await sendEmail({
          to: user.email,
          subject: v_type,
          title: v_title,
          message: v_message,
          actionUrl: actionUrl,
        });
      } catch (error) {
        console.error("ERRORE SMTP DETTAGLIATO:", error);
        console.error("Notifica salvata nel DB, ma email non inviata:", error);
      }
    }

    if (req && req.app) {
      const io = req.app.get("socket.io");

      if (io && v_userId !== null) {
        io.to(`user:${v_userId}`).emit("nuova_notifica", {
          id: result.insertId,
          type: v_type,
          title: v_title,
          message: v_message,
          created_at: new Date(),
          is_read: 0,
        });
      }
    }
  } catch (error) {
    console.error("Errore nella creazione della notifica", error);
  }
}

module.exports = createNotification;
