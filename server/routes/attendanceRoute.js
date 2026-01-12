import express from "express";
import { attend, attendanceOnDate, getMyAttendance } from "../controllers/attendance.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

// Teacher only
router.post("/mark", protect, restrictTo("teacher"), attend);

// Any authenticated user
router.get("/:date", protect, attendanceOnDate);

// Student only
router.get("/user/me", protect, restrictTo("student"), getMyAttendance);

export default router;
    