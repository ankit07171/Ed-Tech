import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String,  
    required: true,
    unique: true,
  },
  records: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: String,
      status: { type: String, enum: ["present", "absent"], default: "absent" },
    },
  ],
});

export default mongoose.model("Attendance", attendanceSchema);
