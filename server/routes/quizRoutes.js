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



const router = express.Router();

router.get("/all",protect, getAllQuizzes);
router.post("/create", protect, createQuiz);
router.post("/submit", protect,submitQuiz);
router.get("/attempts/:quizId", getQuizAttempts);
router.get("/student/attempt/:quizId", protect, getStudentQuizAttempt); 
router.get("/one/:quizId", protect, getQuizById); 
router.get("/teacher/all", protect, getAllQuizzesForTeacher);


export default router;
