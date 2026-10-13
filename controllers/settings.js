const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../config/mailer");
const { bytes } = require("stream/consumers");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const os = require("os");
const {
  getBackupRoot,
  dumpToFile,
  restoreFromFile,
} = require("../utils/backupTools");
const otplib = require("otplib");
const authenticator = otplib.authenticator;
const QRCode = require("qrcode");
const { generateSecret, generateURI, verify } = require("otplib");

const cron = require("node-cron");
const { stdout, stderr } = require("process");
const JWT_SECRET = process.env.JWT_SECRET;
const createNotification = require("../config/notification");

const backupDir = path.join(__dirname, "..", "backups", "auto");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

exports.getStorage = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        ROUND(
          SUM(data_length + index_length) / 1024 / 1024,
          4
        ) AS total_mb
      FROM information_schema.tables
      WHERE table_schema = 'nexa_db';
    `);

    const storage = rows[0].total_mb || 0;

    res.json({
      storage: storage,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore interno del server",
    });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const folderAuto = path.join(__dirname, "..", "backups", "auto");
    const folderManual = path.join(__dirname, "..", "backups");

    if (!fs.existsSync(folderAuto))
      fs.mkdirSync(folderAuto, { recursive: true });
    if (!fs.existsSync(folderManual))
      fs.mkdirSync(folderManual, { recursive: true });

    const fileAuto = fs
      .readdirSync(folderAuto)
      .filter((f) => f.endsWith(".sql"));
    const fileManual = fs
      .readdirSync(folderManual)
      .filter((f) => f.endsWith(".sql"));

    const fileFisiciSuPC = [];

    fileAuto.forEach((filename) => {
      const stats = fs.statSync(path.join(folderAuto, filename));
      fileFisiciSuPC.push({
        filename,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        type: "automatic",
        date: stats.mtime,
      });
    });

    fileManual.forEach((filename) => {
      const stats = fs.statSync(path.join(folderManual, filename));
      fileFisiciSuPC.push({
        filename,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        type: "manual",
        date: stats.mtime,
      });
    });

    const [rowsDB] = await db.query("SELECT * FROM backups");
    const nomiFileNelDB = rowsDB.map((row) => row.filename);

    // AZIONE A: Se il file è sul PC ma NON nel DB -> Inseriscilo
    for (const file of fileFisiciSuPC) {
      if (!nomiFileNelDB.includes(file.filename)) {
        await db.execute(
          "INSERT INTO backups (filename, file_size, create_at, backup_type) VALUES (?, ?, ?, ?)",
          [file.filename, file.size, file.date, file.type],
        );
      }
    }

    // AZIONE B: Se il record è nel DB ma il file NON è sul PC -> Eliminalo
    const nomiFileSuPC = fileFisiciSuPC.map((f) => f.filename);

    for (const rowDB of rowsDB) {
      if (!nomiFileSuPC.includes(rowDB.filename)) {
        await db.execute("DELETE FROM backups WHERE id = ?", [rowDB.id]);
      }
    }

    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    let totalRecords = 0;

    for (const table of tables) {
      const tableName = table.TABLE_NAME;

      const [[result]] = await db.query(
        `SELECT COUNT(*) AS count FROM \`${tableName}\``,
      );

      totalRecords += result.count;
    }

    return res.json({
      success: true,
      records: totalRecords,
      collections: tables.length,
    });
  } catch (error) {
    console.error("Errore durante la sincronizzazione dei backup:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante l'allineamento dei dati.",
    });
  }
};

exports.createBackup = async (req, res) => {
  const now = new Date();
  const date = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .split(".")[0];

  const backupDir = getBackupRoot();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFileName = `backup_${date}.sql`;
  const backupFile = path.join(backupDir, backupFileName);

  try {
    await dumpToFile(db, backupFile);

    const stats = fs.statSync(backupFile);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const backupType = req.body?.backup_type || "manual";

    await db.execute(
      "INSERT INTO backups (filename, file_size, create_at, backup_type) VALUES (?, ?, ?, ?)",
      [backupFileName, sizeInMB, now, backupType],
    );

    res.json({
      success: true,
      message: "Backup creato correttamente",
      file: backupFileName,
      size_bytes: sizeInMB,
    });
  } catch (error) {
    console.error("Errore backup:", error);
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
    return res.status(500).json({
      success: false,
      message: "Errore durante il backup",
    });
  }

  try {
    await createNotification(
      req,
      req.user.id,
      "Backup",
      "Backup completato",
      "Il backup del database è stato creato con successo",
      true,
    );
  } catch (error) {
    console.error("Errore notifica backup:", error);
  }
};

