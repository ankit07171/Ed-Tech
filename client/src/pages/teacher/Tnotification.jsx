import { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig.js";
import { toast } from "react-toastify";
import { useNotifications } from "../../context/NotificationContext.jsx";

export default function TeacherNotification() {
  const [form, setForm] = useState({ title: "", message: "" });
  const { notifications, refresh, markAllSeen } = useNotifications() || {};

  useEffect(() => {
    refresh?.();
  }, [refresh]);

  // Opening this page clears the unread badge, same as for students.
  useEffect(() => {
    markAllSeen?.();
  }, [markAllSeen]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const role = localStorage.getItem("role");
    if (role !== "teacher") {
      toast.error("Unauthorized: Only teachers can send notifications");
      return;
    }

    try {
      await axios.post("/api/notifications/create", form, {
        withCredentials: true,
      });
      toast.success("Notification posted");
      setForm({ title: "", message: "" });
      refresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send notification");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 pt-10">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
        <h2 className="text-xl font-bold text-purple-700 dark:text-white mb-4">
          Send Notification
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <textarea
            name="message"
            placeholder="Message"
            value={form.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Send
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">Recent Notifications</h3>
        <div className="space-y-3">
          {(notifications || []).map((n) => (
            <div key={n._id} className="bg-white dark:bg-gray-800 p-4 shadow rounded-md border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{n.message}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {n.createdBy?.fullName || "Admin"} · {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
