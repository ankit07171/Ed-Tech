import { useState } from "react";
import axios from "../../utils/axiosConfig.js";
import MeetingRoom from "../meet/MeetingRoom.jsx";

export default function TeacherMeet() {
  const [code, setCode] = useState(localStorage.getItem("meetCode") || "");
  const [started, setStarted] = useState(false);
  const [genError, setGenError] = useState("");
  const teacherName = localStorage.getItem("userName") || "Teacher";

  const generateCode = async () => {
    setGenError("");
    try {
      const res = await axios.post("/api/meet/create");
      const newCode = res.data.code;
      setCode(newCode);
      localStorage.setItem("meetCode", newCode);
    } catch {
      setGenError("Failed to generate a code. Are you logged in?");
    }
  };

  const handleExit = () => {
    localStorage.removeItem("meetCode");
    setStarted(false);
    setCode("");
  };

  if (started && code) {
    return <MeetingRoom code={code} role="teacher" name={teacherName} onExit={handleExit} />;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300">Start a Live Meet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Everyone who joins with this code will see and hear each other, just like a video call.
        </p>

        {genError && (
          <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm px-3 py-2 rounded">
            {genError}
          </div>
        )}

        {code ? (
          <div className="flex items-center justify-between bg-purple-50 dark:bg-gray-700 px-3 py-2 rounded">
            <span className="font-mono font-bold tracking-widest text-purple-700 dark:text-purple-300">{code}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Copy
            </button>
          </div>
        ) : (
          <button
            onClick={generateCode}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
          >
            Generate Code
          </button>
        )}

        <button
          onClick={() => setStarted(true)}
          disabled={!code}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:opacity-50 transition"
        >
          Start Meet
        </button>
      </div>
    </div>
  );
}