exports.autoBackup = async (req, res) => {
  const { abilita } = req.body;
  const userId = req.user.id;

  try {
    await db.query("UPDATE users SET is_auto_backup_enabled = ? WHERE id = ?", [
      abilita ? 1 : 0,
      userId,
    ]);
    res.json({
      success: true,
      message: abilita
        ? "Backup automatico attivato!"
        : "Backup automatico disattivato.",
    });
    return await createNotification(
      req,
      req.user.id,
      "Backup automatico",
      abilita ? "Backup automatico attivato" : "Backup automatico disattivato",
      abilita
        ? "Il backup automatico è stato attivato correttamente. Verrà eseguito ogni giorno alle ore 03.00"
        : "Il backup automatico è stato disattivato",
      false,
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Errore del server" });
  }
};

cron.schedule("0 3 * * *", async () => {
  try {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE is_auto_backup_enabled = 1 LIMIT 1",
    );
    if (rows.length === 0) return;

    const dir = path.join(getBackupRoot(), "auto");
    fs.mkdirSync(dir, { recursive: true });

    const fileName = `auto-backup-${new Date().toISOString().slice(0, 10)}-${Date.now()}.sql`;
    const outputPath = path.join(dir, fileName);
    const now = new Date();

    try {
      await dumpToFile(db, outputPath);
    } catch (err) {
      console.error("❌ Errore durante il backup automatico:", err.message);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return;
    }

    const stats = fs.statSync(outputPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    await db.execute(
      "INSERT INTO backups (filename, file_size, create_at, backup_type) VALUES (?, ?, ?, ?)",
      [fileName, sizeInMB, now, "automatic"],
    );
  } catch (error) {
    console.error("❌ Errore nel controllo del Cron Job:", error);
  }
});
exports.lastBackup = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM backups ORDER BY create_at DESC LIMIT 1",
    );
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        lastBackup: "Nessun backup eseguito",
        fileName: "-",
      });
    }

    const ultimoBackup = rows[0];

    return res.json({
      success: true,
      date: ultimoBackup.create_at,
    });
  } catch (error) {
    console.error("Errore nella rotta lastBackup:", error);
    return res
      .status(500)
      .json({ success: false, error: "Errore interno del server" });
  }
};

exports.exportData = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const configurazioneTabelle = [
      {
        nomeTabella: "Users",
        nomeFoglio: "Users list",
        query: "SELECT * FROM users",
        colonne: [
          {
            header: "ID",
            key: "id",
            width: 10,
          },
          { header: "Nome", key: "full_name", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Last login", key: "last_login", width: 30 },
          { header: "Last activity", key: "last_activity", width: 30 },
        ],
      },
      {
        nomeTabella: "Products",
        nomeFoglio: "Products list",
        query: "SELECT * FROM products",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Item", key: "item", width: 25 },
          { header: "Category", key: "category", width: 30 },
          { header: "Type", key: "type", width: 30 },
          { header: "Price", key: "price", width: 30 },
          { header: "Stock", key: "stock", width: 30 },
          { header: "Availability", key: "availability", width: 30 },
          { header: "Date", key: "date", width: 30 },
        ],
      },
      {
        nomeTabella: "Orders",
        nomeFoglio: "Orders list",
        query: "SELECT * FROM orders",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Customer", key: "customer", width: 25 },
          { header: "Date", key: "date", width: 30 },
          { header: "Status", key: "status", width: 30 },
          { header: "Total", key: "total", width: 30 },
        ],
      },
      {
        nomeTabella: "Customers",
        nomeFoglio: "Customers list",
        query: "SELECT * FROM orders",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Name", key: "name", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Status", key: "status", width: 30 },
          { header: "Created At", key: "created_at", width: 30 },
          { header: "Phone", key: "phone", width: 30 },
        ],
      },
      {
        nomeTabella: "Orders Item",
        nomeFoglio: "Orders Item list",
        query: "SELECT * FROM orders_item",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Id Order", key: "order_id", width: 25 },
          { header: "Product", key: "product", width: 30 },
          { header: "Qauntity", key: "quantity", width: 30 },
          { header: "Price", key: "price", width: 30 },
        ],
      },
      {
        nomeTabella: "Appointments",
        nomeFoglio: "Appointments list",
        query: "SELECT * FROM appointments",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Title", key: "title", width: 25 },
          { header: "Client", key: "client", width: 30 },
          { header: "Date", key: "date", width: 30 },
          { header: "Start Time", key: "start_time", width: 30 },
          { header: "End Time", key: "end_time", width: 30 },
          { header: "Status", key: "status", width: 30 },
        ],
      },
      {
        nomeTabella: "Backups",
        nomeFoglio: "Backups list",
        query: "SELECT * FROM backups",
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "File Name", key: "filename", width: 25 },
          { header: "File Size", key: "file_size", width: 30 },
          { header: "Created At", key: "created_at", width: 30 },
          { header: "Backup Type", key: "backup_type", width: 30 },
        ],
      },
    ];
    for (const tab of configurazioneTabelle) {
      const [rows] = await db.execute(tab.query);
      const worksheet = workbook.addWorksheet(tab.nomeFoglio);
      worksheet.columns = tab.colonne;
      worksheet.getRow(1).font = { bold: true };
      worksheet.addRows(rows);
    }
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=export_completo_nexa_db.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
    await createNotification(
      req,
      req.user.id,
      "Esportazione dati",
      "Esportazione dati completata",
      "Hai esportato i dati del gestionale con successo. Consulta il file appena scaricato",
      true,
    );
  } catch (error) {
    console.error("Errore durante l'esportazione multi-tabella:", error);
    res.status(500).send("Errore durante l'esportazione dei dati.");
  }
};

