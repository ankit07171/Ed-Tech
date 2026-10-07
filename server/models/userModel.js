import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  }, 
  contact: {
    type: String,
    minlength: 10,
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  // Student-specific fields
  rollNumber: {
    type: String,
    sparse: true, // Only for students
  },
  batch: {
    type: Number, // Year of admission
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
  },
  // Teacher-specific fields
  employeeId: {
    type: String,
    sparse: true, // Only for teachers
  },
  designation: {
    type: String, // Professor, Assistant Professor, etc.
  },
  specialization: {
    type: String,
  },
  experience: {
    type: Number, // Years of experience
  },
  // Common fields
  profilePic: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ department: 1, role: 1 });
userSchema.index({ rollNumber: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
