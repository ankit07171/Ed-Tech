import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

/**
 * Accessible light/dark theme toggle.
 * Renders as a pill switch with sun/moon icons so its state is obvious
 * at a glance, and works from anywhere in the app via ThemeContext.
 */
export default function ThemeToggleButton({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full
        bg-gray-200 dark:bg-gray-700 transition-colors duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
        focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
        ${className}`}
    >
      <span
        className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full
          bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300
          ${isDark ? "translate-x-6" : "translate-x-0"}`}
      >
        {isDark ? (
          <Moon size={14} className="text-purple-300" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
