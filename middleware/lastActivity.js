const db = require("../config/database");
const updateLastActivity = async (req, res, next) => {
  try {
    const query = `UPDATE users SET last_activity = NOW() WHERE id = ?`;
    await db.execute(query, [req.user.id]);
    next();
  } catch (error) {
    console.error(error);
    next();
  }
};

module.exports = updateLastActivity;
