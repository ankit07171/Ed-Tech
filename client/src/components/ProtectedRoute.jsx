import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ expectedRole, children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Not logged in at all
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role — redirect to their own dashboard
  if (role !== expectedRole) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
}
