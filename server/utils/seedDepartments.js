/**
 * Seed Department Data
 * Creates common engineering and management departments
 */

import Department from "../models/departmentModel.js";

const departments = [
  {
    name: "Computer Science and Engineering",
    code: "CSE",
    description: "The CSE department focuses on software development, AI/ML, data science, cyber security, and emerging technologies. It offers B.Tech and M.Tech programs with state-of-the-art labs and experienced faculty.",
    hodName: "Dr. Rajesh Kumar",
    establishedYear: 1995,
    totalStudents: 480,
    totalTeachers: 28,
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "The IT department specializes in web technologies, mobile app development, cloud computing, and IT infrastructure. Focus on industry-relevant skills and project-based learning.",
    hodName: "Dr. Priya Sharma",
    establishedYear: 2000,
    totalStudents: 360,
    totalTeachers: 22,
  },
  {
    name: "Electronics and Communication Engineering",
    code: "ECE",
    description: "ECE department covers VLSI design, embedded systems, signal processing, wireless communication, and IoT. Equipped with modern labs for hands-on learning.",
    hodName: "Dr. Amit Patel",
    establishedYear: 1997,
    totalStudents: 420,
    totalTeachers: 25,
  },
  {
    name: "Electrical Engineering",
    code: "EE",
    description: "The EE department focuses on power systems, renewable energy, control systems, and electrical machines. Strong emphasis on sustainable energy solutions.",
    hodName: "Dr. Suresh Reddy",
    establishedYear: 1996,
    totalStudents: 300,
    totalTeachers: 20,
  },
  {
    name: "Mechanical Engineering",
    code: "ME",
    description: "ME department covers automotive engineering, robotics, manufacturing, CAD/CAM, and thermal engineering. Students work on industry-sponsored projects and participate in technical competitions.",
    hodName: "Dr. Vijay Singh",
    establishedYear: 1995,
    totalStudents: 400,
    totalTeachers: 24,
  },
  {
    name: "Civil Engineering",
    code: "CE",
    description: "Civil Engineering department teaches structural design, construction management, environmental engineering, and transportation. Focus on sustainable infrastructure development.",
    hodName: "Dr. Anita Gupta",
    establishedYear: 1998,
    totalStudents: 280,
    totalTeachers: 18,
  },
  {
    name: "Chemical Engineering",
    code: "CHE",
    description: "Chemical Engineering focuses on process engineering, petrochemicals, polymer technology, and environmental processes. Well-equipped labs for practical training.",
    hodName: "Dr. Ramesh Verma",
    establishedYear: 2002,
    totalStudents: 240,
    totalTeachers: 16,
  },
  {
    name: "Biotechnology",
    code: "BT",
    description: "Biotechnology department covers genetic engineering, bioprocess technology, pharmaceutical biotech, and medical diagnostics. Modern labs with latest equipment.",
    hodName: "Dr. Kavita Joshi",
    establishedYear: 2005,
    totalStudents: 200,
    totalTeachers: 14,
  },
  {
    name: "Master of Business Administration",
    code: "MBA",
    description: "MBA program offers specializations in Finance, Marketing, HR, and Operations. Focus on developing managerial and leadership skills with industry internships.",
    hodName: "Dr. Sandeep Mehta",
    establishedYear: 2003,
    totalStudents: 180,
    totalTeachers: 15,
  },
  {
    name: "Master of Computer Applications",
    code: "MCA",
    description: "MCA program provides advanced training in software development, database management, web technologies, and emerging IT areas. Industry-oriented curriculum.",
    hodName: "Dr. Neha Kapoor",
    establishedYear: 2001,
    totalStudents: 150,
    totalTeachers: 12,
  },
];

export async function seedDepartments() {
  try {
    console.log("🌱 Seeding departments...");

    // Check if departments already exist
    const existingCount = await Department.countDocuments();
    if (existingCount > 0) {
      console.log(`🏢 Department database already has ${existingCount} entries. Skipping seed.`);
      return await Department.find(); // Return existing departments
    }

    // Insert departments
    const insertedDepartments = await Department.insertMany(departments);
    
    console.log(`✅ Successfully seeded ${departments.length} departments`);
    console.log("\n📚 Departments created:");
    insertedDepartments.forEach(dept => {
      console.log(`   - ${dept.code}: ${dept.name} (${dept.totalStudents} students, ${dept.totalTeachers} faculty)`);
    });

    return insertedDepartments;
  } catch (error) {
    console.error("❌ Error seeding departments:", error);
    throw error;
  }
}

export default seedDepartments;
