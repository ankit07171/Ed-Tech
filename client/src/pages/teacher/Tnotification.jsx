import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function TeacherNotification() {
  const [form, setForm] = useState({ title: "", message: "" });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check role from cookie (readable client-side)
    const role = Cookies.get("userRole");
    if (role !== "teacher") {
      toast.error("Unauthorized: Only teachers can send notifications");
      return;
    }

    try {
      await axios.post("/api/notifications/create", form, {
        withCredentials: true, // send JWT cookie
      });
      toast.success("Notification posted");
      setForm({ title: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send notification");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl mt-10">
      <h2 className="text-xl font-bold text-purple-700 mb-4">Send Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <textarea
          name="message"
          placeholder="Message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
