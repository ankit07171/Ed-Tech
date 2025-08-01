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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4">Quiz Attempts</h2>
      {attempts.map((a) => (
        <div
          key={a._id}
          className="p-4 mb-3 bg-white dark:bg-gray-800 shadow rounded border border-gray-100 dark:border-gray-700"
        >
          <h3 className="font-medium text-gray-800 dark:text-gray-100">
            Student: {a.student?.fullName || "Unknown"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Score: {a.score}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Time Taken: {formatTime(a.timeSpentInSeconds || 0)}
          </p>
        </div>
      ))}
    </div>
  );
}
