import { useEffect, useState,useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; 

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
const startTimeRef = useRef(Date.now());

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  // const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/quizzes/one/${quizId}`, {
          withCredentials: true,
        });

        if (res.data && res.data.questions) {
          setQuiz(res.data);
          setAnswers(new Array(res.data.questions.length).fill(""));
        } else {
          toast.error("Quiz not found");
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        toast.error("Something went wrong");
      }
    };
    fetch();
  }, [quizId]);

  const handleSubmit = async () => {
    const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef) / 1000);

    try {
      await axios.post(
        "/api/quizzes/submit",
        { quizId, answers, timeSpentInSeconds },
        { withCredentials: true }
      );

      toast.success("Quiz submitted!");
      navigate(`/student/quiz/review/${quizId}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Submission failed");
    }
  };

  if (!quiz) return <p className="text-center mt-10 dark:text-gray-300">Loading quiz...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">{quiz.title}</h2>
      {quiz.questions.map((q, i) => (
        <div key={i} className="mb-6">
          <p className="mb-2 font-medium text-gray-800 dark:text-gray-100">{q.question}</p>
          {q.options.map((opt, j) => (
            <label key={j} className="block mb-1 text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                onChange={() => {
                  const updated = [...answers];
                  updated[i] = opt;
                  setAnswers(updated);
                }}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
      >
        Submit Quiz
      </button>
    </div>
  );
}
