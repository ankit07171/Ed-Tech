import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: String,
  filePath: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Note", noteSchema);
