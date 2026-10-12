const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const { isatty } = require("tty");
const createNotification = require("../config/notification");

const JWT_SECRET = process.env.JWT_SECRET;

exports.getAppointments = async (req, res) => {
  const status = req.query.status || "";
  const search = req.query.search || "";
  const page = Number(req.query.page) || 1;
  const isCalendar = req.query.isCalendar === "true";

  const limit = 10;
  const offset = (page - 1) * limit;

  const searchValue = `%${search}%`;
  const statusValue = status ? status : "%";

  const isAdmin = req.user.role.toLowerCase() === "admin";
  const userName = req.user.full_name.toLowerCase();

  try {
    let query = `
      SELECT 
        appointments.id AS id,
        appointments.title AS title,
        appointments.client AS client,
        appointments.date AS date,
        appointments.start_time AS start,
        appointments.end_time AS end,
        appointments.status AS status
      FROM appointments
      WHERE 
        appointments.status LIKE ? AND
      (appointments.title LIKE ? OR appointments.client LIKE ?)
      
    `;

    const queryParams = [statusValue, searchValue, searchValue];

    if (!isAdmin) {
      query += `AND LOWER(appointments.client) = ?`;
      queryParams.push(userName);
    }

    query += `
    GROUP BY appointments.id
    ORDER BY appointments.id DESC
  `;

    if (!isCalendar) {
      query += ` LIMIT ? OFFSET ?;`;
      queryParams.push(String(limit), String(offset));
    } else {
      query += `;`;
    }

    const [appointmentsResult] = await db.execute(query, queryParams);

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT appointments.id) AS totalAppointments,
        SUM(CASE WHEN appointments.status = 'pending' THEN 1 ELSE 0 END) AS pendingAppointments,
        COUNT(CASE WHEN appointments.date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 END) AS count_this_month,
        COUNT(CASE WHEN appointments.date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01') 
                       AND appointments.date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 END) AS count_last_month
      FROM appointments
      WHERE 
        (appointments.status LIKE ?) AND
        (
          appointments.title LIKE ? 
          OR appointments.client LIKE ?
        )
    `;

    const statsParams = [statusValue, searchValue, searchValue];
    const [statsResult] = await db.execute(statsQuery, statsParams);

    const totalAppointments = statsResult[0]?.totalAppointments || 0;
    const pendingAppointments =
      Number(statsResult[0]?.pendingAppointments) || 0;
    const countThisMonth = Number(statsResult[0]?.count_this_month) || 0;
    const countLastMonth = Number(statsResult[0]?.count_last_month) || 0;

    const totalPages = isCalendar ? 1 : Math.ceil(totalAppointments / limit);

    let percentageGrowth = 0;
    if (countLastMonth > 0) {
      percentageGrowth =
        ((countThisMonth - countLastMonth) / countLastMonth) * 100;
      percentageGrowth = Number(percentageGrowth.toFixed(2));
    }

    const [lastRow] = await db.execute(
      `SELECT appointments.id AS id FROM appointments ORDER BY id DESC LIMIT 1`,
    );
    const lastID = lastRow.length > 0 ? lastRow[0].id : 0;

    res.json({
      lastID,
      appointment: appointmentsResult,
      currentPage: isCalendar ? 1 : page,
      totalPages: totalPages,
      totalAppointments: totalAppointments,
      pending: pendingAppointments,
      percentage: percentageGrowth,
    });
  } catch (error) {
    console.error("Errore get appointments:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.addAppointment = async (req, res) => {
  const { service, name, date, startTime, endTime } = req.body;
  try {
    if (endTime <= startTime) {
      return res.status(400).json({
        error: "L'orario di fine deve essere successivo all'orario di inizio",
      });
    }
    const appDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appDate < today) {
      return res.status(400).json({
        error: "Impossibile prenotare per una data passata",
      });
    }
    const status = "Pending";
    const query = `INSERT INTO appointments (title, client, date, start_time, end_time, status) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(query, [
      service,
      name,
      date,
      startTime,
      endTime,
      status,
    ]);

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("appointments_updated", { action: "add", id: result.insertId });
    }
    createNotification(
      req,
      req.user.id,
      "Aggiornamento appuntamenti",
      "Nuovo appuntamento registrato",
      "Hai registrato un nuovo appuntamento",
      true,
    ).catch((err) => console.error(err));
    res.status(200).json({
      message: "Appuntamento registrato con successo",
      result: result,
    });
  } catch (error) {
    console.error("Errore interno del server", error);
    res.status(500).json({ error: "Errore del server" });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.body;
    const newId = Number(id);
    const query = `DELETE FROM appointments WHERE id = ?`;
    const [result] = await db.execute(query, [newId]);

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("appointments_updated", { action: "delete", id: id });
    }

    res.status(200).json({
      message: "Appuntamento cancellato con successo",
      result: result,
    });

    createNotification(
      req,
      req.user.id,
      "Aggiornamento appuntamenti",
      "Il tuo appuntamento è stato cancellato",
      "Il tuo appuntamento è stato cancellato con successo",
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error("Errore del server", error);
    res.status(500).json({ errore: "Errore del server" });
  }
};

exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.body;
    const newId = Number(id);
    const query = `UPDATE appointments SET status = "Confirmed" WHERE id = ?`;
    const [result] = await db.execute(query, [newId]);

    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.emit("appointments_updated", { action: "confirm", id: id });
    }

    res.status(200).json({
      message: "Appuntamento confermato con successo",
      result: result,
    });

    createNotification(
      req,
      req.user.id,
      "Aggiornamento appuntamenti",
      "Il tuo appuntamento è stato confermato",
      "Il tuo appuntamento è stato confermato con successo",
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error("Errore del server", error);
    res.status(500).json({ errore: "Errore del server" });
  }
};
