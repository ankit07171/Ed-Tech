// pages/auth/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await axios.post("/api/auth/logout", {
          withCredentials: true, // send cookie for deletion
        });
        toast.success("Logged out successfully");
        navigate("/login");
      } catch (err) {
        console.error("Logout failed:", err);
        toast.error("Logout failed");
      }
    };

    logout();
  }, [navigate]);

  return <div className="p-6 text-center text-gray-500">Logging out...</div>;
}
