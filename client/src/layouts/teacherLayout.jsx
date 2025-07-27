import TeacherHeader from "../pages/teacher/teaHeader.jsx";
import { Outlet } from "react-router-dom";
import Footer from "../components/footer.jsx"

const TeacherLayout = () => {
  return (
    <>
      <TeacherHeader />
       <div className="pt-16 px-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
  <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default TeacherLayout;
