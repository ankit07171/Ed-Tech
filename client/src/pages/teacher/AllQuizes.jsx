import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AllQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get("/api/quizzes/teacher/all");
        setQuizzes(response.data);
        console.log("Fetched quizzes:", response.data);
      } catch (err) {
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) return <p className="text-gray-500">Loading quizzes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 bg-white rounded shadow-md mt-6">
      <h2 className="text-xl font-bold mb-2 text-purple-700">All Quizzes</h2>
      {quizzes.length === 0 ? (
        <p className="text-gray-600">No quizzes found.</p>
      ) : (
        <ul className="space-y-2">
          {quizzes.map((quiz) => (
            <Link
              key={quiz._id}
              to={`/teacher/quiz/attempts/${quiz._id}`}
              className="block border p-3 rounded hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold text-lg">{quiz.title}</h3>
              <p className="text-sm text-gray-600">Questions: {quiz.total}</p>
              <p className="text-sm text-gray-500">Attempts: {quiz.attemptCount}</p>
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllQuizzes;
