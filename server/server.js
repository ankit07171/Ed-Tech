import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

import mongoConnect from "./db/mongooseConnnection.js";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoute from "./routes/attendanceRoute.js";
import notificationRoutes from "./routes/notifyRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import noteRoutes from "./routes/noteRoute.js";
import meetRoutes from "./routes/meetRoutes.js";
import { setupMeetSocket } from "./socket/meetSocket.js";
import { setIO } from "./socket/ioInstance.js";
import { sanitizeInput, apiLimiter, authLimiter } from "./middleware/security.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:1845",
  "http://localhost:7171",
];

// Add production frontend URL if set
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

console.log("🔧 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
    
app.use(express.json());
app.use(cookieParser());
app.use(sanitizeInput);

// Security headers. CSP is left on report-only-ish defaults off because this
// API serves a separate SPA (no inline HTML rendered here) — the frontend
// build should set its own CSP if desired.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/notes", apiLimiter, noteRoutes);
app.use("/api/attendance", apiLimiter, attendanceRoute);
app.use("/api/notifications", apiLimiter, notificationRoutes);
app.use("/api/quizzes", apiLimiter, quizRoutes);
app.use("/api/meet", apiLimiter, meetRoutes);

// ---- Optional single-service SPA fallback ----
// This project is normally deployed as two Render services (a Static Site
// for client/dist, plus this API). Render's Static Site already reads
// client/public/_redirects and the root-level render.yaml routes to send
// unknown paths (e.g. a refresh on /student/quiz) to index.html so React
// Router can take over client-side.
//
// If you instead deploy this server ALONE and copy the built client into
// server/public (or set CLIENT_DIST_PATH), this block serves it — including
// "/" itself — and answers any other non-API GET with index.html too, same
// fix, just for a single-service setup. It's a no-op if no built client is
// found next to the server, so it's safe either way.
const clientDistPath =
  process.env.CLIENT_DIST_PATH ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const hasBundledClient = fs.existsSync(path.join(clientDistPath, "index.html"));

if (hasBundledClient) {
  console.log(`🖥️  Serving built client from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Server is Live ✅");
  });
}

// Centralized error handler — keeps error responses JSON (e.g. multer file
// filter/size rejections) instead of falling through to Express's default
// HTML error page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || "Something went wrong" });
});
 
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

setupMeetSocket(io);
setIO(io);
 
const startServer = async () => {
  try {
    await mongoConnect();
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
