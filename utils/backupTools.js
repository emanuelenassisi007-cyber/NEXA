const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { escape, escapeId } = require("mysql2");

function getBackupRoot() {
  return process.env.BACKUP_DIR || path.join(__dirname, "..", "backups");
}

function sqlValue(v) {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Date || Buffer.isBuffer(v)) return escape(v);
  if (typeof v === "object") return escape(JSON.stringify(v));
  return escape(v);
}

async function dumpToFile(db, filePath) {
  const out = fs.createWriteStream(filePath, { encoding: "utf8" });
  const write = (txt) =>
    new Promise((resolve, reject) =>
      out.write(txt, (err) => (err ? reject(err) : resolve())),
    );

  try {
    await write(`-- NEXA backup ${new Date().toISOString()}\n\n`);
    await write("SET FOREIGN_KEY_CHECKS=0;\n\n");

    const [tables] = await db.query(
      "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'",
    );

    for (const row of tables) {
      const table = Object.values(row)[0];
      const [[create]] = await db.query(`SHOW CREATE TABLE ${escapeId(table)}`);

      await write(`DROP TABLE IF EXISTS ${escapeId(table)};\n`);
      await write(`${create["Create Table"]};\n\n`);

      const batch = 500;
      for (let offset = 0; ; offset += batch) {
        const [rows] = await db.query(
          `SELECT * FROM ${escapeId(table)} LIMIT ${batch} OFFSET ${offset}`,
        );
        if (rows.length === 0) break;

        const cols = Object.keys(rows[0])
          .map((c) => escapeId(c))
          .join(", ");
        const values = rows
          .map((r) => "(" + Object.values(r).map(sqlValue).join(", ") + ")")
          .join(",\n");
        await write(
          `INSERT INTO ${escapeId(table)} (${cols}) VALUES\n${values};\n\n`,
        );

        if (rows.length < batch) break;
      }
    }

    await write("SET FOREIGN_KEY_CHECKS=1;\n");
  } finally {
    await new Promise((resolve) => out.end(resolve));
  }
}

async function restoreFromFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");

  if (!/(NEXA backup|MySQL dump|MariaDB dump)/.test(sql.slice(0, 500))) {
    throw new Error("Il file non sembra un backup valido");
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.USER_DB || process.env.DB_USER || process.env.MYSQLUSER,
    password:
      process.env.PASSWORD_DB ||
      process.env.DB_PASSWORD ||
      process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}

module.exports = { getBackupRoot, dumpToFile, restoreFromFile };
