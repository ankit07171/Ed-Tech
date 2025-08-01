import { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function TeacherNotesManager() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = Cookies.get("userRole");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get("/api/notes/all");
      setNotes(res.data);
    } catch (err) {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/notes/delete/${id}`, { withCredentials: true });
      toast.success("Note deleted successfully");
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete note");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">All Uploaded Notes</h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-300">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No notes found</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li
              key={note._id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{note.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Uploaded by: {note.uploadedBy?.fullName || "Unknown"}
                </p>
                <a
                  href={`/${note.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline text-sm"
                >
                  View File
                </a>
              </div>

              {note.uploadedBy?._id === Cookies.get("userId") && (
                <button
                  onClick={() => handleDelete(note._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
