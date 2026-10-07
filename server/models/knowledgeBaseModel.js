import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["General", "Academic", "Placement", "Department", "Admission", "Examination", "Events", "Facilities", "Policies"],
    default: "General",
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  keywords: [{
    type: String,
  }],
  // Vector embedding for RAG (will be populated by embedding service)
  embedding: {
    type: [Number],
  },
  sourceType: {
    type: String,
    enum: ["Manual", "Document", "FAQ", "Policy"],
    default: "Manual",
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Text search index
knowledgeBaseSchema.index({ title: "text", content: "text", keywords: "text" });
knowledgeBaseSchema.index({ category: 1, isActive: 1 });

const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);

export default KnowledgeBase;
