import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "Student";

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    { name: "Home", path: "/student" },
    { name: "About", path: "/student/about" },
    { name: "Attendance", path: "/student/attendance" },
    { name: "Notification", path: "/student/notification" },
    { name: "Quiz", path: "/student/quiz" },
    { name: "Meet", path: "/student/meet" },
    { name: "Notes", path: "/student/notes" },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-50">
      <div className="max-w-full mx-auto px-8 py-2 flex items-center justify-between">
        <Link to="/student" className="flex items-center gap-2">
          <img src="/logo.png" alt="QA Skills Logo" className="h-12 w-auto rounded-md" />
          <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">QA Skills</h1>
        </Link>

        {/* Desktop Navigation */}
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="text-sm text-purple-600 dark:text-purple-300 font-semibold border border-purple-300 px-3 py-1 rounded-full hover:bg-purple-50 dark:hover:bg-gray-700 transition"
            >
              👤 {userName} ▾
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          {!menuOpen && (
            <button onClick={() => setMenuOpen(true)} className="text-2xl text-purple-700 dark:text-purple-300">
              <FiMenu />
            </button>
          )}
        </div>
      </div>

      {/* Slide-in Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setMenuOpen(false)} className="text-2xl text-purple-700 dark:text-purple-300">
            <FiX />
          </button>
          <span className="text-sm text-purple-600 dark:text-purple-300 font-semibold">👤 {userName}</span>
        </div>
        <nav className="flex flex-col px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 dark:text-gray-200 font-medium hover:text-purple-600 transition"
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-left text-red-600 dark:text-red-400 font-medium hover:underline"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
