/**
 * Seed Placement Data with Realistic Records
 * Generates placement data for last 5 years with trends and patterns
 */

import Placement from "../models/placementModel.js";
import Department from "../models/departmentModel.js";

// Top IT companies and their typical package ranges
const companies = [
  { name: "Google", minPackage: 25, maxPackage: 45, roles: ["Software Engineer", "SDE-1", "Data Engineer"] },
  { name: "Microsoft", minPackage: 22, maxPackage: 42, roles: ["Software Engineer", "Cloud Engineer", "DevOps Engineer"] },
  { name: "Amazon", minPackage: 20, maxPackage: 40, roles: ["SDE-1", "Cloud Support Engineer", "Data Analyst"] },
  { name: "TCS", minPackage: 3.5, maxPackage: 7, roles: ["Assistant Systems Engineer", "Digital Engineer"] },
  { name: "Infosys", minPackage: 3.5, maxPackage: 9, roles: ["Systems Engineer", "Digital Specialist Engineer"] },
  { name: "Wipro", minPackage: 3.5, maxPackage: 8, roles: ["Project Engineer", "WILP Engineer"] },
  { name: "Cognizant", minPackage: 4, maxPackage: 8.5, roles: ["Programmer Analyst", "GenC Elevate"] },
  { name: "Accenture", minPackage: 4.5, maxPackage: 9, roles: ["Application Development Associate", "ASE"] },
  { name: "Capgemini", minPackage: 4, maxPackage: 8, roles: ["Analyst", "Senior Analyst"] },
  { name: "Tech Mahindra", minPackage: 3.5, maxPackage: 7, roles: ["Associate Software Engineer"] },
  { name: "HCL Technologies", minPackage: 3.8, maxPackage: 7.5, roles: ["Graduate Engineer Trainee"] },
  { name: "Adobe", minPackage: 18, maxPackage: 35, roles: ["MTS-1", "Software Engineer"] },
  { name: "Oracle", minPackage: 12, maxPackage: 25, roles: ["Applications Developer", "IC2"] },
  { name: "Cisco", minPackage: 15, maxPackage: 28, roles: ["Software Engineer", "Network Engineer"] },
  { name: "Samsung", minPackage: 14, maxPackage: 28, roles: ["Software Engineer", "Associate Engineer"] },
  { name: "Qualcomm", minPackage: 16, maxPackage: 30, roles: ["Engineer", "Senior Engineer"] },
  { name: "Intel", minPackage: 15, maxPackage: 28, roles: ["Software Engineer", "Design Engineer"] },
  { name: "VMware", minPackage: 18, maxPackage: 32, roles: ["Member of Technical Staff"] },
  { name: "PayPal", minPackage: 20, maxPackage: 35, roles: ["Software Engineer", "SDE"] },
  { name: "Uber", minPackage: 22, maxPackage: 40, roles: ["Software Engineer I"] },
  { name: "Flipkart", minPackage: 18, maxPackage: 35, roles: ["SDE-1", "Software Development Engineer"] },
  { name: "Walmart Labs", minPackage: 20, maxPackage: 38, roles: ["Software Engineer II"] },
  { name: "Goldman Sachs", minPackage: 18, maxPackage: 35, roles: ["Analyst", "Technology Analyst"] },
  { name: "Morgan Stanley", minPackage: 17, maxPackage: 32, roles: ["Technology Analyst"] },
  { name: "Deloitte", minPackage: 6, maxPackage: 12, roles: ["Analyst", "Consultant"] },
  { name: "EY", minPackage: 6, maxPackage: 11, roles: ["Technology Consultant"] },
  { name: "PwC", minPackage: 6, maxPackage: 11, roles: ["Associate", "Technology Consultant"] },
  { name: "Directi", minPackage: 12, maxPackage: 25, roles: ["Software Development Engineer"] },
  { name: "Nutanix", minPackage: 15, maxPackage: 28, roles: ["MTS-1"] },
  { name: "ServiceNow", minPackage: 18, maxPackage: 32, roles: ["Associate Software Engineer"] },
];

const months = ["January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"];

const placementTypes = ["On-Campus", "Off-Campus", "Pool Campus", "Internship"];

