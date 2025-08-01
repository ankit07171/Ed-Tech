import { useEffect, useState } from "react";
import axios from "axios";

export default function StudentNotesView() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get("/api/notes/all");
      setNotes(res.data);
    };
    fetch();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4">Available Notes</h2>
      {notes.map((note) => (
        <div key={note._id} className="bg-white dark:bg-gray-800 p-4 mb-4 rounded shadow border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{note.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">By: {note.uploadedBy?.fullName}</p>
          <a
            href={`https://ed-tech-44mp.onrender.com${note.filePath}`}
            download
            className="text-blue-600 dark:text-blue-400 underline mt-1 block"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
}
