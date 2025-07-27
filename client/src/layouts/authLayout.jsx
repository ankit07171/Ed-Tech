import AuthHeader from "../components/header.jsx";
import Footer from "../components/footer.jsx"
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <>
      <AuthHeader />
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">

        <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default AuthLayout;
