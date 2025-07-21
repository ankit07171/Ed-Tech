// models/Meet.js
import mongoose from "mongoose";

const meetSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // ✅ this triggers the error if missing
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Meet", meetSchema);
