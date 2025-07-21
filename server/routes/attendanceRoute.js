import express from "express";
import { attend, attendanceOnDate, getMyAttendance } from "../controllers/attendance.js";
import protect from "../middleware/protectRoute.js";
const router = express.Router();

router.post("/mark",protect,attend);
router.get("/:date",attendanceOnDate);
router.get('/user/me',protect, getMyAttendance);

export default router;