exports.exportMyData = async (req, res) => {
  try {
    const id = req.user.id;
    const workbook = new ExcelJS.Workbook();
    const configurazioneTabelle = [
      {
        nomeFoglio: "My account",
        query: `
          SELECT
            id, full_name, email, role, last_login, last_activity,
            is_two_factor_enabled, is_auto_backup_enabled, email_notifications
          FROM users WHERE id = ?
        `,
        params: [id],
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Nome", key: "full_name", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Ruolo", key: "role", width: 15 },
          { header: "Ultimo login", key: "last_login", width: 25 },
          { header: "Ultima attività", key: "last_activity", width: 25 },
          { header: "2FA", key: "is_two_factor_enabled", width: 15 },
          ...(req.user.role.toUpperCase() === "ADMIN"
            ? [
                {
                  header: "Backup automatico",
                  key: "is_auto_backup_enabled",
                  width: 20,
                },
              ]
            : []),
          { header: "Notifiche email", key: "email_notifications", width: 20 },
        ],
      },
      {
        nomeFoglio: "Notifications",
        query: `
          SELECT id, type, title, message, is_read, created_at, is_important
          FROM notifications WHERE user_id = ? ORDER BY created_at DESC
        `,
        params: [id],
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Tipo", key: "type", width: 20 },
          { header: "Titolo", key: "title", width: 35 },
          { header: "Messaggio", key: "message", width: 60 },
          { header: "Letta", key: "is_read", width: 12 },
          { header: "Data", key: "created_at", width: 25 },
          { header: "Importante", key: "is_important", width: 15 },
        ],
      },
      {
        nomeFoglio: "Orders",
        query: `
          SELECT id, customer, date, status, total
          FROM orders WHERE customer = ? ORDER BY date DESC
        `,
        params: [req.user.full_name],
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Cliente", key: "customer", width: 30 },
          { header: "Data", key: "date", width: 25 },
          { header: "Stato", key: "status", width: 15 },
          { header: "Totale", key: "total", width: 15 },
        ],
      },
      {
        nomeFoglio: "Order items",
        // CORRETTO: Usiamo l'alias corretto o.customer direttamente nella WHERE
        query: `
          SELECT
            oi.id, oi.order_id, o.customer, o.date AS order_date,
            oi.product, oi.quantity, oi.price, (oi.quantity * oi.price) AS line_total
          FROM orders_item oi
          LEFT JOIN orders o ON o.id = oi.order_id
          WHERE o.customer = ?
          ORDER BY oi.order_id DESC, oi.id ASC
        `,
        params: [req.user.full_name],
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "ID Ordine", key: "order_id", width: 15 },
          { header: "Cliente", key: "customer", width: 30 },
          { header: "Data ordine", key: "order_date", width: 25 },
          { header: "Prodotto", key: "product", width: 35 },
          { header: "Quantità", key: "quantity", width: 15 },
          { header: "Prezzo unitario", key: "price", width: 20 },
          { header: "Totale riga", key: "line_total", width: 20 },
        ],
      },
      {
        nomeFoglio: "Appointments",
        // CORRETTO: Sostituito req.user.params con req.user.full_name
        query: `
          SELECT id, title, client, date, start_time, end_time, status
          FROM appointments WHERE client = ? ORDER BY date DESC, start_time ASC
        `,
        params: [req.user.full_name],
        colonne: [
          { header: "ID", key: "id", width: 10 },
          { header: "Titolo", key: "title", width: 35 },
          { header: "Cliente", key: "client", width: 30 },
          { header: "Data", key: "date", width: 20 },
          { header: "Ora inizio", key: "start_time", width: 15 },
          { header: "Ora fine", key: "end_time", width: 15 },
          { header: "Stato", key: "status", width: 20 },
        ],
      },
      {
        nomeFoglio: "Order summary",
        // CORRETTO: Aggiunto il filtro WHERE per evitare la fuga di dati di altri clienti
        query: `
          SELECT
            o.id AS order_id, c.name AS customer, c.email AS customer_email,
            c.phone AS customer_phone, o.date, o.status, o.total
          FROM orders o
          LEFT JOIN customers c ON c.name = o.customer
          WHERE o.customer = ?
          ORDER BY o.date DESC
        `,
        params: [req.user.full_name],
        colonne: [
          { header: "ID ordine", key: "order_id", width: 15 },
          { header: "Cliente", key: "customer", width: 30 },
          { header: "Email cliente", key: "customer_email", width: 35 },
          { header: "Telefono", key: "customer_phone", width: 20 },
          { header: "Data", key: "date", width: 25 },
          { header: "Stato", key: "status", width: 15 },
          { header: "Totale", key: "total", width: 15 },
        ],
      },
    ];

    for (const tab of configurazioneTabelle) {
      const [rows] = await db.execute(tab.query, tab.params || []);

      const worksheet = workbook.addWorksheet(tab.nomeFoglio);

      worksheet.columns = tab.colonne;

      worksheet.getRow(1).font = {
        bold: true,
      };

      worksheet.addRows(rows);
    }
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=export_completo_nexa_db.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
    await createNotification(
      req,
      req.user.id,
      "Esportazione dati",
      "Esportazione dati personali completata",
      "Hai esportato i tuoi dati personali con successo. Consulta il file appena scaricato",
      true,
    );
  } catch (error) {
    console.error("Errore durante l'esportazione dei dati personali", error);
    res.status(500).send("Errore durante l'esportazione dei dati.");
  }
};

