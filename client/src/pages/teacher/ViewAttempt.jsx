import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function ViewAttempts() {
  const { quizId } = useParams();
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`/api/quizzes/attempts/${quizId}`);
      setAttempts(res.data);
    };
    fetchData();
  }, [quizId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-purple-700 mb-4">Quiz Attempts</h2>
      {attempts.map((a) => (
        <div
          key={a._id}
          className="p-4 mb-3 bg-white shadow rounded border border-gray-100"
        >
          <h3 className="font-medium text-gray-800">
            Student: {a.student?.fullName || "Unknown"}
          </h3>
          <p className="text-sm text-gray-500">Score: {a.score}</p>
        </div>
      ))}
    </div>
  );
}
