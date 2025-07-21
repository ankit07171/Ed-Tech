import AuthHeader from "../components/header.jsx";
import Footer from "../components/footer.jsx"
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <>
      <AuthHeader />
      <div className="pt-16 min-h-screen px-4">
        <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default AuthLayout;
