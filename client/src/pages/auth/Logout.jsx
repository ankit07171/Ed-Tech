import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie"; // ✅ ADD THIS

export default function Logout() {
  const navigate = useNavigate();
  const role = Cookies.get("userRole");
  const [showConfirm, setShowConfirm] = useState(true);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed");
      navigate(`/${role}`);
    }
  };

  const handleCancel = () => {
    navigate(`/${role}`);
  };

  return (
    <div className="p-6 flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
      {showConfirm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Are you sure you want to log out?
          </h2>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
