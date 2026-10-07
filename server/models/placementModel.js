import mongoose from "mongoose";

const placementSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  package: {
    type: Number, // in LPA (Lakhs per annum)
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  placementType: {
    type: String,
    enum: ["On-Campus", "Off-Campus", "Pool Campus", "Internship"],
    default: "On-Campus",
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: String,
    enum: ["January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December"],
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
  },
  location: {
    type: String,
  },
  isHighestPackage: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
placementSchema.index({ year: -1, department: 1 });
placementSchema.index({ company: 1 });

const Placement = mongoose.model("Placement", placementSchema);

export default Placement;
