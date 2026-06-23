import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "../../utils/axiosConfig.js";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "../../index.css";
 
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token && role) return <Navigate to={`/${role}`} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userName", user.fullName);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("profilePic", user.profilePic || "");

      toast.success("Logged in!");
      navigate(user.role === "student" ? "/student" : "/teacher", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-800 dark:to-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-bold mb-6 text-center text-blue-700 dark:text-white">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center dark:text-gray-300">
          Don&apos;t have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer font-medium hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign up here
          </span>
        </p>
      </div>
    </div>
  );
}
