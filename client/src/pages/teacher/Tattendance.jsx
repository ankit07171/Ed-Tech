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

      const initial = Object.fromEntries(res.data.map(s => [s._id, "absent"]));
      setAttendance(initial);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (students.length === 0) return;

      try {
        const res = await axios.get(`/api/attendance/${selectedDate}`);
        const map = {};
        res.data.records.forEach(r => { if (r.studentId && r.status) map[r.studentId] = r.status; });

        const finalAttendance = Object.fromEntries(students.map(s => [s._id, map[s._id] || "absent"]));
        setAttendance(finalAttendance);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to load attendance");
      }
    };

    fetchAttendance();
  }, [selectedDate, students]);

  const toggleStatus = id => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  };

  const handleSubmit = async () => {
    const records = students.map(s => ({ studentId: s._id, fullName: s.fullName, status: attendance[s._id] }));
    try {
      await axios.post("/api/attendance/mark", { date: selectedDate, records });
      toast.success("Attendance saved!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save attendance");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Mark Attendance</h2>
      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      <div className="space-y-4">
        {students.map(s => (
          <div key={s._id} className="flex justify-between border p-2 rounded">
            <span>{s.fullName}</span>
            <button onClick={() => toggleStatus(s._id)} className={`px-3 py-1 ${attendance[s._id] === "present" ? "bg-green-500" : "bg-red-500"} text-white`}>
              {attendance[s._id]}
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded">Save Attendance</button>
    </div>
  );
}
