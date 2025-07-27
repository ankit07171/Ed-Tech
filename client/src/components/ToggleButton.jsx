// // ThemeToggleButton.jsx
// import { useTheme } from "../context/ThemeContext";

// export default function ThemeToggleButton() {
//   const { isDark, toggleTheme } = useTheme();

//   return (
//     <button
//       onClick={toggleTheme}
//       className="px-4 py-2 rounded bg-gray-800 text-white dark:bg-white dark:text-black transition"
//     >
//       {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
//     </button>
//   );
// }

import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="pt-10 px-4 py-2 rounded bg-gray-800 text-white dark:bg-white dark:text-black transition"
    >
      {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    </button>
  );
}
