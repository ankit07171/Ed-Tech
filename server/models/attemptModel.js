import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        question: String,
        selected: String,
        correctAnswer: String,
      },
    ],
    score: { type: Number, required: true },
    timeSpentInSeconds: { type: Number, required: true },
    proctoring: {
      tabSwitches: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      blurCount: { type: Number, default: 0 },
      autoSubmitted: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", attemptSchema);
