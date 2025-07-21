import { Link } from "react-router-dom";

export default function TeacherQuizDashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-700 mb-6">Quiz Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/teacher/quiz/create" className="bg-white shadow hover:shadow-md p-6 rounded border border-gray-200 transition-all">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">Create Quiz</h3>
          <p className="text-gray-600">Design and publish new quizzes for your students.</p>
        </Link>

        <Link to="/teacher/quiz/all" className="bg-white shadow hover:shadow-md p-6 rounded border border-gray-200 transition-all">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">View All Quizzes</h3>
          <p className="text-gray-600">See all quizzes and student performance by quiz.</p>
        </Link>
      </div>
    </div>
  );
}