const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");

const JWT_SECRET = process.env.JWT_SECRET;

exports.customers = async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN created_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
            THEN 1
            ELSE 0
          END
        ) AS customers_last_month
      FROM customers
    `);

    const totalCustomers = result[0].total;
    const lastMonth = Number(result[0].customers_last_month);

    let percentage = 0;

    if (lastMonth > 0) {
      percentage = ((totalCustomers - lastMonth) / lastMonth) * 100;
    }
    res.json({
      data: totalCustomers,
      percentage: Number(percentage.toFixed(1)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella ricerca degli utenti" });
  }
};

exports.products = async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 ELSE 0 END) AS this_month,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01') AND date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 ELSE 0 END) AS last_month
      FROM products
    `);

    const totalProducts = Number(result[0].total) || 0;
    const thisMonth = Number(result[0].this_month) || 0;
    const lastMonth = Number(result[0].last_month) || 0;

    let percentage = 0;
    if (lastMonth > 0) {
      percentage = ((thisMonth - lastMonth) / lastMonth) * 100;
    }

    res.json({
      data: totalProducts,
      percentage: Number(percentage.toFixed(1)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella ricerca dei prodotti" });
  }
};

exports.orders = async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(date) = CURRENT_DATE THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 ELSE 0 END) AS this_month,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01') AND date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN 1 ELSE 0 END) AS last_month
      FROM orders
    `);

    const [queryUltimateOrders] = await db.execute(
      `SELECT * FROM orders ORDER BY date DESC LIMIT 5`,
    );

    const totalOrders = Number(result[0].total) || 0;
    const todayOrders = Number(result[0].today) || 0;
    const pendingOrders = Number(result[0].pending) || 0;
    const thisMonth = Number(result[0].this_month) || 0;
    const lastMonth = Number(result[0].last_month) || 0;

    let percentage = 0;
    if (lastMonth > 0) {
      percentage = ((thisMonth - lastMonth) / lastMonth) * 100;
    }

    res.json({
      data: totalOrders,
      percentage: Number(percentage.toFixed(1)),
      today: todayOrders,
      pending: pendingOrders,
      ultimateOrders: queryUltimateOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella ricerca degli ordini" });
  }
};

exports.revenue = async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT
        SUM(total) AS revenue,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN total ELSE 0 END) AS thisMonth,
        SUM(CASE WHEN date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01') AND date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN total ELSE 0 END) AS lastMonth
      FROM orders
      WHERE LOWER(status) = 'completed'
    `);

    const revenue = Number(result[0].revenue) || 0;
    const thisMonth = Number(result[0].thisMonth) || 0;
    const lastMonth = Number(result[0].lastMonth) || 0;

    let percentage = 0;
    if (lastMonth > 0) {
      percentage = ((thisMonth - lastMonth) / lastMonth) * 100;
    }

    res.status(200).json({
      revenue,
      thisMonth,
      lastMonth,
      percentage: Number(percentage.toFixed(1)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella ricerca della revenue" });
  }
};

exports.graphic = async (req, res) => {
  try {
    const range = req.query.range || "7_days"; // Legge il parametro, default 7 giorni
    let interval = "7 DAY"; // Valore SQL di base

    // Cambia l'intervallo SQL in base a cosa ha inviato il frontend
    switch (range) {
      case "30_days":
        interval = "30 DAY";
        break;
      case "3_months":
        interval = "3 MONTH";
        break;
      case "12_months":
        interval = "12 MONTH";
        break;
      default:
        interval = "7 DAY";
    }

    // Inseriamo la variabile "interval" direttamente nella query in modo sicuro
    const [data] = await db.execute(`
      SELECT
        DATE(date) AS day,
        SUM(total) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE date >= NOW() - INTERVAL ${interval} AND LOWER(status) = 'completed'
      GROUP BY day
      ORDER BY day;
    `);

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero dei dati del grafico" });
  }
};
