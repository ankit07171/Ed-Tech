import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function QuizReview() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await axios.get(`/api/quizzes/student/attempt/${quizId}`, {
          withCredentials: true,
        });

        if (!res.data.attempted) {
          navigate(`/student/quiz/${quizId}`); // redirect to quiz if not attempted
        } else {
          setAttemptData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch attempt:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [quizId, navigate]);

  if (loading || !attemptData) {
    return <p className="text-center mt-10">Loading review...</p>;
  }

  const correctCount = attemptData.answers.filter(
    (a) => a.selected === a.correctAnswer
  ).length;
  const incorrectCount = attemptData.answers.length - correctCount;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-purple-700 mb-2">Quiz Review</h2>
      <p className="mb-6 text-lg">
        Your Score: <span className="font-semibold">{attemptData.score}</span> /{" "}
        {attemptData.total}
      </p>

      {/* Chart */}
      <div className="my-6 max-w-xs mx-auto">
        <Pie
          data={{
            labels: ["Correct", "Incorrect"],
            datasets: [
              {
                data: [correctCount, incorrectCount],
                backgroundColor: ["#34D399", "#F87171"],
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </div>

      {/* Answer Review */}
      {attemptData.answers.map((a, i) => {
        const isCorrect = a.selected === a.correctAnswer;
        return (
          <div
            key={i}
            className="mb-6 border rounded p-4 shadow-sm"
            style={{
              backgroundColor: isCorrect ? "#ecfdf5" : "#fef2f2",
              borderColor: isCorrect ? "#34D399" : "#F87171",
            }}
          >
            <p className="font-semibold mb-2">
              Q{i + 1}: {a.question}
            </p>
            <p>
              Your Answer:{" "}
              <span
                className={`font-semibold ${
                  isCorrect ? "text-green-700" : "text-red-600"
                }`}
              >
                {a.selected || "Not Answered"}
              </span>
            </p>
            {!isCorrect && (
              <p className="text-green-700">
                Correct Answer: <span className="font-semibold">{a.correctAnswer}</span>
              </p>

            )}
            <p className="mb-1 text-gray-600">
  Time Spent:{" "}
  <span className="font-medium">
    {Math.floor(attemptData.timeSpentInSeconds / 60)} min{" "}
    {attemptData.timeSpentInSeconds % 60} sec
  </span>
</p>

          </div>
        );
      })}

      <button
        onClick={() => navigate("/student/quiz")}
        className="mt-6 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Back to Quiz List
      </button>
    </div>
  );
}
