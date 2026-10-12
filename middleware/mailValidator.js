const validator = require("validator");

const mailValidator = (req, res, next) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    return res.status(400).json({
      error: "Il campo email è obbligatorio.",
    });
  }

  const trimmedEmail = email.trim();

  if (!validator.isEmail(trimmedEmail)) {
    return res.status(400).json({
      error: "Inserisci un indirizzo email valido (es. you@company.com).",
    });
  }

  // Manteniamo l'email originale, eliminando solo gli spazi
  req.body.email = trimmedEmail;

  next();
};

module.exports = mailValidator;
