import { useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/quizzes/create", {
        title,
        questions
      });
      toast.success("Quiz Created!");
      setTitle("");
      setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: "" }]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create quiz");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">Create Quiz</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz Title"
          required
          className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg"
        />

        {questions.map((q, i) => (
          <div key={i} className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
            <input
              value={q.question}
              onChange={(e) => handleChange(i, "question", e.target.value)}
              placeholder={`Question ${i + 1}`}
              required
              className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {q.options.map((opt, j) => (
              <input
                key={j}
                value={opt}
                onChange={(e) => handleOptionChange(i, j, e.target.value)}
                placeholder={`Option ${j + 1}`}
                required
                className="w-full mb-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            ))}
            <select
              value={q.correctAnswer}
              onChange={(e) => handleChange(i, "correctAnswer", e.target.value)}
              className="w-full p-2 border mt-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select correct answer</option>
              {q.options.map((opt, j) => (
                <option key={j} value={opt}>
                  {opt || `Option ${j + 1}`}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          + Add Question
        </button>

        <button
          type="submit"
          className="ml-4 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Save Quiz
        </button>
      </form>
    </div>
  );
}
