import express from "express";
import { attend, attendanceOnDate, getMyAttendance } from "../controllers/attendance.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";
const router = express.Router();

router.post("/mark",protect,restrictTo("teacher"),attend);
router.get("/:date",protect,attendanceOnDate);
router.get('/user/me',protect,restrictTo("student"), getMyAttendance);

export default router;
