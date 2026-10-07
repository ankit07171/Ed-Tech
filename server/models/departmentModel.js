import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
    default: "",
  },
  hodName: {
    type: String,
    default: "",
  },
  establishedYear: {
    type: Number,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  totalTeachers: {
    type: Number,
    default: 0,
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

const Department = mongoose.model("Department", departmentSchema);

export default Department;
