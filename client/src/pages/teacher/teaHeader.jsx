// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { FiMenu, FiX } from "react-icons/fi";

// export default function Header() {
//   const [menuOpen, setMenuOpen] = useState(false);

//   const navLinks = [
//     { name: "Home", path: "/teacher" },
//     { name: "About", path: "/teacher/about" },
//     { name: "Attendance", path: "/teacher/attendance" },
//     { name: "Notification", path: "/teacher/notification" },
//     { name: "Quiz", path: "/teacher/quiz" },
//   { name: "Meet", path: "/teacher/meet" }, 
//     { name: "Notes", path: "/teacher/notes" }, 
//     { name: "Logout", path: "/teacher/logout" },
//   ];

//   const toggleMenu = () => setMenuOpen(!menuOpen);

//   return (
//     <header className="bg-white shadow-md fixed w-full z-50">
//       <div className="max-w-full mx-auto px-8 py-1 flex items-center justify-between">
//         <Link to="/" className="flex items-center gap-2">
//           <img src="/logo.png" alt="QA Skills Logo" className="h-15 w-auto" />
//           <h1 className="text-2xl font-bold text-purple-700">QA Skills</h1>
//         </Link>

//         {/* Desktop Menu */}
//         <nav className="hidden md:flex gap-6 items-center">
//           {navLinks.map((link) => (
//             <Link
//               key={link.name}
//               to={link.path}
//               className="text-gray-700 font-medium hover:text-purple-600 transition"
//             >
//               {link.name}
//             </Link>
//           ))}
//         </nav>

//         {/* Mobile Hamburger */}
//         <div className="md:hidden">
//           {!menuOpen && (
//             <button onClick={toggleMenu} className="text-2xl text-purple-700">
//               <FiMenu />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Right-Side Mobile Menu */}
//       <div
//         className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
//           menuOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//       >
//         {/* Close button inside menu */}
//         <div className="flex justify-end p-4">
//           <button onClick={toggleMenu} className="text-2xl text-purple-700">
//             <FiX />
//           </button>
//         </div>

//         <nav className="flex flex-col px-6 py-2 space-y-4">
//           {navLinks.map((link) => (
//             <Link
//               key={link.name}
//               to={link.path}
//               onClick={() => setMenuOpen(false)}
//               className="text-gray-700 font-medium hover:text-purple-600 transition"
//             >
//               {link.name}
//             </Link>
//           ))}
//         </nav>
//       </div>
//     </header>
//   );
// }




import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx"; // ✅ Ensure this exists and is correct

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/teacher" },
    { name: "About", path: "/teacher/about" },
    { name: "Attendance", path: "/teacher/attendance" },
    { name: "Notification", path: "/teacher/notification" },
    { name: "Quiz", path: "/teacher/quiz" },
    { name: "Meet", path: "/teacher/meet" },
    { name: "Notes", path: "/teacher/notes" },
    { name: "Logout", path: "/teacher/logout" },
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
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded transition text-black dark:text-white"
          >
            {!isDark ? (
              <Moon className="w-5 h-5 text-purple-300" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
        </nav>

        {/* Hamburger for Mobile */}
        <div className="md:hidden">
          {!menuOpen && (
            <button onClick={toggleMenu} className="text-2xl text-purple-700 dark:text-purple-300">
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
  {/* Top bar with Close + Toggle Theme */}
  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
    <button onClick={toggleMenu} className="text-2xl text-purple-700 dark:text-purple-300">
      <FiX />
    </button>

    {/* Toggle Theme Button */}
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition"
    >
      {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-300" />}
    </button>
  </div>

  {/* Navigation Links */}
  <nav className="flex flex-col px-6 py-4 space-y-4">
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
  </nav>
</div>

       </header>
  );
}
