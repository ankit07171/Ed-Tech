import ChatHistory from "../models/chatHistoryModel.js";
import KnowledgeBase from "../models/knowledgeBaseModel.js";
import Department from "../models/departmentModel.js";
import { retrieveRelevantDocs, generateResponse, fullTextSearch } from "../utils/ragService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Handle chat message from user
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user._id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session
    let session = sessionId ? 
      await ChatHistory.findOne({ sessionId, userId }) : 
      null;

    const newSessionId = sessionId || uuidv4();

    // Retrieve relevant documents using RAG
    const relevantDocs = await retrieveRelevantDocs(message, {
      limit: 5,
      department: req.user.department,
      threshold: 0.1,
    });

    // Generate response
    const { response, sources, confidence } = generateResponse(
      message, 
      relevantDocs,
      {
        role: req.user.role,
        department: req.user.department,
      }
    );

    // User message
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Assistant message
    const assistantMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date(),
      sources,
    };

    // Update or create chat history
    if (session) {
      session.messages.push(userMessage, assistantMessage);
      session.lastMessageAt = new Date();
      await session.save();
    } else {
      session = new ChatHistory({
        userId,
        sessionId: newSessionId,
        department: req.user.department,
        messages: [userMessage, assistantMessage],
        lastMessageAt: new Date(),
      });
      await session.save();
    }

    // Increment view count for used documents
    if (relevantDocs.length > 0) {
      await KnowledgeBase.updateMany(
        { _id: { $in: relevantDocs.map(d => d._id) } },
        { $inc: { viewCount: 1 } }
      );
    }

    res.status(200).json({
      message: response,
      sources,
      confidence,
      sessionId: newSessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
};

/**
 * Get chat history for user
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (sessionId) {
      // Get specific session
      const session = await ChatHistory.findOne({ sessionId, userId });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.status(200).json(session);
    }

    // Get all sessions for user
    const sessions = await ChatHistory
      .find({ userId, isActive: true })
      .sort({ lastMessageAt: -1 })
      .limit(20)
      .select("sessionId messages lastMessageAt createdAt")
      .lean();

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

/**
 * Clear chat history
 */
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (sessionId) {
      await ChatHistory.findOneAndUpdate(
        { sessionId, userId },
        { isActive: false }
      );
    } else {
      await ChatHistory.updateMany(
        { userId },
        { isActive: false }
      );
    }

    res.status(200).json({ message: "Chat history cleared" });
  } catch (error) {
    console.error("Clear chat history error:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
};

/**
 * Search knowledge base
 */
export const searchKnowledge = async (req, res) => {
  try {
    const { query, category } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await fullTextSearch(query, {
      limit: 10,
      category: category || null,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Search knowledge error:", error);
    res.status(500).json({ error: "Failed to search knowledge base" });
  }
};

/**
 * Add knowledge base entry (Admin/Teacher only)
 */
export const addKnowledge = async (req, res) => {
  try {
    const { title, content, category, keywords, department } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const knowledge = new KnowledgeBase({
      title,
      content,
      category: category || "General",
      keywords: keywords || [],
      department: department || req.user.department,
      uploadedBy: req.user._id,
      sourceType: "Manual",
    });

    await knowledge.save();

    res.status(201).json({ 
      message: "Knowledge added successfully",
      knowledge,
    });
  } catch (error) {
    console.error("Add knowledge error:", error);
    res.status(500).json({ error: "Failed to add knowledge" });
  }
};

/**
 * Update knowledge base entry
 */
export const updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const knowledge = await KnowledgeBase.findById(id);
    if (!knowledge) {
      return res.status(404).json({ error: "Knowledge entry not found" });
    }

    // Update fields
    Object.assign(knowledge, updates);
    knowledge.updatedAt = new Date();
    
    // Clear embedding to trigger re-embedding
    knowledge.embedding = [];

    await knowledge.save();

    res.status(200).json({ 
      message: "Knowledge updated successfully",
      knowledge,
    });
  } catch (error) {
    console.error("Update knowledge error:", error);
    res.status(500).json({ error: "Failed to update knowledge" });
  }
};

/**
 * Delete knowledge base entry
 */
export const deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await KnowledgeBase.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!knowledge) {
      return res.status(404).json({ error: "Knowledge entry not found" });
    }

    res.status(200).json({ message: "Knowledge deleted successfully" });
  } catch (error) {
    console.error("Delete knowledge error:", error);
    res.status(500).json({ error: "Failed to delete knowledge" });
  }
};

/**
 * Get all knowledge base entries
 */
export const getAllKnowledge = async (req, res) => {
  try {
    const { category, department, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (department) filter.department = department;

    const knowledge = await KnowledgeBase
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("department", "name code")
      .populate("uploadedBy", "fullName role");

    const total = await KnowledgeBase.countDocuments(filter);

    res.status(200).json({
      knowledge,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all knowledge error:", error);
    res.status(500).json({ error: "Failed to fetch knowledge base" });
  }
};

/**
 * Get knowledge categories
 */
export const getKnowledgeCategories = async (req, res) => {
  try {
    const categories = await KnowledgeBase.distinct("category", { isActive: true });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export default {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  searchKnowledge,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  getAllKnowledge,
  getKnowledgeCategories,
};
