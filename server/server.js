import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; 
import mongoConnect from "./db/mongooseConnnection.js";
import http from "http";
import { Server } from "socket.io"; 

import authRoutes from "./routes/authRoutes.js"
import attendanceRoute from "./routes/attendanceRoute.js"
import notificationRoutes from "./routes/notifyRoutes.js";
import quizRoutes from "./routes/quizRoutes.js"; 
import noteRoutes from "./routes/noteRoute.js";
import meetRoutes from "./routes/meetRoutes.js"; 

import { setupMeetSocket } from "./socket/meetSocket.js";
// import path from "path";
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const io = new Server(server, { cors: { origin: "http://localhost:1845" },credentials:true });
setupMeetSocket(io);

app.use(
cors({
    origin: "http://localhost:1845",  
    credentials: true,                
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes); 
app.use("/api/notes", noteRoutes);
app.use("/api/attendance",attendanceRoute) 
app.use("/api/notifications", notificationRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/meet", meetRoutes);
  
const startServer = async () => {
  try {
    await mongoConnect();
    console.log("✅ MongoDB connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit app on DB failure
  }
};

startServer();
