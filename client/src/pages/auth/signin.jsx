// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
// import { IoEye, IoEyeOff } from "react-icons/io5";

// export default function Signin() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [otp, setOtp] = useState("");
//   const [timeLeft, setTimeLeft] = useState(300);
//   const [loadingOtp, setLoadingOtp] = useState(false);
//   const [loadingSignup, setLoadingSignup] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [form, setForm] = useState({
//     fullName: "",
//     email: "",
//     gender: "",
//     contact: "",
//     password: "",
//     confirmPassword: "",
//     role: "",
//   });

//   useEffect(() => {
//     if (step === 2 && timeLeft > 0) {
//       const interval = setInterval(() => {
//         setTimeLeft((prev) => prev - 1);
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [step, timeLeft]);

//   const formatTime = (sec) => {
//     const min = Math.floor(sec / 60);
//     const s = sec % 60;
//     return `${min}:${s.toString().padStart(2, "0")}`;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSendOtp = async (e) => {
//     e.preventDefault();
//     const { fullName, email, gender, contact } = form;

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!fullName || !email || !gender || !contact) {
//       return toast.error("Please fill all fields");
//     }
//     if (!emailRegex.test(email)) return toast.error("Invalid email format");
//     if (contact.length !== 10 || !/^\d{10}$/.test(contact))
//       return toast.error("Contact must be a 10-digit number");

//     setLoadingOtp(true);
//     try {
//       await axios.post("/api/auth/send-otp", { email });
//       toast.success("OTP sent to email");
//       setTimeLeft(300);
//       setStep(2);
//     } catch (err) {
//       toast.error(err.response?.data?.error || "OTP send failed");
//     } finally {
//       setLoadingOtp(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!otp) return toast.error("Please enter the OTP");
//     if (form.password !== form.confirmPassword) {
//       return toast.error("Passwords do not match");
//     }
//     if (form.password.length < 6) {
//       return toast.error("Password must be at least 6 characters");
//     }
//     if (timeLeft <= 0) {
//       return toast.error("OTP has expired. Please try again.");
//     }

//     setLoadingSignup(true);
//     try {
//       const payload = { ...form, userOtp: otp };
//       await axios.post("/api/auth/signup", payload);
//       toast.success("Signup successful!");
//       navigate("/login");
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Signup failed");
//     } finally {
//       setLoadingSignup(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 px-4">
//       <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
//         <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-purple-700">
//           Sign Up
//         </h2>

//         {step === 1 ? (
//           <form onSubmit={handleSendOtp} className="space-y-4">
//             <div className="relative">
//               <FaUser className="absolute left-3 top-3 text-gray-400" />
//               <input
//                 name="fullName"
//                 placeholder="Full Name"
//                 onChange={handleChange}
//                 required
//                 className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Gender
//               </label>
//               <div className="flex gap-4">
//                 {['male', 'female'].map((g) => (
//                   <label key={g} className="flex items-center gap-1">
//                     <input
//                       type="radio"
//                       name="gender"
//                       value={g}
//                       checked={form.gender === g}
//                       onChange={handleChange}
//                       required
//                     />
//                     <span>{g.charAt(0).toUpperCase() + g.slice(1)}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div className="relative">
//               <FaPhone className="absolute left-3 top-3 text-gray-400 scale-x-[-1]" />
//               <input
//                 name="contact"
//                 placeholder="Contact"
//                 onChange={handleChange}
//                 required
//                 className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
//               />
//             </div>

//             <div className="relative">
//               <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
//               <input
//                 name="email"
//                 placeholder="Email"
//                 onChange={handleChange}
//                 required
//                 className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loadingOtp}
//               className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
//             >
//               {loadingOtp ? "Sending OTP..." : "Send OTP"}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Enter OTP
//               </label>
//               <input
//                 type="text"
//                 placeholder="6-digit OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 required
//                 className="w-full p-3 border border-gray-300 rounded-lg"
//               />
//               <p className="text-sm mt-1 text-gray-500">
//                 {timeLeft > 0 ? (
//                   <>Time left: <span className="font-semibold">{formatTime(timeLeft)}</span></>
//                 ) : (
//                   <button
//                     type="button"
//                     disabled={loadingOtp}
//                     onClick={handleSendOtp}
//                     className="text-purple-600 font-medium hover:underline"
//                   >
//                     {loadingOtp ? "Resending..." : "Resend OTP"}
//                   </button>
//                 )}
//               </p>
//             </div>

//             <div className="relative">
//               <FaLock className="absolute left-3 top-3 text-gray-400" />
//               <input
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Password"
//                 onChange={handleChange}
//                 required
//                 className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg"
//               />
//               <span
//                 className="absolute right-3 top-3 text-gray-500 cursor-pointer"
//                 onClick={() => setShowPassword((prev) => !prev)}
//               >
//                 {showPassword ? <IoEyeOff /> : <IoEye />}
//               </span>
//             </div>

//             <div className="relative">
//               <FaLock className="absolute left-3 top-3 text-gray-400" />
//               <input
//                 name="confirmPassword"
//                 type={showConfirmPassword ? "text" : "password"}
//                 placeholder="Confirm Password"
//                 onChange={handleChange}
//                 required
//                 className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg"
//               />
//               <span
//                 className="absolute right-3 top-3 text-gray-500 cursor-pointer"
//                 onClick={() => setShowConfirmPassword((prev) => !prev)}
//               >
//                 {showConfirmPassword ? <IoEyeOff /> : <IoEye />}
//               </span>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//               <div className="flex gap-4">
//                 {['student', 'teacher'].map((role) => (
//                   <label key={role} className="flex items-center gap-1">
//                     <input
//                       type="radio"
//                       name="role"
//                       value={role}
//                       checked={form.role === role}
//                       onChange={handleChange}
//                       required
//                     />
//                     <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loadingSignup}
//               className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
//             >
//               {loadingSignup ? "Creating Account..." : "Sign Up"}
//             </button>
//           </form>
//         )}

//         <p className="mt-4 text-sm text-center">
//           Already have an account?{' '}
//           <span
//             className="text-purple-600 cursor-pointer font-medium hover:underline"
//             onClick={() => navigate("/login")}
//           >
//             Login here
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { IoEye, IoEyeOff } from "react-icons/io5";

export default function Signin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    gender: "",
    contact: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { fullName, email, gender, contact } = form;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName || !email || !gender || !contact) {
      return toast.error("Please fill all fields");
    }
    if (!emailRegex.test(email)) return toast.error("Invalid email format");
    if (contact.length !== 10 || !/^\d{10}$/.test(contact))
      return toast.error("Contact must be a 10-digit number");

    setLoadingOtp(true);
    try {
      await axios.post("/api/auth/send-otp", { email });
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
    e.preventDefault();

    if (!otp) return toast.error("Please enter the OTP");
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (timeLeft <= 0) {
      return toast.error("OTP has expired. Please try again.");
    }

    setLoadingSignup(true);
    try {
      const payload = { ...form, userOtp: otp };
      await axios.post("/api/auth/signup", payload);
      toast.success("Signup successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-purple-700 dark:text-white">
          Sign Up
        </h2>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                name="fullName"
                placeholder="Full Name"
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <div className="flex gap-4 dark:text-white">
                {["male", "female"].map((g) => (
                  <label key={g} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={handleChange}
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
                name="contact"
                placeholder="Contact"
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                name="email"
                placeholder="Email"
                onChange={handleChange}
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
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                {timeLeft > 0 ? (
                  <>
                    Time left:{" "}
                    <span className="font-semibold">{formatTime(timeLeft)}</span>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={loadingOtp}
                    onClick={handleSendOtp}
                    className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
                  >
                    {loadingOtp ? "Resending..." : "Resend OTP"}
                  </button>
                )}
              </p>
            </div>

            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <span
                className="absolute right-3 top-3 text-gray-500 dark:text-gray-300 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </span>
            </div>

            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <span
                className="absolute right-3 top-3 text-gray-500 dark:text-gray-300 cursor-pointer"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <IoEyeOff /> : <IoEye />}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <div className="flex gap-4 dark:text-white">
                {["student", "teacher"].map((role) => (
                  <label key={role} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange}
                      required
                    />
                    <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
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
          </form>
        )}

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
