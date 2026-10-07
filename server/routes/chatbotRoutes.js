import express from "express";
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  searchKnowledge,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  getAllKnowledge,
  getKnowledgeCategories,
} from "../controllers/chatbotController.js";
import protect from "../middleware/protectRoute.js";
import { restrictTo } from "../middleware/restrictTo.js";

const router = express.Router();

// Chat endpoints (all authenticated users)
router.post("/message", protect, sendMessage);
router.get("/history", protect, getChatHistory);
router.get("/history/:sessionId", protect, getChatHistory);
router.delete("/history/:sessionId", protect, clearChatHistory);
router.delete("/history", protect, clearChatHistory);

// Knowledge base search (all authenticated users)
router.get("/search", protect, searchKnowledge);
router.get("/categories", protect, getKnowledgeCategories);

// Knowledge base management (teachers and admins only)
router.post("/knowledge", protect, restrictTo("teacher", "admin"), addKnowledge);
router.get("/knowledge", protect, restrictTo("teacher", "admin"), getAllKnowledge);
router.put("/knowledge/:id", protect, restrictTo("teacher", "admin"), updateKnowledge);
router.delete("/knowledge/:id", protect, restrictTo("teacher", "admin"), deleteKnowledge);

export default router;
