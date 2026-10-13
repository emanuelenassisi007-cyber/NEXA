const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const helmet = require("helmet");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
app.use(express.json());
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5500"];
const corsOptions = (req, callback) => {
  const origin = req.header("Origin");
  const sameHost = origin && origin.endsWith("//" + req.header("Host"));
  const allowed =
    !origin ||
    sameHost ||
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV !== "production";

  callback(null, {
    origin: allowed,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
};

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

app.use(cors(corsOptions));

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Troppi tentativi, riprova tra qualche minuto." },
});

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
        imgSrc: ["'self'", "data:", "blob:"],
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
app.use("/api", limiter);
app.use("/api/auth/login", loginLimiter);
app.use(cookieParser());
app.set("socket.io", io);

const uploadsDir =
  process.env.NODE_ENV === "production"
    ? "/data/uploads"
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
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

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

  socket.on("disconnect", (reason) => {});
});

const port = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);

server.listen(port, () => {
  console.log(`Server avviato sulla porta ${port}`);
});
