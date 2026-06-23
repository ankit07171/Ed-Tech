import Quiz from "../models/quizModel.js";
import QuizAttempt from "../models/attemptModel.js";
import User from "../models/userModel.js";

// Create a new quiz by a teacher
export const createQuiz = async (req, res) => {
  const { title, questions } = req.body;
  const teacherId = req.user.id;
  try {
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher")
      return res.status(400).json({ error: "Invalid teacher" });
    const quiz = await Quiz.create({ title, questions, createdBy: teacherId });
    res.status(201).json({ message: "Quiz created", quiz });
  } catch (err) {
    res.status(500).json({ error: "Failed to create quiz" });
  }
};

// Update a quiz by teacher
export const updateQuiz = async (req, res) => {
  const { quizId } = req.params;
  const { title, questions } = req.body;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.createdBy.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });
    if (title) quiz.title = title;
    if (questions) quiz.questions = questions;
    await quiz.save();
    res.status(200).json({ message: "Quiz updated", quiz });
  } catch (err) {
    res.status(500).json({ error: "Failed to update quiz" });
  }
};

// Delete a quiz by teacher
export const deleteQuiz = async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.createdBy.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });
    await Quiz.findByIdAndDelete(quizId);
    await QuizAttempt.deleteMany({ quiz: quizId });
    res.status(200).json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete quiz" });
  }
};

// Get all quizzes with student attempt status
export const getAllQuizzes = async (req, res) => {
  try {
    const studentId = req.user.id;
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    const attempts = await QuizAttempt.find({ student: studentId });
    const attemptMap = new Map();
    attempts.forEach((a) => attemptMap.set(a.quiz.toString(), a));
    const quizzesWithStatus = quizzes.map((quiz) => {
      const attempt = attemptMap.get(quiz._id.toString());
      return {
        _id: quiz._id,
        title: quiz.title,
        attempted: !!attempt,
        score: attempt?.score ?? null,
        total: quiz.questions.length,
      };
    });
    res.status(200).json(quizzesWithStatus);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

// Submit a quiz attempt
export const submitQuiz = async (req, res) => {
  const { quizId, answers, timeSpentInSeconds } = req.body;
  const studentId = req.user.id;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    let score = 0;
    const formattedAnswers = quiz.questions.map((q, i) => {
      const selected = answers[i];
      if (selected === q.correctAnswer) score++;
      return { question: q.question, selected, correctAnswer: q.correctAnswer };
    });
    await QuizAttempt.create({ quiz: quizId, student: studentId, answers: formattedAnswers, score, timeSpentInSeconds });
    res.status(200).json({ message: "Submitted", score });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

// Get all attempts of a specific quiz
export const getQuizAttempts = async (req, res) => {
  const { quizId } = req.params;
  try {
    const attempts = await QuizAttempt.find({ quiz: quizId }).populate("student", "fullName email");
    res.status(200).json(attempts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};

// Get a student's own attempt for a specific quiz
export const getStudentQuizAttempt = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user.id;
  try {
    const attempt = await QuizAttempt.findOne({ quiz: quizId, student: studentId });
    if (!attempt) return res.status(200).json({ attempted: false });
    return res.status(200).json({
      attempted: true,
      score: attempt.score,
      total: attempt.answers.length,
      answers: attempt.answers,
      timeSpentInSeconds: attempt.timeSpentInSeconds,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quiz attempt" });
  }
};

// Get full quiz by ID
export const getQuizById = async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};

// Get all quizzes with attempt count for teacher dashboard
export const getAllQuizzesForTeacher = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    const attemptCounts = await QuizAttempt.aggregate([{ $group: { _id: "$quiz", count: { $sum: 1 } } }]);
    const attemptMap = new Map();
    attemptCounts.forEach((a) => attemptMap.set(a._id.toString(), a.count));
    const quizzesWithAttempts = quizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      total: quiz.questions.length,
      attemptCount: attemptMap.get(quiz._id.toString()) || 0,
    }));
    res.status(200).json(quizzesWithAttempts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};