const studentNames = [
  "Rahul Sharma", "Priya Singh", "Arjun Patel", "Sneha Kumar", "Amit Gupta",
  "Neha Reddy", "Rohan Mehta", "Ananya Iyer", "Vikram Shah", "Pooja Verma",
  "Siddharth Jain", "Riya Desai", "Karan Malhotra", "Divya Nair", "Aditya Rao",
  "Shreya Agarwal", "Varun Kapoor", "Ishita Chopra", "Nikhil Bose", "Anjali Das",
  "Abhishek Tiwari", "Sakshi Pandey", "Raj Khanna", "Megha Sinha", "Harsh Bansal",
  "Kavya Menon", "Yash Kulkarni", "Tanvi Saxena", "Pranav Ghosh", "Nidhi Joshi",
  "Ayush Mishra", "Isha Thakur", "Akash Dubey", "Preeti Bhatt", "Gaurav Yadav",
  "Swati Pillai", "Manish Soni", "Kritika Kaur", "Sahil Garg", "Ritika Mathur",
  "Vishal Bhardwaj", "Deepika Chatterjee", "Rohit Srivastava", "Pallavi Dixit", "Ankit Rawat",
  "Shruti Jha", "Kartik Dutta", "Simran Arora", "Vivek Tripathi", "Neetu Choudhary",
];

const locations = [
  "Bangalore", "Hyderabad", "Pune", "Gurgaon", "Mumbai", "Chennai", 
  "Noida", "Delhi", "Kolkata", "Ahmedabad", "Remote"
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlacementForYear(year, departments) {
  const placements = [];
  const totalPlacements = getRandomInt(80, 150); // 80-150 placements per year

  for (let i = 0; i < totalPlacements; i++) {
    const company = getRandomElement(companies);
    const department = getRandomElement(departments);
    const packageAmount = parseFloat(
      getRandomNumber(company.minPackage, company.maxPackage).toFixed(2)
    );
    
    const placement = {
      studentName: getRandomElement(studentNames),
      department: department._id,
      company: company.name,
      package: packageAmount,
      role: getRandomElement(company.roles),
      placementType: Math.random() > 0.15 ? "On-Campus" : getRandomElement(placementTypes),
      year: year,
      month: getRandomElement(months),
      cgpa: parseFloat(getRandomNumber(6.5, 9.8).toFixed(2)),
      location: getRandomElement(locations),
      isHighestPackage: false,
    };

    placements.push(placement);
  }

  // Mark highest package
  const maxPackage = Math.max(...placements.map(p => p.package));
  const highestPlacement = placements.find(p => p.package === maxPackage);
  if (highestPlacement) {
    highestPlacement.isHighestPackage = true;
  }

  return placements;
}

export async function seedPlacements() {
  try {
    console.log("🌱 Seeding placement data...");

    // Check if placements already exist
    const existingCount = await Placement.countDocuments();
    if (existingCount > 0) {
      console.log(`📊 Placement database already has ${existingCount} records. Skipping seed.`);
      return;
    }

    // Get all departments
    const departments = await Department.find();
    if (departments.length === 0) {
      console.log("⚠️ No departments found. Please seed departments first.");
      return;
    }

    // Generate placements for last 5 years
    const currentYear = new Date().getFullYear();
    const allPlacements = [];

    for (let year = currentYear - 4; year <= currentYear; year++) {
      console.log(`📅 Generating placements for year ${year}...`);
      const yearPlacements = generatePlacementForYear(year, departments);
      allPlacements.push(...yearPlacements);
    }

    // Insert all placements
    await Placement.insertMany(allPlacements);
    
    console.log(`✅ Successfully seeded ${allPlacements.length} placement records across 5 years`);
    
    // Show some statistics
    const stats = await Placement.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
          avgPackage: { $avg: "$package" },
          maxPackage: { $max: "$package" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📈 Placement Statistics by Year:");
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} placements, Avg: ${stat.avgPackage.toFixed(2)} LPA, Max: ${stat.maxPackage} LPA`);
    });

  } catch (error) {
    console.error("❌ Error seeding placements:", error);
  }
}

export default seedPlacements;
