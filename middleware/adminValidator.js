const db = require("../config/database");

const authenticationAdmin = async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) AS count FROM users WHERE role = "admin"',
    );

    const isAdmin = result[0].count > 0;

    if (isAdmin) {
      return res.status(403).json({
        message: "L'admin esiste già. Accesso non consentito.",
      });
    }

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Errore interno del server.",
    });
  }
};

module.exports = authenticationAdmin;
