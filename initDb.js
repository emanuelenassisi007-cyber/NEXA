const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("[initDb] Tentativo di connessione con:", {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.USER_DB || process.env.DB_USER || process.env.MYSQLUSER,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
});

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  try {
    const [rows] = await conn.query("SHOW TABLES LIKE 'users'");
    if (rows.length > 0) {
      console.log("[initDb] Tabella users già presente, non faccio nulla.");
      return;
    }
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await conn.query(sql);
    const [tables] = await conn.query("SHOW TABLES");
    console.log("[initDb] Tabelle create:", tables.length);
  } catch (err) {
    console.error("[initDb] Errore:", err.message);
  } finally {
    await conn.end();
  }
})();
