import StudentHeader from "../pages/student/studHeader.jsx";
import { Outlet } from "react-router-dom";

import Footer from "../components/footer.jsx"

const StudentLayout = () => {
  return (
    <>
      <StudentHeader />
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen pt-16 px-4">
   <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default StudentLayout;
