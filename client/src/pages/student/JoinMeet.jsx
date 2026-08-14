import { useState } from "react";
import MeetingRoom from "../meet/MeetingRoom.jsx";

const BASE = import.meta.env.VITE_BASE_URL || "http://localhost:7171";

export default function StudentJoinMeet() {
  const [code, setCode] = useState("");
  const [activeCode, setActiveCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(false);

  const studentName = localStorage.getItem("userName") || "Student";

  const joinMeet = async () => {
    const trimCode = code.trim().toUpperCase();
    if (!trimCode) return setErrorMsg("Enter a meet code");
    setErrorMsg("");
    setChecking(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/api/meet/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code: trimCode }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(`Error: ${data.error || res.status}`); setChecking(false); return; }
      if (!data.valid) { setErrorMsg("Invalid meet code"); setChecking(false); return; }
    } catch (err) {
      setErrorMsg(`Cannot reach server: ${err.message}`);
      setChecking(false);
      return;
    }

    setChecking(false);
    setActiveCode(trimCode);
  };

  const handleExit = (reason) => {
    setActiveCode(null);
    setCode("");
    if (reason === "ended") setErrorMsg("The teacher ended the meeting.");
    else if (reason === "teacher-left") setErrorMsg("The teacher left the meeting.");
    else if (reason === "removed") setErrorMsg("You were removed from the meeting.");
  };

  if (activeCode) {
    return <MeetingRoom code={activeCode} role="student" name={studentName} onExit={handleExit} />;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300">Join a Meet</h2>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm px-3 py-2 rounded">
            {errorMsg}
          </div>
        )}

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && joinMeet()}
          placeholder="Enter meet code e.g. ABC123"
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={joinMeet}
          disabled={checking}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded font-semibold transition"
        >
          {checking ? "Checking…" : "Join Meet"}
        </button>
      </div>
    </div>
  );
}