exports.getBackups = async (req, res) => {
  const search = req.query.search || "";
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const value = `%${search}%`;

  try {
    const query = `
      SELECT 
        backups.id AS id,
        backups.filename AS name,
        backups.file_size AS size,
        backups.create_at AS date,
        backups.backup_type AS type
      FROM backups
      WHERE (
        backups.filename LIKE ?
        OR backups.file_size LIKE ?
        OR backups.backup_type LIKE ?
      )
      ORDER BY backups.id DESC
      LIMIT ? OFFSET ?;
    `;

    const queryParams = [value, value, value, limit, offset];
    const [getBackups] = await db.execute(query, queryParams);

    const statsQuery = `
      SELECT COUNT(*) AS totalBackups
      FROM backups
      WHERE filename LIKE ?
    `;

    const statsParams = [value];
    const [statsResult] = await db.execute(statsQuery, statsParams);
    const totalBackups = statsResult[0]?.totalBackups || 0;
    const totalPages = Math.ceil(totalBackups / limit);

    res.json({
      backups: getBackups,
      currentPage: page,
      totalPages: totalPages,
      totalBackups: totalBackups,
    });
  } catch (error) {
    console.error("Errore get backups:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.importData = async (req, res) => {
  const { filename, backup_type } = req.body;
  const userId = req.user.id;

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Non autorizzato" });
  }

  if (typeof filename !== "string" || !/^[\w.-]+\.sql$/.test(filename)) {
    return res
      .status(400)
      .json({ success: false, error: "Nome file non valido." });
  }

  const folder = backup_type === "automatic" ? "auto" : "";
  const backupFilePath = path.join(getBackupRoot(), folder, filename);

  if (!fs.existsSync(backupFilePath)) {
    return res.status(404).json({
      success: false,
      error: "File di backup non trovato sul server.",
    });
  }

  try {
    await restoreFromFile(backupFilePath);
  } catch (err) {
    console.error("❌ Errore di ripristino:", err.message);
    return res.status(500).json({
      success: false,
      error: "Errore durante l'importazione del database.",
    });
  }

  try {
    await createNotification(
      req,
      userId,
      "Importazione dati",
      "Importazione dati completata",
      "Hai importato i dati del backup con successo",
      false,
    );
  } catch (notifErr) {
    console.error("⚠️ Errore notifica di import:", notifErr);
  }

  res.json({ success: true, message: "Database ripristinato con successo!" });
};

exports.exportBackup = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Non autorizzato" });
  }

  const now = new Date().toISOString().slice(0, 10);
  const fileName = `export-nexa_db-${now}.sql`;
  const tmpFile = path.join(os.tmpdir(), `export-${Date.now()}.sql`);

  try {
    await dumpToFile(db, tmpFile);
  } catch (error) {
    console.error("❌ Errore esportazione:", error);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return res
      .status(500)
      .json({ error: "Errore durante la generazione del dump del database." });
  }

  res.download(tmpFile, fileName, async (err) => {
    fs.unlink(tmpFile, () => {});
    if (err) {
      console.error("Errore invio export:", err.message);
      return;
    }
    try {
      await createNotification(
        req,
        req.user.id,
        "Esportazione database",
        "Esportazione database completata",
        "Hai esportato i dati del database con successo",
        true,
      );
    } catch (e) {
      console.error("Errore notifica export:", e);
    }
  });
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nessun file caricato o formato non valido.",
      });
    }
    const avatarPath = req.file.path;
    const userId = req.user.id || 1;

    const [result] = await db.execute(
      `UPDATE users SET avatar = ? WHERE id = ?`,
      [avatarPath, userId],
    );

    res.json({
      message: "Avatar aggiornato con successo!",
      avatarUrl: avatarPath,
    });
    await createNotification(
      req,
      req.user.id,
      "Aggiornamento dati utente",
      "Aggiornamento foto profilo",
      "Hai aggiornato correttamente la tua foto profilo",
      false,
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore interno del server durante il salvataggio dell'avatar",
    });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id || 1;

    const [result] = await db.execute(
      `UPDATE users SET avatar = NULL WHERE id = ?`,
      [userId],
    );

    res.json({
      message: "Avatar eliminato con successo!",
    });
    const io = req.app.get("io") || req.app.get("socket.io");
    if (io) {
      io.to(`user:${req.user.id}`).emit("avatar_delete", { action: "delete" });
    }
    await createNotification(
      req,
      req.user.id,
      "Aggiornamento dati utente",
      "Aggiornamento foto profilo",
      "La tua foto profilo è stata eliminata. Se non sei stato tu, contatta l'email di supporto nella pagina Help. ",
      true,
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore interno del server durante il salvataggio dell'avatar",
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id || 1;

    const [rows] = await db.execute(
      `SELECT id, full_name, email, role, avatar FROM users WHERE id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.setup2fa = async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const [[user]] = await db.execute(
      `SELECT is_two_factor_enabled FROM users WHERE id = ?`,
      [userId],
    );

    if (user && user.is_two_factor_enabled) {
      return res.status(400).json({ error: "Il 2FA è già attivo." });
    }
    const secret = generateSecret();

    await db.execute("UPDATE users SET two_factor_secret = ? WHERE id = ?", [
      secret,
      userId,
    ]);

    const otpauth = generateURI({
      issuer: "Nexa",
      label: userEmail,
      secret: secret,
    });

    const imageUrl = await QRCode.toDataURL(otpauth);

    return res.json({ qrCodeUrl: imageUrl });
  } catch (error) {
    console.error("Errore setup 2FA:", error);
    return res
      .status(500)
      .json({ error: "Errore durante la configurazione 2FA." });
  }
};

exports.verify2fa = async (req, res) => {
  const { token } = req.body;
  const userId = Number(req.user.id);

  try {
    const [[user]] = await db.execute(
      "SELECT two_factor_secret FROM users WHERE id = ?",
      [userId],
    );

    if (!user || !user.two_factor_secret) {
      return res
        .status(400)
        .json({ error: "Setup non iniziato o sessione scaduta." });
    }

    const result = await verify({
      token: String(token).trim(),
      secret: String(user.two_factor_secret).trim(),
      epochTolerance: 30, // Tolleranza di sicurezza per l'orologio
    });

    if (result.valid) {
      await db.query(
        "UPDATE users SET is_two_factor_enabled = 1 WHERE id = ?",
        [userId],
      );

      await createNotification(
        req,
        req.user.id,
        "Autenticazione a due fattori",
        "Autenticazione a due fattori attivata",
        "Hai attivato la verifica a due fattori correttamente",
        true,
      );

      return res.json({ success: true, message: "2FA attivata con successo!" });
    } else {
      return res.status(400).json({ error: "Codice non valido, riprova." });
    }
  } catch (error) {
    console.error("Errore verifica 2FA:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.disable2Fa = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  try {
    const [[rows]] = await db.query(
      "SELECT two_factor_secret FROM users WHERE id = ?",
      [userId],
    );
    const user = rows;

    if (!user || !user.two_factor_secret) {
      return res
        .status(400)
        .json({ error: "La 2FA non è attiva per questo account." });
    }

    const result = await verify({
      token: String(token).trim(),
      secret: String(user.two_factor_secret).trim(),
    });

    if (!result.valid) {
      return res
        .status(400)
        .json({ error: "Codice errato. Impossibile disattivare la 2FA." });
    }

    await db.query(
      "UPDATE users SET two_factor_secret = NULL, is_two_factor_enabled = 0 WHERE id = ?",
      [userId],
    );

    res.json({
      success: true,
      message: "2FA disattivata con successo.",
    });
    await createNotification(
      req,
      req.user.id,
      "Autenticazione a due fattori",
      "Autenticazione a due fattori disattivata",
      "La verifica a due fattori è stata disabilitata per il tuo account. Il tuo account risulta essere meno sicuro. Attivala subito!",
      true,
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.updateUser = async (req, res) => {
  const { name, surname, email } = req.body;
  if (!name?.trim() || !surname?.trim() || !email?.trim()) {
    return res.status(400).json({
      message: "Tutti i campi sono obbligatori",
    });
  }
  try {
    const full_name = name + " " + surname;
    const query = `UPDATE users SET full_name = ?, email = ? WHERE id = ?`;
    await db.execute(query, [full_name, email.trim(), req.user.id]);

    await createNotification(
      req,
      req.user.id,
      "Aggiornamento dati",
      "Aggiornamento dati utente",
      "Hai correttamente aggiornato i tuoi dati personali",
      true,
    );
    res.status(200).json({ message: "Utente aggiornato" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Questa email è già utilizzata",
      });
    }
    res.status(500).json({
      error: "Errore del server",
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const query =
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
    const [notifications] = await db.execute(query, [req.user.id]);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero delle notifiche" });
  }
};

exports.readAllNotifications = async (req, res) => {
  try {
    const query = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
    await db.execute(query, [req.user.id]);
    res.json({ success: true, message: "Tutte le notifiche sono state lette" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella gestione delle notifiche" });
  }
};

exports.getAllNotifications = async (req, res) => {
  const idUser = req.user.id;
  const search = req.query.search || "";
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;
  const value = `%${search}%`;

  try {
    const query = `
      SELECT
        notifications.id AS id,
        notifications.type AS type,
        notifications.title AS title,
        notifications.message AS message,
        notifications.is_read AS is_read,
        notifications.created_at AS date
      FROM notifications
      WHERE notifications.user_id = ?
        AND (
          notifications.type LIKE ?
          OR notifications.title LIKE ?
          OR notifications.message LIKE ?
          OR notifications.created_at LIKE ?
        )
      ORDER BY notifications.id DESC
      LIMIT ? OFFSET ?
    `;

    const [getNotifications] = await db.execute(query, [
      idUser,
      value,
      value,
      value,
      value,
      limit,
      offset,
    ]);

    const statsQuery = `
      SELECT COUNT(*) AS totalNotifications
      FROM notifications
      WHERE notifications.user_id = ?
        AND (
          notifications.type LIKE ?
          OR notifications.title LIKE ?
          OR notifications.message LIKE ?
          OR notifications.created_at LIKE ?
        )
    `;

    const [statsResult] = await db.execute(statsQuery, [
      idUser,
      value,
      value,
      value,
      value,
    ]);
    const totalNotifications = statsResult[0]?.totalNotifications || 0;
    const totalPages = Math.ceil(totalNotifications / limit);

    res.json({
      notifications: getNotifications,
      currentPage: page,
      totalPages,
      totalNotifications,
    });
  } catch (error) {
    console.error("Errore get notifications:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.body;
    const newId = Number(id);
    const query = `DELETE FROM notifications WHERE id = ?`;
    const [result] = await db.execute(query, [newId]);

    res.status(200).json({
      message: "Notifica cancellata con successo",
      result: result,
    });
  } catch (error) {
    console.error("Errore del server", error);
    res.status(500).json({ errore: "Errore del server" });
  }
};

exports.setUserTrueEmailNotify = async (req, res) => {
  const { value } = req.body;
  try {
    const query = "UPDATE users SET email_notifications = ? WHERE id = ? ";
    await db.execute(query, [value, req.user.id]);

    res.status(200).json({
      message: "L'utente ora puo ricevere le notifiche tramite email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.readNotify = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const query =
      "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?";
    const [result] = await db.execute(query, [req.user.id, id]);
    res.json({ success: true, message: "La notifica è stata letta" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella gestione della notifica" });
  }
};

exports.deleteWorkspace = async (req, res) => {
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

    await db.query("SET FOREIGN_KEY_CHECKS = 0;");

    await db.query("TRUNCATE TABLE appointments;");
    await db.query("TRUNCATE TABLE customers;");
    await db.query("TRUNCATE TABLE notifications;");
    await db.query("TRUNCATE TABLE orders;");
    await db.query("TRUNCATE TABLE orders_item;");
    await db.query("TRUNCATE TABLE products;");
    await db.query("TRUNCATE TABLE users;");

    await db.query("SET FOREIGN_KEY_CHECKS = 1;");

    res.json({ message: "Gestionale eliminato con successo" });

    const dataEliminazione = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      dateStyle: "full",
      timeStyle: "medium",
    });

    await sendEmail({
      to: user.email,
      subject: "⚠️ AVVISO CRITICO: Eliminazione totale del gestionale Nexa",
      text: `AVVISO DI SICUREZZA: Il tuo gestionale Nexa è stato completamente eliminato in data ${dataEliminazione}. Tutti i dati aziendali, clienti, prodotti e ordini sono stati cancellati in modo permanente. Se non sei stato tu, contatta immediatamente il supporto tecnico.`,
      html: `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f4f5f7;
              color: #1e293b;
              margin: 0;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            .email-header {
              background-color: #991b1b;
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              font-size: 1.4rem;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .email-body {
              padding: 32px 24px;
            }
            .alert-box {
              background-color: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 24px;
            }
            .alert-box p {
              margin: 0;
              color: #991b1b;
              font-size: 0.95rem;
              line-height: 1.5;
              font-weight: 500;
            }
            .info-list {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 20px;
              margin: 20px 0;
            }
            .info-list ul {
              margin: 0;
              padding-left: 20px;
              color: #475569;
              font-size: 0.9rem;
              line-height: 1.6;
            }
            .warning-text {
              color: #64748b;
              font-size: 0.85rem;
              line-height: 1.5;
              margin-top: 24px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
            }
            .email-footer {
              background-color: #f8fafc;
              text-align: center;
              padding: 16px;
              color: #94a3b8;
              font-size: 0.8rem;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-header">
              <h1>⚠️ Avviso di Eliminazione Gestionale</h1>
            </div>
            <div class="email-body">
              <p style="margin-top: 0; font-size: 1.05rem;">Ciao <strong>${user.full_name}</strong>,</p>
              
              <div class="alert-box">
                <p>Ti informiamo che il tuo gestionale Nexa è stato <strong>completamente e permanentemente eliminato</strong> in data <strong>${dataEliminazione}</strong>.</p>
              </div>

              <p style="color: #475569; line-height: 1.5;">Come da te richiesto tramite autenticazione, l'intera struttura del database è stata pulita. I seguenti dati non sono più recuperabili:</p>

              <div class="info-list">
                <ul>
                  <li>Anagrafica Clienti, Prodotti e Ordini</li>
                  <li>Appuntamenti e storico registri</li>
                  <li>Impostazioni e dati di configurazione dell'area di lavoro</li>
                </ul>
              </div>

              <p class="warning-text">
                🔒 <strong>Importante:</strong> Se non sei stato tu a effettuare questa operazione o ritieni che si tratti di un accesso non autorizzato, ti invitiamo a mettere immediatamente in sicurezza il tuo account e contattare l'assistenza tecnica all'email: nexa.workspace@gmail.com.
              </p>
            </div>
            <div class="email-footer">
              <p style="margin: 0;">Nexa Workspace Security • Questa è una comunicazione di servizio automatica.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione", error);
    await db.query("SET FOREIGN_KEY_CHECKS = 1;").catch(() => {});
    res.status(500).json({ message: "Errore durante l'eliminazione" });
  }
};

exports.deactivateAccount = async (req, res) => {
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

    await db.query("SET FOREIGN_KEY_CHECKS = 0;");

    const query2 = `DELETE FROM users WHERE id = ?`;
    const [result] = await db.execute(query2, [req.user.id]);

    await db.query("SET FOREIGN_KEY_CHECKS = 1;");

    res.json({ message: "Account eliminato con successo" });

    const dataEliminazione = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      dateStyle: "full",
      timeStyle: "medium",
    });

    await sendEmail({
      to: user.email,
      subject: "⚠️ AVVISO CRITICO: Eliminazione totale del account",
      text: `AVVISO DI SICUREZZA: Il tuo account aziendale è stato completamente eliminato in data ${dataEliminazione}. Tutti i dati aziendali, ordini e preferenze sono stati cancellati in modo permanente. Se non sei stato tu, contatta immediatamente il supporto tecnico.`,
      html: `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f4f5f7;
              color: #1e293b;
              margin: 0;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            .email-header {
              background-color: #991b1b;
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              font-size: 1.4rem;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .email-body {
              padding: 32px 24px;
            }
            .alert-box {
              background-color: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 24px;
            }
            .alert-box p {
              margin: 0;
              color: #991b1b;
              font-size: 0.95rem;
              line-height: 1.5;
              font-weight: 500;
            }
            .info-list {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 20px;
              margin: 20px 0;
            }
            .info-list ul {
              margin: 0;
              padding-left: 20px;
              color: #475569;
              font-size: 0.9rem;
              line-height: 1.6;
            }
            .warning-text {
              color: #64748b;
              font-size: 0.85rem;
              line-height: 1.5;
              margin-top: 24px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
            }
            .email-footer {
              background-color: #f8fafc;
              text-align: center;
              padding: 16px;
              color: #94a3b8;
              font-size: 0.8rem;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-header">
              <h1>⚠️ Avviso di Eliminazione Account</h1>
            </div>
            <div class="email-body">
              <p style="margin-top: 0; font-size: 1.05rem;">Ciao <strong>${user.full_name}</strong>,</p>
              
              <div class="alert-box">
                <p>Ti informiamo che il tuo account aziendale Nexa è stato <strong>completamente e permanentemente eliminato</strong> in data <strong>${dataEliminazione}</strong>.</p>
              </div>

              <p style="color: #475569; line-height: 1.5;">Come da te richiesto tramite autenticazione, tutti i dati dell'account sono stati eliminati definitivamente. Da ora in poi non saranno più recuperabili:</p>

              <div class="info-list">
                <ul>
                  <li>Preferenze e settaggi dell'ambiente di lavoro</li>
                  <li>Appuntamenti, ordini e storico registri</li>
                  <li>Impostazioni e dati di configurazione dell'area di lavoro</li>
                </ul>
              </div>

              <p class="warning-text">
                🔒 <strong>Importante:</strong> Se non sei stato tu a effettuare questa operazione o ritieni che si tratti di un accesso non autorizzato, ti invitiamo a contattare l'assistenza tecnica all'email: nexa.workspace@gmail.com.
              </p>
            </div>
            <div class="email-footer">
              <p style="margin: 0;">Nexa Workspace Security • Questa è una comunicazione di servizio automatica.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione", error);
    await db.query("SET FOREIGN_KEY_CHECKS = 1;").catch(() => {});
    res.status(500).json({ message: "Errore durante l'eliminazione" });
  }
};
