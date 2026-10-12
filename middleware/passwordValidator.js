const validator = require("validator");

const passwordValidator = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Il campo password è obbligatorio." });
  }

  const isStrong = validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });

  if (!isStrong) {
    return res.status(400).json({
      error:
        "La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un simbolo.",
    });
  }

  next();
};

module.exports = passwordValidator;
