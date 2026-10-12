const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const createNotification = require("../config/notification");
const JWT_SECRET = process.env.JWT_SECRET;

exports.getCustomers = async (req, res) => {
  const search = req.query.search || "";
  const status = req.query.status || "";
  const orders = Number(req.query.orders);
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const value = `%${search}%`;
  const statusValue = `%${status}%`;

  let having = "";

  const params = [value, value, value, statusValue];

  if (orders !== undefined && orders !== "") {
    having = "HAVING COUNT(orders.id) >= ?";
    params.push(Number(orders));
  }
  try {
    const query = `SELECT 
  customers.name AS nome,
  customers.email AS email,
  customers.status AS status,
  customers.phone AS number,
  COUNT(orders.id) AS number_order,
  SUM(orders.total) AS total,
  MAX(orders.date) AS last_activity
FROM customers
LEFT JOIN orders
  ON customers.name = orders.customer
  WHERE (customers.name LIKE ?
  OR customers.email LIKE ?
  OR customers.phone LIKE ?)
  AND customers.status LIKE ?
GROUP BY 
  customers.id,
  customers.name,
  customers.email,
  customers.status,
  customers.phone
${having}
ORDER BY customers.created_at DESC
LIMIT ? OFFSET ?;
    `;
    params.push(limit, offset);
    const [getCustomers] = await db.execute(query, params);

    const countParams = [value, value, value, statusValue];

    let countHaving = "";

    if (orders !== undefined && orders !== "") {
      countHaving = "HAVING COUNT(orders.id) = ?";
      countParams.push(Number(orders));
    }

    const countQuery = `
  SELECT customers.id

  FROM customers

  LEFT JOIN orders
    ON customers.name = orders.customer

  WHERE (
    customers.name LIKE ?
    OR customers.email LIKE ?
    OR customers.phone LIKE ?
  )
  AND customers.status LIKE ?

  GROUP BY customers.id

  ${countHaving}
`;

    const [countResult] = await db.execute(countQuery, countParams);
    const totalCustomers = countResult.length;
    const totalPages = Math.ceil(totalCustomers / limit);

    const [customers] = await db.execute(
      `SELECT customers.name, customers.id
      FROM customers
      ORDER BY customers.id ASC
      `,
    );
    res.json({
      getCustomers: customers,
      customers: getCustomers,
      currentPage: page,
      totalPages: totalPages,
      totalCustomers: totalCustomers,
    });
  } catch (error) {
    console.error("Errore get customers:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.addCustomer = async (req, res) => {
  const { name, surname, email, phone, address, city } = req.body;
  try {
    if (!name || !surname || !email || !phone || !address || !city) {
      res.status(401).json({ error: "I campi sono obbligatori" });
    }

    const full_name = `${name} ${surname}`;

    const query = `INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)`;
    await db.execute(query, [full_name, email, phone]);

    res.status(201).json({
      message: "Customer inserito con successo",
    });
    createNotification(
      req,
      req.user.id,
      "Aggiornamento clienti",
      "Nuovo cliente",
      `${full_name} da ora fa parte del gestionale come cliente`,
      false,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
    res.json({ error: "Errore interno del server" });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Il campo email è obbligatorio" });
    }

    const [rows] = await db.execute(
      "SELECT email FROM customers WHERE email = ?",
      [email],
    );
    if (rows.length > 0) {
      const query = "DELETE FROM customers WHERE email = ?";
      await db.execute(query, [email]);

      res.status(200).json({
        message: "Customer eliminato con successo",
      });
      createNotification(
        req,
        req.user.id,
        "Aggiornamento clienti",
        "Rimozione cliente",
        "È stato rimosso un cliente dal gestionale. Controlla per ulteriori informazioni. ",
        false,
      ).catch((err) => console.error(err));
    } else {
      return res.status(404).json({
        message: "Utente non trovato. Inserisci un indirizzo email valido",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};
