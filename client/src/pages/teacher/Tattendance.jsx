import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    const fetchStudents = async () => {
      const res = await axios.get("/api/auth/getStudent");
      setStudents(res.data);

      const initial = {};
      res.data.forEach((s) => (initial[s._id] = "absent"));
      setAttendance(initial);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`/api/attendance/${selectedDate}`);
        const map = {};
        res.data.records.forEach((r) => {
          if (r.studentId && r.status) {
            map[r.studentId.toString()] = r.status;
          }
        });

        const finalAttendance = {};
        students.forEach((s) => {
          finalAttendance[s._id] = map[s._id] || "absent";
        });

        setAttendance(finalAttendance);
      } catch (err) {
        if (err.response?.status === 404) {
          toast.info("No attendance found for this date.");
        } else {
          toast.error(err.response?.data?.error || "Failed to load attendance");
        }

        const defaultStatus = {};
        students.forEach((s) => (defaultStatus[s._id] = "absent"));
        setAttendance(defaultStatus);
      }
    };

    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const toggleStatus = (id) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  const handleSubmit = async () => {
    const records = students.map((s) => ({
      studentId: s._id,
      fullName: s.fullName,
      status: attendance[s._id] || "absent",
    }));

  try {
  await axios.post("/api/attendance/mark", {
    date: selectedDate,
    records,
  }, {
    withCredentials: true
  });
  alert("Attendance saved for " + selectedDate);
} catch (err) {
  console.error("Attendance save failed:", err.response?.data || err.message);
  alert("Error: " + (err.response?.data?.error || "Failed to save attendance"));
}
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">
        Mark Attendance
      </h2>

      <label className="block mb-2 font-medium">Select Date</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="mb-2 border p-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />

      <div className="mb-4 text-lg font-medium text-gray-700 dark:text-gray-300">
        <span className="text-green-500">✔ Present: {presentCount}</span>
        {" / "}
        <span className="text-red-400">✘ Absent: {absentCount}</span>
      </div>

      <div className="space-y-4">
        {students.map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between p-3 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <img
                src={s.profilePic}
                alt={s.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium dark:text-white">{s.fullName}</span>
            </div>
            <button
              onClick={() => toggleStatus(s._id)}
              className={`px-4 py-1 rounded-full text-white ${
                attendance[s._id] === "present" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {attendance[s._id]}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
      >
        Save Attendance
      </button>
    </div>
  );
}
