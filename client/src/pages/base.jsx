import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { Moon, Sun } from "lucide-react";  

export default function Base() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const stats = [
    { label: "Active Students", value: "12,000+" },
    { label: "Expert Teachers", value: "500+" },
    { label: "Avg. Rating", value: "4.8 / 5" },
    { label: "Quizzes Attempted", value: "150k+" },
  ];

  const comments = [
    {
      text: "QA Skills made online learning so interactive and effective. Loved the dashboard!",
      user: "— Riya, NEET Aspirant",
    },
    {
      text: "Finally, a platform where teaching and managing students is seamless.",
      user: "— Mr. Singh, Math Teacher",
    },
    {
      text: "The doubt-solving and notes section is a game changer.",
      user: "— Kunal, JEE Prep",
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-white text-black dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 dark:text-white px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center py-4 max-w-6xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-purple-600 dark:text-purple-400"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          QA Skills
        </motion.h1>

        <div className="flex items-center gap-4 pt-20">
          {/* Toggle theme button */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-300" />}
          </motion.button>

          <motion.button
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl shadow transition"
            onClick={() => navigate("/login")}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Login / SignIn
          </motion.button>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        className="text-center mt-10 max-w-3xl mx-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-4xl font-bold text-purple-600 dark:text-purple-300 mb-4">Welcome to QA Skills</h2>
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-7">
          Your complete EdTech solution for quality learning and effective teaching. <br />
          Dive into interactive quizzes, live classes, and a smart progress tracker.
        </p>
      </motion.div>

      {/* Highlights Section */}
      <motion.div
        className="grid md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.3,
            },
          },
        }}
      >
        {[
          {
            title: "Interactive Learning",
            desc: "Quizzes, notes, and tools for fun learning.",
          },
          {
            title: "Skilled Teachers",
            desc: "Experienced educators across all subjects.",
          },
          {
            title: "Smart Dashboard",
            desc: "Track progress with clean reports & charts.",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="bg-gray-100 dark:bg-gray-700 shadow-lg rounded-xl p-6 text-center"
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mb-2">{item.title}</h3>
            <p className="text-gray-800 dark:text-gray-300">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gray-200 dark:bg-gray-800 rounded-xl text-center p-6 border border-purple-400 dark:border-purple-600"
          >
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">{stat.value}</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm">{stat.label}</div>
          </div>
        ))}
      </motion.div>
      {/* User Feedback / Comments */}
      <div className="mt-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 text-center mb-8">
          What Students & Teachers Say
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {comments.map((c, i) => (
            <motion.div
              key={i}
              className="bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900 dark:to-purple-700 p-5 rounded-xl shadow"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.2 }}
            >
              <p className="italic text-gray-900 dark:text-white mb-3">"{c.text}"</p>
              <p className="text-right text-purple-800 dark:text-purple-100 font-medium">{c.user}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
