import { Link } from "react-router-dom";

export default function TeacherQuizDashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">
        Quiz Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/teacher/quiz/create"
          className="bg-white dark:bg-gray-800 shadow hover:shadow-md p-6 rounded border border-gray-200 dark:border-gray-700 transition-all"
        >
          <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
            Create Quiz
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Design and publish new quizzes for your students.
          </p>
        </Link>

        <Link
          to="/teacher/quiz/all"
          className="bg-white dark:bg-gray-800 shadow hover:shadow-md p-6 rounded border border-gray-200 dark:border-gray-700 transition-all"
        >
          <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
            View All Quizzes
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            See all quizzes and student performance by quiz.
          </p>
        </Link>
      </div>
    </div>
  );
}
