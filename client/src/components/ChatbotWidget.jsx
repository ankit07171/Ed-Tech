import { useState, useEffect, useRef } from "react";
import { FiMessageCircle, FiX, FiSend, FiTrash2 } from "react-icons/fi";
import axios from "../utils/axiosConfig";
import { toast } from "react-toastify";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate session ID on mount
  useEffect(() => {
    const sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(sid);
  }, []);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && sessionId) {
      loadChatHistory();
    }
  }, [isOpen, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`/api/chatbot/history/${sessionId}`);
      if (response.data.messages && response.data.messages.length > 0) {
        setMessages(response.data.messages);
      } else {
        // Welcome message
        setMessages([
          {
            role: "assistant",
            content: "Hello! I'm your college assistant. Ask me anything about admissions, placements, departments, or campus life!",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your college assistant. Ask me anything about admissions, placements, departments, or campus life!",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/chatbot/message", {
        message: inputMessage.trim(),
        sessionId,
      });

      const botMessage = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`/api/chatbot/history/${sessionId}`);
      setMessages([
        {
          role: "assistant",
          content: "Chat history cleared. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear history");
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50"
          aria-label="Open chatbot"
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">College Assistant</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearHistory}
                className="hover:bg-white/20 p-1.5 rounded transition"
                title="Clear history"
              >
                <FiTrash2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded transition"
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-2 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FiSend size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
