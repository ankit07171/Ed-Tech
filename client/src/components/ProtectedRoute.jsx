import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ expectedRole, children }) {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== expectedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
