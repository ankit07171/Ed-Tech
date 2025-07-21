import StudentHeader from "../pages/student/studHeader.jsx";
import { Outlet } from "react-router-dom";

import Footer from "../components/footer.jsx"

const StudentLayout = () => {
  return (
    <>
      <StudentHeader />
      <div className="pt-16 min-h-screen px-4">
        <Outlet />
      </div>
      <Footer/>
    </>
  );
};

export default StudentLayout;
