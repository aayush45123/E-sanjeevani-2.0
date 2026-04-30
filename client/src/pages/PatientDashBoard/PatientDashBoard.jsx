import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiLoader, FiPaperclip, FiActivity, FiFileText, FiSearch, FiClock } from "react-icons/fi";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./PatientDashBoard.module.css";
import { authApi } from "../../utils/api";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const hasStartedChat = messages.length > 0;

  // Fetch user data
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        setUser(response.data.user || response.data);
      } catch (err) {
        if (err.status === 401 || err.response?.status === 401) {
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
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I understand. Can you describe the duration and severity of these symptoms? On a scale of 1-10, how would you rate the intensity?",
        "Thank you for sharing. Have you experienced any associated symptoms like fever, nausea, or dizziness?",
        "Based on your symptoms, I'm assigning an initial urgency score of 5/10. I recommend consulting with a General Practitioner.",
        "I'm analyzing your health data right now. Let me connect you with the appropriate specialist for a further evaluation."
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/auth";
  };

  const firstName = user?.name?.split(" ")[0] || "Patient";

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} size={24} />
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar user={user} onLogout={handleLogout} />

      <main className={styles.mainContent}>
        
        {/* --- IDLE/EMPTY STATE (like the reference image) --- */}
        {!hasStartedChat ? (
          <div className={styles.idleState}>
            <h1 className={styles.greeting}>
              Hello {firstName}, How can we help you today?
            </h1>

            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <textarea
                  className={styles.largeInput}
                  placeholder="Describe your symptoms, questions, or health concerns..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                />
                
                <div className={styles.inputTools}>
                  <div className={styles.toolGroup}>
                    <button className={styles.toolBtn} title="Agent">
                      <FiActivity size={14} /> Triage AI
                    </button>
                    <button className={styles.toolBtn} title="Attach Logs">
                      <FiPaperclip size={14} /> Attach Reports
                    </button>
                  </div>
                  <button 
                    className={`${styles.submitActionBtn} ${inputValue.trim() ? styles.activeSubmit : ''}`}
                    onClick={() => handleSendMessage()}
                  >
                    <FiSend size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.quickPromptsSection}>
              <p className={styles.quickPromptLabel}>Or try asking the clinical assistant:</p>
              <div className={styles.quickPromptsGrid}>
                
                <div className={styles.promptCard} onClick={() => handleQuickPrompt("I have been having a severe headache for the past 2 days with light sensitivity.")}>
                  <div className={styles.promptHeader}>
                    <FiSearch className={styles.promptIcon} /> Symptom Check
                  </div>
                  <p className={styles.promptDesc}>"I have a severe headache for the past 2 days with light sensitivity..."</p>
                </div>

                <div className={styles.promptCard} onClick={() => handleQuickPrompt("Can you review my recent blood test report and explain the cholesterol levels?")}>
                  <div className={styles.promptHeader}>
                    <FiFileText className={styles.promptIcon} style={{color: '#6366f1'}} /> Report Analysis
                  </div>
                  <p className={styles.promptDesc}>Review my recent blood test and explain the cholesterol levels.</p>
                </div>

                <div className={styles.promptCard} onClick={() => handleQuickPrompt("I need to schedule a follow-up consultation with a cardiologist.")}>
                  <div className={styles.promptHeader}>
                    <FiClock className={styles.promptIcon} style={{color: '#f59e0b'}} /> Book Appointment
                  </div>
                  <p className={styles.promptDesc}>Find available time slots for a cardiology follow-up this week.</p>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* --- ACTIVE CHAT STATE --- */
          <div className={styles.chatView}>
            <div className={styles.chatHeader}>
              <h2 className={styles.chatHeaderTitle}>AI Triage Session</h2>
              <span className={styles.liveTag}><span className={styles.pulseDot}></span> Live</span>
            </div>

            <div className={styles.messagesContainer}>
              {/* Initial AI Message injected at start */}
              <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
                 <div className={styles.avatar}>E</div>
                 <div className={styles.messageContent}>
                   <div className={styles.messageAuthor}>E-Sanjeevani AI</div>
                   <div className={styles.messageBubble}>
                     Hi {firstName}, I'm your clinical assistant. I'm here to evaluate your symptoms and connect you with the right specialist. How can I help?
                   </div>
                 </div>
              </div>

              {messages.map((message) => (
                <div key={message.id} className={`${styles.messageWrapper} ${message.type === "user" ? styles.userMessage : styles.aiMessage}`}>
                  {message.type === "ai" && <div className={styles.avatar}>E</div>}
                  <div className={styles.messageContent}>
                    <div className={styles.messageAuthor}>{message.type === "user" ? "You" : "E-Sanjeevani AI"}</div>
                    <div className={styles.messageBubble}>{message.text}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
                  <div className={styles.avatar}>E</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageAuthor}>E-Sanjeevani AI</div>
                    <div className={styles.messageBubble}>
                      <div className={styles.typingIndicator}>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom floating input for active chat */}
            <div className={styles.chatInputWrapper}>
              <form onSubmit={handleSendMessage} className={styles.chatFormContainer}>
                <button type="button" className={styles.attachBtn}><FiPaperclip size={18}/></button>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your response..."
                  className={styles.chatInput}
                />
                <button type="submit" disabled={!inputValue.trim() || isTyping} className={styles.chatSubmitBtn}>
                  <FiSend size={18}/>
                </button>
              </form>
              <div className={styles.disclaimer}>AI generated medical advice should not replace professional consultation for emergencies.</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}