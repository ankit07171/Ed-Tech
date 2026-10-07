import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: [{
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    sources: [{
      title: String,
      category: String,
      relevanceScore: Number,
    }],
  }],
  sessionId: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
});

chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
