import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
   
// const getCookie = (name) => {
//   const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
//   return match ? decodeURIComponent(match[2]) : null;
// };

export default function ProtectedRoute({ expectedRole, children }) {
   
 
  const token = Cookies.get("jwt");
  const role = Cookies.get("userRole");
 console.log(token,role);
 
  // if (!token || !role) return <Navigate to="/login" replace />;
  if (role !== expectedRole) return <Navigate to="/login" replace />;

  return children;
}
