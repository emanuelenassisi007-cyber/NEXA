const express = require("express");
const db = require("../config/database");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const authController = require("../controllers/authControllers");
const dashboard = require("../controllers/dashboard");
const customers = require("../controllers/customers");
const products = require("../controllers/products");
const orders = require("../controllers/orders");
const appointment = require("../controllers/appointments");
const users = require("../controllers/users");
const settings = require("../controllers/settings");
const logout = require("../controllers/logout");
const notifications = require("../controllers/notifications");
const mailValidator = require("../middleware/mailValidator");
const passwordValidator = require("../middleware/passwordValidator");
const authenticationToken = require("../middleware/authMiddleware");
const updateLastActivity = require("../middleware/lastActivity");
const cookieParser = require("cookie-parser");
const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const adminValidator = require("../middleware/adminValidator");

// Configurazione Cloudinary tramite le variabili d'ambiente di Railway
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage per inviare le immagini direttamente a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "nexa_uploads", // Cartella in cui verranno organizzati i file su Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const upload = multer({ storage: storage });
router.post(
  "/register",
  adminValidator,
  mailValidator,
  passwordValidator,
  authController.register,
);
router.post("/login", mailValidator, passwordValidator, authController.login);
router.post("/login-verify2FA", authController.loginVerify2FA);
router.get("/check-admin", async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) AS count FROM users WHERE role = "admin"',
    );

    const adminExists = result[0].count > 0;

    res.json({
      adminExists,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Errore interno del server",
    });
  }
});
router.get("/createAdmin", authController.createAdmin);
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ authenticated: false, error: "Utente non trovato" });
    }

    res.json({
      authenticated: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Errore nella rotta /me:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/forgot-password", mailValidator, authController.forgot_password);
router.post("/reset-password", authController.reset_password);
router.post(
  "/reset-password2",
  updateLastActivity,
  authController.reset_password2,
);
router.get(
  "/customers",
  authenticationToken,
  updateLastActivity,
  dashboard.customers,
);
router.get(
  "/products",
  authenticationToken,
  updateLastActivity,
  dashboard.products,
);
router.get(
  "/orders",
  authenticationToken,
  updateLastActivity,
  dashboard.orders,
);
router.patch(
  "/confirmeOrder/:id",
  authenticateToken,
  updateLastActivity,
  orders.confirmOrder,
);
router.patch(
  "/cancelOrder/:id",
  authenticateToken,
  updateLastActivity,
  orders.cancelOrder,
);
router.get(
  "/revenue",
  authenticationToken,
  updateLastActivity,
  dashboard.revenue,
);
router.get(
  "/graphic",
  authenticationToken,
  updateLastActivity,
  dashboard.graphic,
);
router.get(
  "/getCustomers",
  authenticationToken,
  updateLastActivity,
  customers.getCustomers,
);
router.post(
  "/addCustomer",
  authenticationToken,
  mailValidator,
  updateLastActivity,
  customers.addCustomer,
);
router.delete(
  "/deleteCustomer",
  authenticateToken,
  mailValidator,
  requireAdmin,
  updateLastActivity,
  customers.deleteCustomer,
);
router.get(
  "/getProducts",
  authenticationToken,
  updateLastActivity,
  products.getProducts,
);
router.post(
  "/addProduct",
  authenticationToken,
  updateLastActivity,
  products.addProduct,
);
router.get(
  "/getOrders",
  authenticationToken,
  updateLastActivity,
  orders.getOrders,
);
router.get(
  "/getUltimateOrder/:id",
  authenticationToken,
  updateLastActivity,
  orders.getUltimateOrder,
);
router.post(
  "/addOrders",
  authenticationToken,
  updateLastActivity,
  orders.addOrders,
);
router.get(
  "/getAppointments",
  authenticationToken,
  updateLastActivity,
  appointment.getAppointments,
);
router.post(
  "/addAppointment",
  authenticationToken,
  updateLastActivity,
  appointment.addAppointment,
);
router.delete(
  "/deleteAppointment",
  authenticationToken,
  updateLastActivity,
  requireAdmin,
  appointment.deleteAppointment,
);
router.patch(
  "/confirmAppointment",
  authenticationToken,
  updateLastActivity,
  requireAdmin,
  appointment.confirmAppointment,
);
router.get(
  "/getUsers",
  authenticationToken,
  updateLastActivity,
  users.getUsers,
);
router.post(
  "/addUser",
  authenticateToken,
  updateLastActivity,
  requireAdmin,
  users.addUser,
);
router.delete(
  "/deleteUser",
  authenticateToken,
  updateLastActivity,
  requireAdmin,
  users.deleteUser,
);
router.get(
  "/createPassword",
  authenticationToken,
  updateLastActivity,
  requireAdmin,
  users.createPassword,
);
router.post(
  "/savePassword",
  authenticationToken,
  updateLastActivity,
  requireAdmin,
  users.savePassword,
);
router.post(
  "/sendPassword",
  authenticationToken,
  updateLastActivity,
  requireAdmin,
  users.sendPassword,
);
router.post("/comparePassword", mailValidator, users.comparePassword);
router.get("/getStorage", authenticateToken, requireAdmin, settings.getStorage);
router.get("/getRecords", authenticateToken, requireAdmin, settings.getRecords);
router.get(
  "/createBackup",
  authenticateToken,
  requireAdmin,
  settings.createBackup,
);
router.post(
  "/autoBackup",
  authenticateToken,
  requireAdmin,
  settings.autoBackup,
);
router.get(
  "/lastBackup",
  authenticateToken,
  requireAdmin,
  updateLastActivity,
  settings.lastBackup,
);
router.get(
  "/exportData",
  authenticateToken,
  requireAdmin,
  updateLastActivity,
  settings.exportData,
);
router.get(
  "/exportMyData",
  authenticateToken,
  updateLastActivity,
  settings.exportMyData,
);
router.post(
  "/update-avatar",
  authenticateToken,
  upload.single("avatar"),
  updateLastActivity,
  settings.updateAvatar,
);
router.delete(
  "/deleteAvatar",
  authenticateToken,
  upload.single("avatar"),
  updateLastActivity,
  settings.deleteAvatar,
);
router.get(
  "/getUserProfile",
  authenticateToken,
  updateLastActivity,
  settings.getUserProfile,
);
router.post(
  "/setup2fa",
  authenticateToken,
  updateLastActivity,
  settings.setup2fa,
);
router.post(
  "/verify2fa",
  authenticateToken,
  updateLastActivity,
  settings.verify2fa,
);
router.post(
  "/disable2Fa",
  authenticateToken,
  updateLastActivity,
  settings.disable2Fa,
);
router.get(
  "/getBackups",
  authenticateToken,
  requireAdmin,
  updateLastActivity,
  settings.getBackups,
);
router.post(
  "/importData",
  authenticateToken,
  requireAdmin,
  updateLastActivity,
  settings.importData,
);
router.get(
  "/exportBackup",
  authenticateToken,
  requireAdmin,
  updateLastActivity,
  settings.exportBackup,
);
router.post(
  "/updateUser",
  authenticateToken,
  updateLastActivity,
  settings.updateUser,
);
router.get("/getNotifications", authenticateToken, settings.getNotifications);
router.get(
  "/getAllNotifications",
  authenticateToken,
  updateLastActivity,
  settings.getAllNotifications,
);
router.patch(
  "/setReadAll",
  authenticateToken,
  updateLastActivity,
  settings.readAllNotifications,
);
router.delete(
  "/deleteNotification",
  authenticationToken,
  updateLastActivity,
  settings.deleteNotification,
);
router.patch(
  "/readNotify/:id",
  authenticateToken,
  updateLastActivity,
  settings.readNotify,
);
router.patch(
  "/setUserTrueEmailNotify",
  authenticateToken,
  mailValidator,
  updateLastActivity,
  settings.setUserTrueEmailNotify,
);

router.patch(
  "/setNotifyOrders",
  authenticateToken,
  updateLastActivity,
  notifications.notifyOrders,
);

router.patch(
  "/setNotifyApp",
  authenticateToken,
  updateLastActivity,
  notifications.notifyApp,
);

router.patch(
  "/setNotifyCustomers",
  authenticateToken,
  updateLastActivity,
  notifications.notifyCustomers,
);

router.patch(
  "/setNotifyProducts",
  authenticateToken,
  updateLastActivity,
  notifications.notifyProducts,
);

router.patch(
  "/setNotifyUsers",
  authenticateToken,
  updateLastActivity,
  notifications.notifyUsers,
);

router.post(
  "/deleteWorkspace",
  authenticateToken,
  updateLastActivity,
  requireAdmin,
  passwordValidator,
  settings.deleteWorkspace,
);

router.post(
  "/deactivateAccount",
  authenticateToken,
  updateLastActivity,
  passwordValidator,
  settings.deactivateAccount,
);

router.post(
  "/logout",
  authenticateToken,
  passwordValidator,
  updateLastActivity,
  logout.logout,
);

module.exports = router;
