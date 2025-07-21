import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get("/api/quizzes/all", { withCredentials: true });
      setQuizzes(res.data);
    };
    fetch();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Available Quizzes</h2>
      {quizzes.map((q) => (
        <div
          key={q._id}
          className={`border p-4 mb-3 rounded shadow bg-white cursor-pointer transition-all duration-200
            ${
              q.attempted
                ? "border-green-500 bg-green-50 hover:bg-green-100"
                : "border-gray-300 hover:bg-gray-100"
            }`}
onClick={() => {
  if (q.attempted) {
    navigate(`/student/quiz/review/${q._id}`);
  } else {
    navigate(`/student/quiz/${q._id}`);
  }
}}

        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">{q.title}</span>
            {q.attempted && (
              <span className="text-green-700 text-sm font-medium">
                ✔ Attempted
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
