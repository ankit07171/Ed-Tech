import { useEffect, useState } from "react";
import axios from "axios";

const sliderImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlQMVHbSTbRz706LNvzALQH3O3MtGPcLSApA&s",
  "https://www.ahaguru.com/new-website-assets/img/testseries_banner_desk.jpg",
  "https://vidyahub.net/blog/content/Best-NEET-Coaching-Institutes-in-Delhi-copy.webp",
  "https://www.ahaguru.com/new-website-assets/img/testseries_banner_desk.jpg",
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [teachers, setTeachers] = useState([]);

  // Auto slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get("/api/auth");
        setTeachers(res.data);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto">
      {/* Slider Section */}
      <div className="w-full h-64 md:h-[400px] overflow-hidden rounded-xl shadow-lg mb-10">
        <img
          src={sliderImages[currentIndex]}
          alt="Slider"
          className="w-full h-full object-cover transition-all duration-500"
        />
      </div>

      {/* Teachers Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-purple-700 text-center">Meet Our Teachers</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher._id}
              className="bg-gray-50 rounded-lg shadow-md p-4 flex flex-col items-center text-center hover:shadow-xl transition duration-300"
            >
              <img
                src={teacher.profilePic}
                alt={teacher.fullName}
                className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-purple-500"
              />
              <h3 className="text-lg font-semibold text-gray-800">{teacher.fullName}</h3>
              <p className="text-sm text-gray-600 mb-1">{teacher.email}</p>
              <p className="text-sm text-purple-600 font-medium">Subject: Physics</p> {/* Example profession */}
            </div>
          ))}
        </div>

        {teachers.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No teachers found.</p>
        )}
      </div>
    </div>
  );
}
