import { useEffect, useState, useRef } from "react";
import axios from "../../utils/axiosConfig.js";
import { toast } from "react-toastify";

export default function TeacherNotesManager() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const userId = localStorage.getItem("userId");
  const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:7171";

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get("/api/notes/all");
      setNotes(res.data);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a PDF file");
    if (!title.trim()) return toast.error("Please enter a title");
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", file);

    setUploading(true);
    try {
      await axios.post("/api/notes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Note uploaded successfully");
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await axios.delete(`/api/notes/delete/${id}`);
      toast.success("Note deleted");
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete note");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">Notes Manager</h2>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl shadow mb-8 space-y-4">
        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300">Upload New Note</h3>
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          required
        />
        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:bg-purple-50 dark:hover:bg-gray-700 transition">
            <input
              type="file"
              accept="application/pdf"
              ref={fileRef}
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
            {file ? (
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">📄 {file.name}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm">Click to select a PDF file</span>
            )}
          </label>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Notes List */}
      <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300 mb-3">Uploaded Notes</h3>
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No notes uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note._id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{note.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">By: {note.uploadedBy?.fullName || "Unknown"}</p>
                <a
                  href={`${baseURL}/${note.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline text-sm"
                >
                  View PDF
                </a>
              </div>
              {note.uploadedBy?._id === userId && (
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
