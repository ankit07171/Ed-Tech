import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Fetch all students
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

  // Fetch attendance for selected date
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

    if (students.length > 0) {fetchAttendance();}
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

    await axios.post("/api/attendance/mark", {
      date: selectedDate,
      records,
    });

    alert("Attendance saved for " + selectedDate);
  };

  // ✅ Calculate summary dynamically
  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        Mark Attendance
      </h2>

      <label className="block mb-2 font-medium">Select Date</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="mb-2 border p-2 rounded"
      />

      {/* ✅ Attendance Summary */}
      <div className="mb-4 text-lg font-medium text-gray-700">
        <span className="text-green-600">✔ Present: {presentCount}</span>
        {" / "}
        <span className="text-red-500">✘ Absent: {absentCount}</span>
      </div>

      <div className="space-y-4">
        {students.map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm"
          >
            <div className="flex items-center gap-4">
              <img
                src={s.profilePic}
                alt={s.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium">{s.fullName}</span>
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
        className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
      >
        Save Attendance
      </button>
    </div>
  );
}
