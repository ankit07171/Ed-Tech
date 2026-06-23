import { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig.js";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AllQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null); // quiz object being edited
  const [editTitle, setEditTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get("/api/quizzes/teacher/all");
      setQuizzes(res.data);
    } catch {
      toast.error("Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Delete this quiz and all its attempts?")) return;
    try {
      await axios.delete(`/api/quizzes/delete/${quizId}`);
      toast.success("Quiz deleted");
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) return toast.error("Title cannot be empty");
    try {
      await axios.put(`/api/quizzes/update/${editingQuiz._id}`, { title: editTitle });
      toast.success("Quiz updated");
      setQuizzes((prev) =>
        prev.map((q) => (q._id === editingQuiz._id ? { ...q, title: editTitle } : q))
      );
      setEditingQuiz(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    }
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-300 p-6">Loading quizzes...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">All Quizzes</h2>

      {quizzes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No quizzes found.</p>
      ) : (
        <ul className="space-y-3">
          {quizzes.map((quiz) => (
            <li
              key={quiz._id}
              className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{quiz.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Questions: {quiz.total} &nbsp;|&nbsp; Attempts: {quiz.attemptCount}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/teacher/quiz/attempts/${quiz._id}`}
                  className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                >
                  View
                </Link>
                <button
                  onClick={() => { setEditingQuiz(quiz); setEditTitle(quiz.title); }}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(quiz._id)}
                  className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-4">Edit Quiz Title</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllQuizzes;
