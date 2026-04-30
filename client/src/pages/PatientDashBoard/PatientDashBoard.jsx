import React, { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiLoader,
  FiPaperclip,
  FiActivity,
  FiFileText,
  FiSearch,
  FiClock,
  FiChevronDown,
  FiFilter,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
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

  const [selectedModel, setSelectedModel] = useState("Triage Agent");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const hasStartedChat = messages.length > 0;

   const aiModels = ["Triage Agent", "ClinicalBERT", "Med-PaLM 2", "BioGPT"];
  const mockRecords = ["Blood_Test_April2026.pdf", "MRI_Lumbar_Scan.jpg", "DrSmith_Prescription.docx"];

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
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: `Using ${selectedModel}, I have analyzed your input ${userMessage.attachments.length > 0 ? "and attached files" : ""}. Based on this, I recommend scheduling a consultation.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRecordSelect = (record) => {
    setInputValue((prev) => prev + (prev.trim() ? " " : "") + `[Referencing: ${record}] `);
    setShowRecordMenu(false);
  };


  // const handleQuickPrompt = (prompt) => {
  //   setInputValue(prompt);
  // };

  const handleLogout = () => {
    localStorage.removeItem("token");
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
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileUpload}
        />

        {!hasStartedChat ? (
          <div className={styles.idleState}>
            <h1 className={styles.greeting}>Hello {firstName}, How can we help you today?</h1>

            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                
                {/* File Attachment Chips inside input */}
                {attachments.length > 0 && (
                  <div className={styles.attachmentChips}>
                    {attachments.map((file, idx) => (
                      <div key={idx} className={styles.chip}>
                        <FiFileText size={12} />
                        <span className={styles.chipText}>{file.name}</span>
                        <button onClick={() => removeAttachment(idx)}><FiX size={12}/></button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  className={styles.largeInput}
                  placeholder="Describe your symptoms, or assign a task to the AI..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                />
                
                <div className={styles.inputBottomRow}>
                  <div className={styles.leftTools}>
                    
                    {/* Models Dropdown */}
                    <div className={styles.relativeContainer}>
                      <button 
                        className={`${styles.dropdownBtn} ${styles.bluePill}`}
                        onClick={() => {
                          setShowModelMenu(!showModelMenu);
                          setShowRecordMenu(false);
                        }}
                      >
                        <FiActivity size={14} /> <span>{selectedModel}</span> <FiChevronDown size={14} />
                      </button>
                      {showModelMenu && (
                        <div className={styles.popoverMenu}>
                          {aiModels.map(model => (
                            <div key={model} className={styles.popoverItem} onClick={() => { setSelectedModel(model); setShowModelMenu(false); }}>
                              {model}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Records Dropdown */}
                    <div className={styles.relativeContainer}>
                      <button 
                        className={styles.dropdownBtn}
                        onClick={() => {
                          setShowRecordMenu(!showRecordMenu);
                          setShowModelMenu(false);
                        }}
                      >
                        <FiFileText size={14} /> <span>{setShowRecordMenu ? "Select Record" : "All Records"}</span> <FiChevronDown size={14} />
                      </button>
                      {showRecordMenu && (
                        <div className={styles.popoverMenu}>
                          <div className={styles.popoverHeader}>Your Clinical Records</div>
                          {mockRecords.map(record => (
                            <div key={record} className={styles.popoverItem} onClick={() => handleRecordSelect(record)}>
                              {record}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                  
                  <div className={styles.rightTools}>
                    <button className={styles.iconBtn} title="Attach Files" onClick={() => fileInputRef.current.click()}>
                      <FiPaperclip size={18} />
                    </button>
                    <button 
                      className={`${styles.submitActionBtn} ${inputValue.trim() || attachments.length > 0 ? styles.activeSubmit : ''}`}
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() && attachments.length === 0}
                    >
                      <FiArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Prompts (same as before) */}
            <div className={styles.quickPromptsSection}>
              {/* ...existing prompts code... */}
            </div>
          </div>
        ) : (
          <div className={styles.chatView}>
             {/* ...existing active chat code... */}
             <div className={styles.chatInputWrapper}>
              <form onSubmit={handleSendMessage} className={styles.chatFormContainer}>
                <button type="button" className={styles.attachBtn} onClick={() => fileInputRef.current.click()}>
                  <FiPaperclip size={18}/>
                </button>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Message ${selectedModel}...`}
                  className={styles.chatInput}
                />
                <button type="submit" disabled={(!inputValue.trim() && attachments.length === 0) || isTyping} className={styles.chatSubmitBtn}>
                  <FiSend size={18}/>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
