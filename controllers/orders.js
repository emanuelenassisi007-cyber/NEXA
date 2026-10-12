const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const createNotification = require("../config/notification");

const JWT_SECRET = process.env.JWT_SECRET;

exports.getOrders = async (req, res) => {
  const search = req.query.search || "";
  const status = req.query.status || "";
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const value = `%${search}%`;
  const statusValue = `%${status}%`;

  try {
    const query = `
      SELECT 
        orders.id AS id,
        customers.name AS customer,
        orders.date AS date,
        orders.status AS status,
        orders.total AS total
      FROM orders
      RIGHT JOIN customers ON orders.customer = customers.name
      WHERE (
        customers.name LIKE ?
        OR orders.customer LIKE ?
        OR orders.id LIKE ?
      )
      AND orders.status LIKE ?
      GROUP BY orders.id DESC
      LIMIT ? OFFSET ?;
    `;

    const queryParams = [value, value, value, statusValue, limit, offset];
    const [getOrders] = await db.execute(query, queryParams);

    const statsQuery = `
      SELECT 
        SUM(CASE WHEN orders.status = 'pending' THEN 1 ELSE 0 END) AS pending,
        COUNT(DISTINCT orders.id) AS totalOrders,
        ROUND(AVG(orders.total), 2) AS mediaGenerale,
        ROUND(AVG(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN orders.total END), 2) AS avg_this_month,
        ROUND(AVG(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01') 
                       AND date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN orders.total END), 2) AS avg_last_month
      FROM orders
      RIGHT JOIN customers ON customers.name = orders.customer
      WHERE (
        customers.name LIKE ?
        OR orders.customer LIKE ?
        OR orders.id LIKE ?
      )
      AND orders.status LIKE ?
    `;
    const statsParams = [value, value, value, statusValue];
    const [statsResult] = await db.execute(statsQuery, statsParams);
    const totalOrders = statsResult[0]?.totalOrders || 0;
    const mediaComplessiva = statsResult[0]?.mediaGenerale || 0;
    const avgThisMonth = Number(statsResult[0]?.avg_this_month) || 0;
    const avgLastMonth = Number(statsResult[0]?.avg_last_month) || 0;
    const pendingOrders = Number(statsResult[0]?.pending) || 0;
    const totalPages = Math.ceil(totalOrders / limit);

    let percentage = 0;
    if (avgLastMonth > 0) {
      percentage = ((avgThisMonth - avgLastMonth) / avgLastMonth) * 100;
      percentage = Number(percentage.toFixed(2));
    }

    const [rows] = await db.execute(
      `SELECT orders.id AS id FROM orders ORDER BY id DESC LIMIT 1`,
    );

    const lastID = rows.length > 0 ? rows[0].id : 0;

    res.json({
      lastID,
      orders: getOrders,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
      media: mediaComplessiva,
      percentage: percentage,
      pending: pendingOrders,
    });
  } catch (error) {
    console.error("Errore get orders:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.addOrders = async (req, res) => {
  const { customer, status, total, products } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const query = `INSERT INTO orders(customer, status, total, date) VALUES (?, ?, ?, NOW())`;
    const [result] = await connection.execute(query, [customer, status, total]);
    const insertId = result.insertId;

    for (const nameProduct in products) {
      const details = products[nameProduct];
      const quantitàRichiesta = details.count;

      const [rows] = await connection.execute(
        `SELECT stock, type FROM products WHERE item = ?`,
        [nameProduct],
      );

      if (rows.length === 0) {
        throw new Error(
          `Il prodotto "${nameProduct}" non esiste nel database.`,
        );
      }

      const prodottoDb = rows[0];

      if (prodottoDb.type.toLowerCase() === "product") {
        if (prodottoDb.stock < quantitàRichiesta) {
          throw new Error(
            `Stock insufficiente per "${nameProduct}". Disponibili: ${prodottoDb.stock}, Richiesti: ${quantitàRichiesta}`,
          );
        }

        const nuovoStock = prodottoDb.stock - quantitàRichiesta;
        const nuovaAvailability =
          nuovoStock === 0 ? "unavailable" : "available";

        await connection.execute(
          `UPDATE products SET stock = ?, availability = ? WHERE item = ?`,
          [nuovoStock, nuovaAvailability, nameProduct],
        );
      }

      const queryProdotto = `
        INSERT INTO orders_item (order_id, product, quantity, price) 
        VALUES (?, ?, ?, ?)
      `;
      await connection.execute(queryProdotto, [
        insertId,
        nameProduct,
        quantitàRichiesta,
        details.price,
      ]);
    }

    await connection.commit();
    res.status(200).json({
      message: "Ordine registrato e magazzino aggiornato con successo",
      orderId: insertId,
    });

    createNotification(
      req,
      req.user.id,
      "Aggiornamento ordini",
      "Nuovo ordine",
      status === "Completed"
        ? `Hai effettuato un nuovo ordine con successo. ID ordine: ${insertId}`
        : `Hai effettuato un nuovo ordine. L'ordine è in attesa di conferma. ID: ${insertId}`,
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    await connection.rollback();

    console.error(
      "Errore durante l'inserimento, transazione annullata:",
      error,
    );

    const statusCodice =
      error.message.includes("insufficente") ||
      error.message.includes("non esiste")
        ? 400
        : 500;

    return res.status(statusCodice).json({
      error: "Impossibile completare l'ordine",
      dettagli: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.getUltimateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        orders.id AS id,
        orders.customer AS customer,
        orders.date AS date,
        orders.status AS status,
        orders.total AS total,
        orders_item.product AS product,
        orders_item.quantity AS quantity,
        orders_item.price AS price
      FROM orders
      LEFT JOIN orders_item
        ON orders_item.order_id = orders.id
      WHERE orders.id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        orders: [],
      });
    }

    const ordine = {
      id: rows[0].id,
      customer: rows[0].customer,
      date: rows[0].date,
      status: rows[0].status,
      total: rows[0].total,
      products: [],
    };

    rows.forEach((row) => {
      if (row.product) {
        ordine.products.push({
          name: row.product,
          quantity: row.quantity,
          price: row.price,
        });
      }
    });

    res.json({
      orders: [ordine],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Errore interno del server",
    });
  }
};

exports.confirmOrder = async (req, res) => {
  const orderId = req.params.id;
  try {
    const query = `UPDATE orders SET status = "completed" WHERE id = ?`;
    const [result] = await db.execute(query, [orderId]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Ordine non trovato" });
    }

    res.status(200).json({ message: "Ordine confermato con successo" });

    createNotification(
      req,
      req.user.id,
      "Aggiornamento ordini",
      "Ordine confermato",
      `L'ordine ${orderId} è stato confermato con successo`,
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  try {
    const query = `UPDATE orders SET status = "cancelled" WHERE id = ?`;
    const [result] = await db.execute(query, [orderId]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Ordine non trovato" });
    }

    res.status(200).json({ message: "Ordine cancellato con successo" });
    createNotification(
      req,
      req.user.id,
      "Aggiornamento ordini",
      "Ordine annullato",
      `L'ordine ${orderId} è stato annullato con successo. `,
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};
