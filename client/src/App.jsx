
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useTheme } from "./context/ThemeContext.jsx";


// Public Pages
import Home from "./pages/home.jsx";
import About from "./components/about.jsx";
import Login from "./pages/auth/login.jsx";
import Signin from "./pages/auth/signin.jsx";
import Logout from "./pages/auth/Logout.jsx";
import Base from "./pages/base.jsx";

// Layouts
import AuthLayout from "./layouts/authLayout.jsx";
import StudentLayout from "./layouts/studentLayout.jsx";
import TeacherLayout from "./layouts/teacherLayout.jsx";

// Student Pages
import Attendance from "./pages/student/attendance.jsx";
import StudentNotification from "./pages/student/Snotification.jsx";
import QuizList from "./pages/student/QuizList.jsx";
import AttemptQuiz from "./pages/student/QuizAttempt.jsx";
import StudentNotesView from "./pages/student/notes.jsx";
import QuizReview from "./pages/student/QuizReview.jsx";
import StudentMeet from "./pages/student/JoinMeet.jsx";

// Teacher Pages
import TeacherAttendance from "./pages/teacher/Tattendance.jsx";
import TeacherNotification from "./pages/teacher/Tnotification.jsx";
import CreateQuiz from "./pages/teacher/CreateQuiz.jsx";
import ViewAttempts from "./pages/teacher/ViewAttempt.jsx";
import TeacherUploadNotes from "./pages/teacher/NotesUpload.jsx";
import TeacherQuizDashboard from "./pages/teacher/Quiz.jsx";
import AllQuizzes from "./pages/teacher/AllQuizes.jsx";
import TeacherMeet from "./pages/teacher/CreateMeet.jsx";

export default function App() {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? "dark" : ""}>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Base />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signin />} />
            <Route path="/student/logout" element={<Logout />} />
            <Route path="/teacher/logout" element={<Logout />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute expectedRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="notification" element={<StudentNotification />} />
            <Route path="quiz" element={<QuizList />} />
            <Route path="quiz/:quizId" element={<AttemptQuiz />} />
            <Route path="quiz/review/:quizId" element={<QuizReview />} />
            <Route path="notes" element={<StudentNotesView />} />
            <Route path="meet" element={<StudentMeet />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute expectedRole="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="notification" element={<TeacherNotification />} />
            <Route path="quiz/create" element={<CreateQuiz />} />
            <Route path="quiz" element={<TeacherQuizDashboard />} />
            <Route path="quiz/all" element={<AllQuizzes />} />
            <Route path="quiz/attempts/:quizId" element={<ViewAttempts />} />
            <Route path="notes" element={<TeacherUploadNotes />} />
            <Route path="meet" element={<TeacherMeet />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </div>
  );
}