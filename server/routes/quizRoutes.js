import express from "express";
import {
  createQuiz,
  getAllQuizzes,
  submitQuiz,
  getQuizAttempts,
  getStudentQuizAttempt,
  getQuizById,
  getAllQuizzesForTeacher
} from "../controllers/quizController.js";
import protect from "../middleware/protectRoute.js"; 
import { restrictTo } from "../middleware/restrictTo.js";



const router = express.Router();

router.get("/all",protect, getAllQuizzes);
router.post("/create", protect,restrictTo("teacher"), createQuiz);
router.post("/submit", protect,restrictTo("student"),submitQuiz);
router.get("/attempts/:quizId",protect, getQuizAttempts);
router.get("/student/attempt/:quizId", protect, getStudentQuizAttempt); 
router.get("/one/:quizId", protect, getQuizById); 
router.get("/teacher/all", protect, getAllQuizzesForTeacher);


export default router;
