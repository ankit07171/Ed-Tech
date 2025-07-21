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
      <h2 className="text-xl font-bold text-purple-700 mb-4">Available Notes</h2>
      {notes.map((note) => (
        <div key={note._id} className="bg-white p-4 mb-4 rounded shadow border">
          <h3 className="font-semibold text-lg">{note.title}</h3>
          <p className="text-sm text-gray-500">By: {note.uploadedBy?.fullName}</p>
          <a
            href={`http://localhost:7171/${note.filePath}`}
            download
            className="text-blue-600 underline mt-1 block"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
}
