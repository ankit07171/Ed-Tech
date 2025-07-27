// export default function About() {
//   return (
//     <div className="pt-24 px-6 py-4 max-w-6xl mx-auto">
//       {/* Header */}
//       <h1 className="text-4xl font-bold text-center text-purple-700 mb-6">About QA Skills</h1>

//       {/* Intro Section */}
//       <p className="text-gray-700 text-lg leading-7 text-center mb-10">
//         <strong>QA Skills</strong> is a cutting-edge EdTech platform designed to bridge the gap between students and quality learning.
//         Whether you're a student preparing for competitive exams or a teacher passionate about sharing knowledge,
//         QA Skills is your perfect learning companion.
//       </p>

//       {/* Highlights */}
//       <div className="grid md:grid-cols-3 gap-6 mb-12">
//         <div className="bg-white shadow-md rounded-xl p-6 text-center">
//           <h3 className="text-xl font-semibold text-purple-600 mb-2">Interactive Learning</h3>
//           <p className="text-gray-600">Engaging quizzes, notes, and doubt-solving tools for active and fun learning.</p>
//         </div>
//         <div className="bg-white shadow-md rounded-xl p-6 text-center">
//           <h3 className="text-xl font-semibold text-purple-600 mb-2">Skilled Teachers</h3>
//           <p className="text-gray-600">Learn from highly experienced and passionate educators across subjects.</p>
//         </div>
//         <div className="bg-white shadow-md rounded-xl p-6 text-center">
//           <h3 className="text-xl font-semibold text-purple-600 mb-2">Smart Dashboard</h3>
//           <p className="text-gray-600">Track your progress, attendance, and performance through intuitive charts and reports.</p>
//         </div>
//       </div>

//       {/* Praise Section */}
//       <h2 className="text-2xl font-bold text-purple-700 text-center mb-6">What Our Users Say</h2>
//       <div className="grid md:grid-cols-2 gap-6">
//         <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl shadow">
//           <p className="italic text-gray-700 mb-3">
//             "QA Skills has completely changed how I prepare for exams. The quizzes and notes are top-notch!"
//           </p>
//           <p className="text-right text-purple-600 font-medium">— Aditi, Student</p>
//         </div>
//         <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-xl shadow">
//           <p className="italic text-gray-700 mb-3">
//             "As a teacher, the platform makes it super easy to manage students, share notes, and run live sessions."
//           </p>
//           <p className="text-right text-purple-600 font-medium">— Mr. Rajan, Physics Teacher</p>
//         </div>
//       </div>
//     </div>
//   );
// }


export default function About() {
  return (
    <div className="pt-24 px-6 py-4 max-w-6xl mx-auto bg-white text-black dark:bg-gray-900 dark:text-white">
      <h1 className="text-4xl font-bold text-center text-purple-700 dark:text-purple-300 mb-6">About QA Skills</h1>

      <p className="text-gray-700 dark:text-gray-300 text-lg leading-7 text-center mb-10">
        <strong>QA Skills</strong> is a cutting-edge EdTech platform designed to bridge the gap between students and quality learning.
        Whether you're a student preparing for competitive exams or a teacher passionate about sharing knowledge,
        QA Skills is your perfect learning companion.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: "Interactive Learning",
            desc: "Engaging quizzes, notes, and doubt-solving tools for active and fun learning."
          },
          {
            title: "Skilled Teachers",
            desc: "Learn from highly experienced and passionate educators across subjects."
          },
          {
            title: "Smart Dashboard",
            desc: "Track your progress, attendance, and performance through intuitive charts and reports."
          }
        ].map((item, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 shadow-md rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 text-center mb-6">What Our Users Say</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 p-6 rounded-xl shadow">
          <p className="italic text-gray-700 dark:text-gray-300 mb-3">
            "QA Skills has completely changed how I prepare for exams. The quizzes and notes are top-notch!"
          </p>
          <p className="text-right text-purple-600 dark:text-purple-300 font-medium">— Aditi, Student</p>
        </div>
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-6 rounded-xl shadow">
          <p className="italic text-gray-700 dark:text-gray-300 mb-3">
            "As a teacher, the platform makes it super easy to manage students, share notes, and run live sessions."
          </p>
          <p className="text-right text-purple-600 dark:text-purple-300 font-medium">— Mr. Rajan, Physics Teacher</p>
        </div>
      </div>
    </div>
  );
}
