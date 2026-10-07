/**
 * Master Database Seeding Script
 * Seeds all required data in the correct order
 * 
 * Usage: node server/utils/seedDatabase.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import seedDepartments from "./seedDepartments.js";
import seedPlacements from "./seedPlacements.js";
import seedKnowledgeBase from "./seedKnowledgeBase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function seedAll() {
  try {
    console.log("\n🚀 Starting database seeding process...\n");
    console.log("═".repeat(50));

    await connectDB();

    // 1. Seed Departments (must be first as others reference it)
    console.log("\n📚 Step 1: Seeding Departments");
    console.log("─".repeat(50));
    await seedDepartments();

    // 2. Seed Knowledge Base
    console.log("\n📖 Step 2: Seeding Knowledge Base");
    console.log("─".repeat(50));
    await seedKnowledgeBase();

    // 3. Seed Placements
    console.log("\n💼 Step 3: Seeding Placement Data");
    console.log("─".repeat(50));
    await seedPlacements();

    console.log("\n" + "═".repeat(50));
    console.log("✅ Database seeding completed successfully!");
    console.log("═".repeat(50) + "\n");

    console.log("📊 Summary:");
    const stats = await Promise.all([
      mongoose.model("Department").countDocuments(),
      mongoose.model("KnowledgeBase").countDocuments(),
      mongoose.model("Placement").countDocuments(),
    ]);

    console.log(`   • Departments: ${stats[0]}`);
    console.log(`   • Knowledge Base Entries: ${stats[1]}`);
    console.log(`   • Placement Records: ${stats[2]}`);
    console.log("\n✨ Your database is ready to use!\n");

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Database connection closed");
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll();
}

export default seedAll;
