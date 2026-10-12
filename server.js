const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const helmet = require("helmet");
const path = require("path");
const http = require("http");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
app.use(express.json());
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5500"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Bloccato da CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));

/*const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});*/

app.use(helmet());
//app.use(limiter);
app.use(cookieParser());
app.set("socket.io", io);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

io.use((socket, next) => {
  try {
    const cookies = cookie.parse(socket.request.headers.cookie || "");
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

server.listen(port, () => {});
