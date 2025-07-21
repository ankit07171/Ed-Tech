import TeacherHeader from "../pages/teacher/teaHeader.jsx";
import { Outlet } from "react-router-dom";
import Footer from "../components/footer.jsx"

const TeacherLayout = () => {
  return (
    <>
      <TeacherHeader />
      <div className="pt-16 min-h-screen px-4">
        <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default TeacherLayout;
