import express from "express";
import {
  createQuiz,
  getAllQuizzes,
  submitQuiz,
  getQuizAttempts,
  getStudentQuizAttempt,
  getQuizById,
  getAllQuizzesForTeacher,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quizController.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

router.get("/all", protect, getAllQuizzes);
router.get("/teacher/all", protect, getAllQuizzesForTeacher);
router.post("/create", protect, restrictTo("teacher"), createQuiz);
router.put("/update/:quizId", protect, restrictTo("teacher"), updateQuiz);
router.delete("/delete/:quizId", protect, restrictTo("teacher"), deleteQuiz);
router.post("/submit", protect, restrictTo("student"), submitQuiz);
router.get("/attempts/:quizId", protect, getQuizAttempts);
router.get("/student/attempt/:quizId", protect, getStudentQuizAttempt);
router.get("/one/:quizId", protect, getQuizById);

export default router;
