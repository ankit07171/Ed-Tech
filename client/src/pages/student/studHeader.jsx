import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import {Moon, Sun} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx"; // 👈 Make sure path is correct

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/student" },
    { name: "About", path: "/student/about" },
    { name: "Attendance", path: "/student/attendance" },
    { name: "Notification", path: "/student/notification" },
    { name: "Quiz", path: "/student/quiz" },
    { name: "Meet", path: "/student/meet" },
    { name: "Notes", path: "/student/notes" },
    { name: "Logout", path: "/student/logout" },
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-50">
      <div className="max-w-full mx-auto px-8 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="QA Skills Logo" className="h-12 w-auto rounded-md" />
          <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">QA Skills</h1>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-gray-700 dark:text-gray-200 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              {link.name}
            </Link>
          ))}
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded transition text-black dark:text-white"
          >
            {!isDark ? <Moon className="w-5 h-5 text-purple-300"/>:
            <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </nav>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          {!menuOpen && (
            <button onClick={toggleMenu} className="text-2xl text-purple-700 dark:text-purple-300">
              <FiMenu />
            </button>
          )}
        </div>
      </div>

      {/* Slide-in Mobile Menu (Right Side) */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button Inside Menu */}
        <div className="flex justify-end p-4">
          <button onClick={toggleMenu} className="text-2xl text-purple-700 dark:text-purple-300">
            <FiX />
          </button>
        </div>

        <nav className="flex flex-col px-6 py-2 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 dark:text-gray-200 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              {link.name}
            </Link>
          ))}
          {/* Theme Toggle in Mobile */}
          <button
            onClick={toggleTheme}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded transition"
          >
            {isDark ? <Moon className="w-5 h-5 text-purple-300"/>:
            <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
