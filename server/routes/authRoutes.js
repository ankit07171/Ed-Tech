import express from "express";  
import {
  logout,
  login,
  signup,
  getTeachers,
  getStudents,
  sendOtp,
  getDepartments,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authControllers.js";
import protect from "../middleware/protectRoute.js";

const router = express.Router();

// Authentication routes
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/signup", signup);
router.post("/send-otp", sendOtp);

// User profile routes
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Public routes
router.get("/departments", getDepartments);

// User listing routes (protected)
router.get("/teachers", protect, getTeachers);
router.get("/students", protect, getStudents);

export default router;
