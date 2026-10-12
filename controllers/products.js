const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const createNotification = require("../config/notification");

const JWT_SECRET = process.env.JWT_SECRET;

exports.getProducts = async (req, res) => {
  const search = req.query.search || "";
  const searchProduct = req.query.searchProduct || "";

  const categoryType = req.query.categoryType || "";
  const typeService = req.query.typeService || "";
  const available = req.query.available || "";

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const productValue = `%${searchProduct}%`;
  const searchValue = `%${search}%`;
  const categoryValue = `%${categoryType}%`;
  const typeValue = `%${typeService}%`;
  const availableValue = `%${available}%`;

  const params = [
    searchValue,
    searchValue,
    searchValue,
    categoryValue,
    typeValue,
    availableValue,
  ];

  try {
    const query = `
      SELECT
        products.item AS item,
        products.category AS category,
        products.type AS type,
        products.price AS price,
        products.stock AS stock,
        products.availability AS availability
      FROM products
      WHERE (products.item LIKE ? OR products.category LIKE ? OR products.type LIKE ?)
        AND products.category LIKE ?
        AND products.type LIKE ?
        AND products.availability LIKE ?
      ORDER BY products.id DESC
      LIMIT ? OFFSET ?;
    `;

    params.push(limit, offset);
    const [products] = await db.execute(query, params);

    const countParams = [
      searchValue,
      searchValue,
      searchValue,
      categoryValue,
      typeValue,
      availableValue,
    ];

    const countQuery = `
      SELECT COUNT(products.id) AS total
      FROM products
      WHERE (products.item LIKE ? OR products.category LIKE ? OR products.type LIKE ?)
        AND products.category LIKE ?
        AND products.type LIKE ?
        AND products.availability LIKE ?;
    `;

    const [countResult] = await db.execute(countQuery, countParams);
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    const queryOrder = `
      SELECT item, category, price, stock
      FROM products
      WHERE (item LIKE ? 
         OR category LIKE ?
         OR CAST(price AS CHAR) LIKE ?)
      ORDER BY id DESC;
    `;

    const [query_order] = await db.execute(queryOrder, [
      productValue,
      productValue,
      productValue,
    ]);

    res.json({
      query_order: query_order,
      products: products,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.error("Errore get products:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.addProduct = async (req, res) => {
  const { name, category, price, stock } = req.body;

  const availability = "Available";

  const categorieProdotti = ["Beverages", "Electronics", "Furniture", "Food"];
  const type = categorieProdotti.includes(category) ? "Product" : "Service";

  try {
    const query = `INSERT INTO products(item, category, type, price, stock, availability) VALUES (?, ?, ?, ?, ?, ?)`;

    const [result] = await db.execute(query, [
      name,
      category,
      type,
      price,
      stock,
      availability,
    ]);

    res.json({
      message: "Prodotto inserito con successo",
    });
    createNotification(
      req,
      req.user.id,
      "Aggiornamento prodotti",
      "Nuovo prodotto",
      `Il prodotto ${name} è stato inserito o è tornato disponibile. Controlla per ulteriori informazioni`,
      true,
    ).catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
    res.json({ error: "Errore interno del server" });
  }
};
