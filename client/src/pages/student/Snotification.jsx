import { useEffect, useState } from "react";
import axios from "axios";

export default function StudentNotification() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get("/api/notifications/all");
      setNotes(res.data);
    };
    fetch();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-20">
      <h2 className="text-2xl font-bold text-purple-700 mb-6">Notifications</h2>
      <div className="space-y-4">
        {notes.map((n) => (
          <div key={n._id} className="bg-white p-4 shadow rounded-md">
            <h3 className="text-lg font-semibold text-gray-800">{n.title}</h3>
            <p className="text-gray-600">{n.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              Posted by: {n.createdBy?.fullName || "Admin"} | {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-gray-500">No notifications yet.</p>}
      </div>
    </div>
  );
}
