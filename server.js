const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");

const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3000;

const app = express();
app.set("trust proxy", 1); // Railway sta dietro un proxy
const server = http.createServer(app);

// ---------------------------------------------------------------
// Origini permesse (CORS e socket.io)
// Frontend e backend stanno sullo stesso dominio, quindi le richieste
// "same host" sono sempre ammesse. CLIENT_URL serve solo se in futuro
// usi un secondo dominio.
// ---------------------------------------------------------------
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5500"];

const isAllowedOrigin = (origin, host) =>
  !origin ||
  (host && origin.endsWith("//" + host)) ||
  allowedOrigins.includes(origin) ||
  !isProd;

const corsOptions = (req, callback) => {
  callback(null, {
    origin: isAllowedOrigin(req.header("Origin"), req.header("Host")),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
};

// ---------------------------------------------------------------
// Socket.io
// ---------------------------------------------------------------
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
  allowRequest: (req, callback) => {
    callback(null, isAllowedOrigin(req.headers.origin, req.headers.host));
  },
});
app.set("socket.io", io);

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.request.headers.cookie || "");
    const token = cookies.token;
    if (!token) return next(new Error("Non autenticato"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    console.error("Errore auth socket:", err.message);
    next(new Error("Token non valido"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
});

// ---------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Stretto sul login, ma conta solo i tentativi falliti
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Troppi tentativi, riprova tra qualche minuto." },
});

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://kit.fontawesome.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://ka-f.fontawesome.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
          "https://ka-f.fontawesome.com",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "wss:",
          "https://ka-f.fontawesome.com",
          "https://cdn.jsdelivr.net",
        ],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use("/api", limiter);
app.use("/api/auth/login", loginLimiter);
app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------
// File statici e pagina iniziale
// ---------------------------------------------------------------
const uploadsDir = isProd
  ? process.env.UPLOADS_DIR || "/data/uploads"
  : path.join(__dirname, "uploads");

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsDir),
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.redirect("/login.html"));
app.get("/health", (req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------
// API
// ---------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Rotta non trovata" }),
);

// Gestore errori: evita pagine HTML di errore e risposte doppie
app.use((err, req, res, next) => {
  console.error("Errore non gestito:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: "Errore interno del server" });
});

// ---------------------------------------------------------------
// Avvio e chiusura
// ---------------------------------------------------------------
process.on("unhandledRejection", (reason) => {
  console.error("Promise rifiutata e non gestita:", reason);
});

server.listen(port, () => {
  console.log(`Server avviato sulla porta ${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM ricevuto, chiusura del server...");
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
