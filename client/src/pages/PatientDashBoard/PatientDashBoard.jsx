import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiLoader } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./PatientDashBoard.module.css";
import { authApi } from "../../utils/api";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      text: "Welcome to E-Sanjeevani 2.0 AI Triage System! 👋\n\nI'm your intelligent clinical assistant. Tell me about your symptoms, and I'll help triage your case, assign an urgency score, and connect you with the right specialist.\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        setUser(response.data);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/auth";
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponses = [
        "I understand. Can you describe the duration and severity of these symptoms? On a scale of 1-10, how would you rate the intensity?",
        "Thank you for that information. Have you experienced any associated symptoms like fever, nausea, or difficulty breathing?",
        "Got it. Based on your symptoms, I'm assigning an urgency score of 6/10. I recommend seeing a General Practitioner or Cardiologist.",
        "Would you like me to connect you with a specialist now, or would you prefer to schedule a consultation for later?",
        "Perfect! I'm matching you with the best available specialist. You'll be connected within 3 minutes.",
      ];

      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMessage = {
        id: messages.length + 2,
        type: "ai",
        text: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} size={32} />
        <p className={styles.loadingText}>Initializing Workspace...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar user={user} onLogout={handleLogout} />

      <main className={styles.mainContent}>
        <div className={styles.chatContainer}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>AI Triage System</h1>
              <p className={styles.headerSubtitle}>
                Clinical NLP-Powered Assessment
              </p>
            </div>
            <div className={styles.headerBadge}>
              <span className={styles.statusDot}></span>
              Online
            </div>
          </div>

          {/* Messages Container */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageWrapper} ${
                  message.type === "user"
                    ? styles.userMessage
                    : styles.aiMessage
                }`}
              >
                <div className={styles.messageBubble}>{message.text}</div>
                <span className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your symptoms or concerns..."
              className={styles.input}
              disabled={isTyping}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!inputValue.trim() || isTyping}
              title="Send message"
            >
              {isTyping ? (
                <FiLoader className={styles.spinIcon} size={18} />
              ) : (
                <FiSend size={18} />
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
