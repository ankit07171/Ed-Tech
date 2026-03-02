import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import mongoConnect from "./db/mongooseConnnection.js";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoute from "./routes/attendanceRoute.js";
import notificationRoutes from "./routes/notifyRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import noteRoutes from "./routes/noteRoute.js";
import meetRoutes from "./routes/meetRoutes.js";
import { setupMeetSocket } from "./socket/meetSocket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = "https://ed-tech-1-dz4e.onrender.com";
app.use(
  cors({
    origin: "https://ed-tech-1-dz4e.onrender.com",
    credentials: true,
  })
);
   
app.use(express.json());
app.use(cookieParser());

// ─────────────────────────────
// Static Files (uploads only)
// ─────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─────────────────────────────
// API Routes
// ─────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/attendance", attendanceRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/meet", meetRoutes);

// ─────────────────────────────
// Health Check
// ─────────────────────────────
app.get("/", (req, res) => {
  res.send("Server is Live ✅");
});

// ─────────────────────────────
// Socket.IO
// ─────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

setupMeetSocket(io);

// ─────────────────────────────
// Server Startup (LIKE FIRST APP)
// ─────────────────────────────
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
