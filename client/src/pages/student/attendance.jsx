import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function Attendance() {
  const today = new Date();
  const [attendanceData, setAttendanceData] = useState({});
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get("/api/attendance/user/me", {withCredentials: true,});
        setAttendanceData(res.data);  
      } catch (err) {
        console.error("Failed to load attendance:", err);
      }
    };

    fetchAttendance();
  }, []);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const handlePrevMonth = () => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const daysInMonth = getDaysInMonth(year, month);
  const currentMonthName = new Date(year, month).toLocaleString("default", {
    month: "long",
  });

  // Monthly Summary
  let presentCount = 0;
  let absentCount = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const status = attendanceData[dateStr];
    if (status === "present") presentCount++;
    else if (status === "absent") absentCount++;
  }

  const totalPresent = Object.values(attendanceData).filter((v) => v === "present").length;
  const totalAbsent = Object.values(attendanceData).filter((v) => v === "absent").length;

  const barChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: `${currentMonthName} ${year}`,
        data: [presentCount, absentCount],
        backgroundColor: ["#34d399", "#f87171"],
      },
    ],
  };

  const doughnutData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [totalPresent, totalAbsent],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold",
          size: 14,
        },
        formatter: (value, ctx) => {
          const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / sum) * 100).toFixed(1) + "%";
          return percentage;
        },
      },
      legend: {
        position: "bottom",
        labels: {
          color: "#4b5563",
        },
      },
    },
  };

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">Attendance Report</h2>

      {/* Month switch */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <button onClick={handlePrevMonth} className="text-purple-600 hover:underline">
          ⬅ Prev
        </button>
        <h3 className="text-lg font-semibold">
          {currentMonthName} {year}
        </h3>
        <button onClick={handleNextMonth} className="text-purple-600 hover:underline">
          Next ➡
        </button>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2 text-center text-sm mb-8">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-semibold text-gray-600">
            {d}
          </div>
        ))}
        {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = attendanceData[dateStr];
          let bgColor = "bg-gray-100";
          if (status === "present") bgColor = "bg-green-200";
          else if (status === "absent") bgColor = "bg-red-200";
          return (
            <div
              key={dateStr}
              className={`p-2 rounded-md ${bgColor} border border-gray-200`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6 mb-3">
          <h3 className="text-lg font-semibold text-purple-700 mb-4">Monthly Summary</h3>
          <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white shadow-md rounded-xl p-6 mb-3">
          <h3 className="text-lg font-semibold text-purple-700 mb-4">Overall Attendance</h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
