import AuthHeader from "../components/header.jsx";
import Footer from "../components/footer.jsx"
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <>
      <AuthHeader />
      {/* pt-20 clears the fixed AuthHeader — without it the header overlapped
          the top of the Base page, hiding the "Login / Sign Up" button under
          the logo bar so only the description looked visible. */}
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen pt-20">

        <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default AuthLayout;
