/**
 * Seed Knowledge Base with Sample Data
 * Run this script to populate the knowledge base with default content
 */

import KnowledgeBase from "../models/knowledgeBaseModel.js";
import Department from "../models/departmentModel.js";
import { updateKnowledgeBaseEmbeddings } from "./ragService.js";

const sampleKnowledge = [
  // General Information
  {
    title: "About Our College",
    content: "Our college is a premier institution offering undergraduate and postgraduate programs in Engineering, Technology, and Management. Established in 1995, we have a strong track record of academic excellence and industry partnerships. We are approved by AICTE and affiliated with the State Technical University.",
    category: "General",
    keywords: ["about", "college", "institution", "history", "AICTE", "university"],
  },
  {
    title: "Campus Facilities",
    content: "Our campus features state-of-the-art facilities including modern laboratories, well-equipped library with 50,000+ books, high-speed WiFi, sports complex, hostel accommodation, cafeteria, medical center, and 24/7 security. We also have auditoriums for cultural events and conference halls for seminars.",
    category: "Facilities",
    keywords: ["facilities", "campus", "library", "hostel", "sports", "wifi", "labs"],
  },
  
  // Admission Information
  {
    title: "Admission Process",
    content: "Admissions are based on merit in qualifying examinations and entrance test scores. For B.Tech: JEE Main scores are required. For M.Tech: GATE scores are preferred. Application forms are available online from June to July every year. The selection process includes document verification and counseling.",
    category: "Admission",
    keywords: ["admission", "process", "JEE", "GATE", "application", "entrance", "eligibility"],
  },
  {
    title: "Eligibility Criteria for B.Tech",
    content: "Candidates must have passed 10+2 with Physics, Chemistry, and Mathematics with minimum 60% marks. For reserved categories, the minimum is 55%. Valid JEE Main score is mandatory. Age limit is 17-23 years as on admission date.",
    category: "Admission",
    keywords: ["eligibility", "B.Tech", "10+2", "JEE", "percentage", "age limit"],
  },
  {
    title: "Fee Structure",
    content: "Annual tuition fee for B.Tech is Rs. 1,20,000 per year. Hostel charges are Rs. 60,000 per year including meals. Library and lab fees are Rs. 10,000 per year. Scholarships are available for meritorious and economically weaker students. Payment can be made in two installments.",
    category: "Admission",
    keywords: ["fee", "tuition", "cost", "hostel", "scholarship", "payment"],
  },

  // Placement Information
  {
    title: "Placement Overview",
    content: "Our college has an excellent placement record with 85%+ students getting placed annually. Top recruiters include TCS, Infosys, Wipro, Amazon, Microsoft, Google, and many more. The average package is 6.5 LPA and the highest package is 45 LPA. We conduct regular training programs, mock interviews, and aptitude tests to prepare students.",
    category: "Placement",
    keywords: ["placement", "jobs", "recruitment", "companies", "package", "salary", "training"],
  },
  {
    title: "Placement Preparation",
    content: "The Training and Placement Cell conducts year-round preparation activities including: Technical skill development workshops, Aptitude and reasoning training, Communication and soft skills enhancement, Mock interviews and group discussions, Resume building workshops, and Industry interaction sessions. Students are encouraged to participate in internships during vacations.",
    category: "Placement",
    keywords: ["preparation", "training", "aptitude", "interview", "resume", "internship"],
  },

  // Department Information
  {
    title: "Computer Science Department",
    content: "The Computer Science and Engineering department offers B.Tech and M.Tech programs. Key areas include Artificial Intelligence, Machine Learning, Data Science, Cyber Security, Cloud Computing, and Software Engineering. The department has 25 faculty members with PhD degrees and modern labs equipped with latest hardware and software. Research projects are ongoing in AI/ML and IoT.",
    category: "Department",
    keywords: ["CSE", "computer science", "AI", "ML", "software", "programming", "faculty"],
  },
  {
    title: "Mechanical Engineering Department",
    content: "The Mechanical Engineering department has state-of-the-art workshops, CAD/CAM labs, and thermal labs. Areas of focus include Robotics, Automotive Engineering, Manufacturing Technology, and Renewable Energy. Students work on industry-sponsored projects and participate in technical competitions like BAJA and Formula Student.",
    category: "Department",
    keywords: ["mechanical", "automobile", "robotics", "manufacturing", "workshop", "CAD"],
  },
  {
    title: "Electronics Department",
    content: "The Electronics and Communication Engineering department specializes in VLSI Design, Embedded Systems, Signal Processing, and Wireless Communication. Modern labs include PCB design lab, microcontroller lab, and communication systems lab. Faculty members are engaged in research funded by DRDO and ISRO.",
    category: "Department",
    keywords: ["ECE", "electronics", "VLSI", "embedded", "communication", "signals"],
  },

  // Examination Information
  {
    title: "Examination Schedule",
    content: "The academic year consists of two semesters: Odd Semester (August to December) and Even Semester (January to May). Mid-semester exams are conducted in October and March. End-semester exams are in December and May. Internal assessment includes assignments, quizzes, and presentations worth 30% of total marks. Minimum 75% attendance is required to appear in exams.",
    category: "Examination",
    keywords: ["exam", "schedule", "semester", "assessment", "attendance", "marks"],
  },
  {
    title: "Grading System",
    content: "We follow a 10-point CGPA system. Grade distribution: O (Outstanding) - 90-100%, A+ (Excellent) - 80-89%, A (Very Good) - 70-79%, B+ (Good) - 60-69%, B (Above Average) - 50-59%, C (Average) - 40-49%, F (Fail) - Below 40%. Students need minimum 5.0 CGPA to graduate.",
    category: "Examination",
    keywords: ["grading", "CGPA", "marks", "grades", "result", "percentage"],
  },

  // Academic Policies
  {
    title: "Attendance Policy",
    content: "Students must maintain minimum 75% attendance in each subject to be eligible for end-semester exams. Medical leaves are granted with valid doctor's certificate. Attendance shortage can lead to detention. Students with 65-75% attendance may be allowed to appear in exams with permission from the Dean and payment of condonation fee.",
    category: "Policies",
    keywords: ["attendance", "leave", "absence", "policy", "condonation"],
  },
  {
    title: "Anti-Ragging Policy",
    content: "The college has zero tolerance for ragging. Ragging in any form is strictly prohibited and is a punishable offense. Students can report incidents to the Anti-Ragging Committee anonymously through hotline or email. Severe action including expulsion will be taken against offenders. An Anti-Ragging Squad regularly patrols campus and hostel premises.",
    category: "Policies",
    keywords: ["ragging", "safety", "discipline", "harassment", "committee"],
  },

  // Events and Activities
  {
    title: "Technical Fest - TechnoVista",
    content: "TechnoVista is our annual technical festival held in March. It features coding competitions, robotics challenges, project exhibitions, hackathons, technical workshops, and guest lectures from industry experts. Students from 100+ colleges participate. Prize money worth 5 lakhs is distributed. Registration is open to all engineering students.",
    category: "Events",
    keywords: ["fest", "techno", "technical", "competition", "hackathon", "event"],
  },
  {
    title: "Cultural Fest - Utkarsh",
    content: "Utkarsh is our cultural festival held in February featuring dance, music, drama, fashion show, and literary events. Celebrity performers are invited. Open to all college students. Events include solo and group performances, art exhibitions, photography contests, and food stalls. It's a three-day extravaganza celebrating creativity and talent.",
    category: "Events",
    keywords: ["cultural", "fest", "music", "dance", "event", "celebration"],
  },

  // Student Support
  {
    title: "Counseling Services",
    content: "Professional counseling services are available for students dealing with academic stress, personal issues, or career confusion. Our trained counselors provide confidential sessions. Services are free for all students. Appointments can be booked through the student portal. Group counseling sessions and stress management workshops are conducted regularly.",
    category: "Facilities",
    keywords: ["counseling", "mental health", "support", "stress", "guidance"],
  },
  {
    title: "Scholarships Available",
    content: "Merit scholarships: Top 10% students get 50% fee waiver. Government scholarships: SC/ST/OBC students can avail state and central government scholarships. Need-based scholarships: For economically weaker sections based on family income. Sports scholarships: For state and national level players. Girl child scholarships: Special incentives for female students in engineering.",
    category: "Admission",
    keywords: ["scholarship", "financial aid", "fee waiver", "merit", "government"],
  },
];

export async function seedKnowledgeBase() {
  try {
    console.log("🌱 Seeding knowledge base...");

    // Clear existing knowledge (optional - comment out to keep existing data)
    // await KnowledgeBase.deleteMany({});

    // Check if knowledge already exists
    const existingCount = await KnowledgeBase.countDocuments();
    if (existingCount > 0) {
      console.log(`📚 Knowledge base already has ${existingCount} entries. Skipping seed.`);
      return;
    }

    // Insert sample knowledge
    await KnowledgeBase.insertMany(sampleKnowledge);
    
    console.log(`✅ Successfully seeded ${sampleKnowledge.length} knowledge entries`);

    // Generate embeddings
    console.log("🔄 Generating embeddings...");
    await updateKnowledgeBaseEmbeddings();
    
    console.log("✅ Knowledge base setup complete!");
  } catch (error) {
    console.error("❌ Error seeding knowledge base:", error);
  }
}

export default seedKnowledgeBase;
