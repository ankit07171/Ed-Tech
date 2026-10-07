/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * This service implements a simple RAG architecture for the chatbot.
 * For production, consider using:
 * - OpenAI Embeddings API or Cohere
 * - Pinecone, Weaviate, or Qdrant for vector database
 * - OpenAI GPT-4, Claude, or Gemini for LLM
 */

import KnowledgeBase from "../models/knowledgeBaseModel.js";

/**
 * Simple embedding function using TF-IDF-like approach
 * For production, replace with proper embedding model (OpenAI, Sentence-Transformers, etc.)
 */
function generateSimpleEmbedding(text) {
  // Tokenize and create a simple bag-of-words vector
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Create a fixed-size vector (simplified)
  const vector = new Array(100).fill(0);
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    vector[hash % 100] += 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

/**
 * Retrieve relevant documents from knowledge base
 */
export async function retrieveRelevantDocs(query, options = {}) {
  const {
    limit = 5,
    category = null,
    department = null,
    threshold = 0.1,
  } = options;

  try {
    // Generate embedding for query
    const queryEmbedding = generateSimpleEmbedding(query);
    
    // Build filter
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (department) filter.department = department;

    // Get all documents (in production, use vector database)
    const allDocs = await KnowledgeBase.find(filter).lean();

    // Calculate similarity scores
    const scoredDocs = allDocs.map(doc => {
      let score = 0;
      
      // If document has embedding, use it
      if (doc.embedding && doc.embedding.length > 0) {
        score = cosineSimilarity(queryEmbedding, doc.embedding);
      } else {
        // Fallback to text similarity
        const docEmbedding = generateSimpleEmbedding(doc.content + ' ' + doc.title);
        score = cosineSimilarity(queryEmbedding, docEmbedding);
      }
      
      return { ...doc, relevanceScore: score };
    });

    // Filter and sort by relevance
    const relevantDocs = scoredDocs
      .filter(doc => doc.relevanceScore >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return relevantDocs;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
}

/**
 * Generate response using retrieved context
 * For production, replace with actual LLM API (OpenAI, Claude, etc.)
 */
export function generateResponse(query, relevantDocs, userContext = {}) {
  if (relevantDocs.length === 0) {
    return {
      response: "I apologize, but I don't have enough information to answer your question accurately. Could you please rephrase or ask about specific topics like admissions, placements, departments, or academic policies?",
      sources: [],
      confidence: 0,
    };
  }

  // Combine context from relevant documents
  const context = relevantDocs
    .map(doc => `${doc.title}: ${doc.content}`)
    .join('\n\n');

  // Simple template-based response (replace with LLM in production)
  const response = constructTemplateResponse(query, relevantDocs, userContext);

  return {
    response,
    sources: relevantDocs.map(doc => ({
      title: doc.title,
      category: doc.category,
      relevanceScore: doc.relevanceScore,
    })),
    confidence: relevantDocs[0]?.relevanceScore || 0,
  };
}

/**
 * Construct response using templates
 * This is a placeholder - use actual LLM for production
 */
function constructTemplateResponse(query, docs, userContext) {
  const queryLower = query.toLowerCase();
  
  // Check query intent
  if (queryLower.includes('placement') || queryLower.includes('job') || queryLower.includes('recruit')) {
    const placementDocs = docs.filter(d => d.category === 'Placement');
    if (placementDocs.length > 0) {
      return `Based on our placement records: ${placementDocs[0].content}`;
    }
  }
  
  if (queryLower.includes('admission') || queryLower.includes('enroll') || queryLower.includes('apply')) {
    const admissionDocs = docs.filter(d => d.category === 'Admission');
    if (admissionDocs.length > 0) {
      return `Regarding admissions: ${admissionDocs[0].content}`;
    }
  }
  
  if (queryLower.includes('department') || queryLower.includes('course') || queryLower.includes('branch')) {
    const deptDocs = docs.filter(d => d.category === 'Department');
    if (deptDocs.length > 0) {
      return `About the department: ${deptDocs[0].content}`;
    }
  }
  
  if (queryLower.includes('exam') || queryLower.includes('test') || queryLower.includes('grade')) {
    const examDocs = docs.filter(d => d.category === 'Examination');
    if (examDocs.length > 0) {
      return `Examination information: ${examDocs[0].content}`;
    }
  }

  // Default response with most relevant document
  const topDoc = docs[0];
  return `Here's what I found: ${topDoc.content}\n\n${topDoc.title}`;
}

/**
 * Update document embeddings (run periodically or on document creation)
 */
export async function updateKnowledgeBaseEmbeddings() {
  try {
    const docs = await KnowledgeBase.find({ 
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    });

    console.log(`Updating embeddings for ${docs.length} documents...`);

    for (const doc of docs) {
      const text = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`;
      const embedding = generateSimpleEmbedding(text);
      
      await KnowledgeBase.findByIdAndUpdate(doc._id, { embedding });
    }

    console.log('Embeddings updated successfully');
  } catch (error) {
    console.error('Error updating embeddings:', error);
  }
}

/**
 * Search knowledge base with full-text search
 */
export async function fullTextSearch(query, options = {}) {
  const { limit = 10, category = null } = options;
  
  try {
    const filter = { 
      $text: { $search: query },
      isActive: true,
    };
    
    if (category) filter.category = category;

    const results = await KnowledgeBase
      .find(filter, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();

    return results;
  } catch (error) {
    console.error('Full-text search error:', error);
    return [];
  }
}

export default {
  retrieveRelevantDocs,
  generateResponse,
  updateKnowledgeBaseEmbeddings,
  fullTextSearch,
};
