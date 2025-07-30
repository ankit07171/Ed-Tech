import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function Signin() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timeLeft]);

  const formatTime = (sec) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName || !email || !gender || !contact)
      return toast.error("Please fill all fields");
    const trimmedEmail = email.trim();
    const trimmedContact = contact.trim().replace(/^0+/, ""); // remove leading zeros

    if (!emailRegex.test(trimmedEmail))
      return toast.error("Invalid email format");

    if (!/^\d+$/.test(trimmedContact) || trimmedContact.length !== 10) {
      return toast.error("Contact must be a 10-digit number");
    }

setEmail(trimmedEmail);
setContact(trimmedContact);
    setLoadingOtp(true);
    try {
      await axios.post("/api/auth/send-otp", { email: trimmedEmail });

      toast.success("OTP sent to email");
      setTimeLeft(300);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || "OTP send failed");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    const trimmedEmail = email.trim();
const trimmedContact = contact.trim().replace(/^0+/, "");

    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (timeLeft <= 0) return toast.error("OTP expired");

    setLoadingSignup(true);
    try {
      await axios.post("/api/auth/signup", {
        fullName,
        email: trimmedEmail,
        gender,
        contact: trimmedContact,
        password,
        confirmPassword,
        role,
        userOtp: otp,
      });

      toast.success("Signup successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-2rem)] bg-gradient-to-br from-purple-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-bold mb-6 text-center text-purple-700 dark:text-purple-400">
          Sign Up
        </h2>

        <form
          onSubmit={step === 1 ? handleSendOtp : handleSubmit}
          autoComplete="off"
          className="space-y-4"
        >
          <input
            type="text"
            name="fakeusernameremembered"
            autoComplete="off"
            style={{ display: "none" }}
            tabIndex={-1}
          />

          {step === 1 ? (
            <>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">
                  Gender
                </label>
                <div className="flex gap-4">
                  {["male", "female"].map((g) => (
                    <label
                      key={g}
                      className="flex items-center gap-1 dark:text-gray-300"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={(e) => setGender(e.target.value)}
                        required
                      />
                      <span>{g.charAt(0).toUpperCase() + g.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative">
                <FaPhone className="absolute left-3 top-3 text-gray-400 scale-x-[-1]" />
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={contact}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) setContact(val); // only allow digits
                  }}
                  required
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loadingOtp}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                {loadingOtp ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm mt-1 text-gray-500">
                  {timeLeft > 0 ? (
                    <>
                      Time left:{" "}
                      <span className="font-semibold">
                        {formatTime(timeLeft)}
                      </span>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={loadingOtp}
                      onClick={handleSendOtp}
                      className="text-purple-600 font-medium hover:underline"
                    >
                      {loadingOtp ? "Resending..." : "Resend OTP"}
                    </button>
                  )}
                </p>
              </div>

              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <span
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <IoEyeOff /> : <IoEye />}
                </span>
              </div>

              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <span
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                >
                  {showConfirmPassword ? <IoEyeOff /> : <IoEye />}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">
                  Role
                </label>
                <div className="flex gap-4">
                  {["student", "teacher"].map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-1 dark:text-gray-300"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={(e) => setRole(e.target.value)}
                        required
                      />
                      <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingSignup}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                {loadingSignup ? "Creating Account..." : "Sign Up"}
              </button>
            </>
          )}
        </form>

        <p className="mt-4 text-sm text-center dark:text-gray-300">
          Already have an account?{" "}
          <span
            className="text-purple-600 dark:text-purple-400 cursor-pointer font-medium hover:underline"
            onClick={() => navigate("/login")}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}
