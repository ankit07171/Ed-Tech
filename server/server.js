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

// CORS Configuration - explicit for cross-origin cookies
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL]
  : ["http://localhost:5173", "http://localhost:1845", "http://localhost:7171"];

console.log("🔧 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || !process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);
    
app.use(express.json());
app.use(cookieParser());
 
app.use("/uploads", express.static("uploads"));
 
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/attendance", attendanceRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/meet", meetRoutes);
 
app.get("/", (req, res) => {
  res.send("Server is Live ✅");
});
 
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

setupMeetSocket(io);
 
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
