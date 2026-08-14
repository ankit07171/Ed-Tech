import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();
  const showLoginButton = pathname !== "/login" && pathname !== "/signup";

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-50">
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <img src="/logo.png" alt="QA Skills Logo" className="h-12 w-auto rounded-lg" />
          <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            QA Skills
          </h1>
        </Link>

        {/* Always-visible login entry point — previously the only way in was
            a button further down the Base page, which the fixed header used
            to cover anyway. */}
        {showLoginButton && (
          <Link
            to="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition"
          >
            Login / Sign Up
          </Link>
        )}
      </div>
    </header>
  );
}
