import React, { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiLoader,
  FiPaperclip,
  FiActivity,
  FiFileText,
  FiClock,
  FiChevronDown,
  FiArrowRight,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import Sidebar from "../../components/Sidebar/Sidebar";
import TriageHistory from "../../components/TriageHistory/TriageHistory";
import TriageDetailView from "../../components/TriageDetailView/TriageDetailView";
import styles from "./PatientDashBoard.module.css";
import { authApi } from "../../utils/api";

// ─── Tight Markdown renderer ────────────────────────────────────────────────
const TightMarkdown = ({ children }) => (
  <ReactMarkdown
    components={{
      p: ({ children }) => (
        <p style={{ margin: "0 0 6px 0", lineHeight: "1.6" }}>{children}</p>
      ),
      ul: ({ children }) => (
        <ul style={{ margin: "4px 0 6px 0", paddingLeft: "20px" }}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol style={{ margin: "4px 0 6px 0", paddingLeft: "20px" }}>
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li style={{ margin: "2px 0", lineHeight: "1.55" }}>
          {React.Children.map(children, (child) =>
            child?.type === "p" ? child.props.children : child,
          )}
        </li>
      ),
      strong: ({ children }) => (
        <strong style={{ fontWeight: 600 }}>{children}</strong>
      ),
      em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
      h1: ({ children }) => (
        <h1
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            margin: "8px 0 4px 0",
            lineHeight: "1.3",
          }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            margin: "8px 0 4px 0",
            lineHeight: "1.3",
          }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            margin: "6px 0 3px 0",
            lineHeight: "1.3",
          }}
        >
          {children}
        </h3>
      ),
      code: ({ inline, children }) =>
        inline ? (
          <code
            style={{
              background: "#f1f5f9",
              padding: "1px 5px",
              borderRadius: "4px",
              fontSize: "0.88em",
              fontFamily: "monospace",
            }}
          >
            {children}
          </code>
        ) : (
          <pre
            style={{
              background: "#f1f5f9",
              padding: "10px 14px",
              borderRadius: "8px",
              overflowX: "auto",
              margin: "6px 0",
            }}
          >
            <code style={{ fontSize: "0.88em", fontFamily: "monospace" }}>
              {children}
            </code>
          </pre>
        ),
      blockquote: ({ children }) => (
        <blockquote
          style={{
            borderLeft: "3px solid #94a3b8",
            paddingLeft: "12px",
            margin: "6px 0",
            color: "#64748b",
          }}
        >
          {children}
        </blockquote>
      ),
      hr: () => (
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #e2e8f0",
            margin: "8px 0",
          }}
        />
      ),
    }}
  >
    {children}
  </ReactMarkdown>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
const getChatStorageKey = (userId) =>
  userId ? `chat_messages_${userId}` : "chat_messages_anon";

const loadMessagesFromStorage = (userId) => {
  try {
    const raw = localStorage.getItem(getChatStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Re-hydrate timestamps as Date objects
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
};

const saveMessagesToStorage = (userId, messages) => {
  try {
    // Keep only last 100 messages to avoid quota issues
    const toSave = messages.slice(-100);
    localStorage.setItem(getChatStorageKey(userId), JSON.stringify(toSave));
  } catch (e) {
    console.warn("Could not persist chat messages:", e);
  }
};

// ─── AI Models ──────────────────────────────────────────────────────────────
const aiModelsData = [
  {
    id: "ii-medical-8b",
    name: "II-Medical-8B",
    provider: "Hugging Face",
    icon: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    isPro: false,
    description: "Specialized medical language model",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    isPro: true,
    description: "Most capable model for complex tasks",
  },
  {
    id: "claude-3.5",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    icon: "https://www.anthropic.com/favicon.ico",
    isPro: true,
    description: "Advanced reasoning and analysis",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    icon: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    description: "Fast and efficient for most tasks",
  },
  {
    id: "llama-3",
    name: "Llama 3",
    provider: "Meta",
    description: "Open source and customizable",
  },
];

const mockRecords = [
  "Blood_Test_April2026.pdf",
  "MRI_Lumbar_Scan.jpg",
  "DrSmith_Prescription.docx",
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Chat state ──────────────────────────────────────────────────────────
  // Messages start empty; once user loads we pull from localStorage
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Model / dropdown state ───────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState(aiModelsData[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRecordMenu, setShowRecordMenu] = useState(false);

  // ── Triage state ────────────────────────────────────────────────────────
  const [selectedTriageId, setSelectedTriageId] = useState(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const hasStartedChat = messages.length > 0;

  // ── Fetch user, then hydrate messages from localStorage ─────────────────
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        const fetchedUser = response.data.user || response.data;
        setUser(fetchedUser);

        // Now that we have userId, load persisted messages
        const userId = fetchedUser._id || fetchedUser.id;
        const persisted = loadMessagesFromStorage(userId);
        if (persisted.length > 0) {
          setMessages(persisted);
        }
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

  // ── Persist messages to localStorage whenever they change ────────────────
  useEffect(() => {
    if (user) {
      const userId = user._id || user.id;
      saveMessagesToStorage(userId, messages);
    }
  }, [messages, user]);

  // ── Auto-scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => {
      setShowModelMenu(false);
      setShowRecordMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;

    const currentInput = inputValue;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: currentInput,
      attachments: attachments.map((f) => f.name),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      let cleanedText = data.data.reply
        .replace(/<\/?[Aa]nswer>\s*/g, "")
        .replace(/^[\s]*[Aa]nswer[\s]*:[\s]*/gm, "")
        .replace(/<[^>]*>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: cleanedText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: "I am having trouble connecting to the network right now. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const handleClearChat = () => {
    if (!window.confirm("Clear all chat messages?")) return;
    setMessages([]);
    if (user) {
      const userId = user._id || user.id;
      localStorage.removeItem(getChatStorageKey(userId));
    }
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ── Record select ─────────────────────────────────────────────────────────
  const handleRecordSelect = (record) => {
    setInputValue(
      (prev) => prev + (prev.trim() ? " " : "") + `[Referencing: ${record}] `,
    );
    setShowRecordMenu(false);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/auth";
  };

  const firstName = user?.name?.split(" ")[0] || "Patient";

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} size={24} />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.dashboardLayout}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        multiple
        onChange={handleFileUpload}
      />

      {/* Left sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main chat area */}
      <main className={styles.mainContent}>
        {!hasStartedChat ? (
          /* ── Idle / landing state ── */
          <div className={styles.idleState}>
            <h1 className={styles.greeting}>
              Hello {firstName}, How can we help you today?
            </h1>

            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                {/* Attachment chips */}
                {attachments.length > 0 && (
                  <div className={styles.attachmentChips}>
                    {attachments.map((file, idx) => (
                      <div key={idx} className={styles.chip}>
                        <FiFileText size={12} />
                        <span className={styles.chipText}>{file.name}</span>
                        <button onClick={() => removeAttachment(idx)}>
                          <FiX size={12} />
                        </button>
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
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                />

                <div className={styles.inputBottomRow}>
                  <div className={styles.leftTools}>
                    {/* Models dropdown */}
                    <div
                      className={styles.relativeContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={`${styles.dropdownBtn} ${styles.bluePill}`}
                        onClick={() => {
                          setShowModelMenu((v) => !v);
                          setShowRecordMenu(false);
                        }}
                      >
                        <FiActivity size={14} />
                        <span>{selectedModel.name}</span>
                        <FiChevronDown size={14} />
                      </button>
                      {showModelMenu && (
                        <div
                          className={`${styles.popoverMenu} ${styles.modelMenuWide}`}
                        >
                          <div className={styles.popoverHeader}>
                            Select AI Model
                          </div>
                          <div className={styles.modelList}>
                            {aiModelsData.map((model) => (
                              <div
                                key={model.id}
                                className={`${styles.modelItem} ${
                                  selectedModel.id === model.id
                                    ? styles.selectedModelItem
                                    : ""
                                }`}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelMenu(false);
                                }}
                              >
                                <div className={styles.modelIconWrapper}>
                                  {model.icon ? (
                                    <img src={model.icon} alt={model.name} />
                                  ) : (
                                    <span>{model.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div className={styles.modelItemContent}>
                                  <div className={styles.modelItemHeader}>
                                    <span className={styles.modelItemTitle}>
                                      {model.name}
                                    </span>
                                    {model.isPro && (
                                      <span className={styles.proBadge}>
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <span className={styles.modelItemProvider}>
                                    {model.provider} · {model.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Records dropdown */}
                    <div
                      className={styles.relativeContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={styles.dropdownBtn}
                        onClick={() => {
                          setShowRecordMenu((v) => !v);
                          setShowModelMenu(false);
                        }}
                      >
                        <FiFileText size={14} />
                        <span>
                          {showRecordMenu ? "Select Record" : "All Records"}
                        </span>
                        <FiChevronDown size={14} />
                      </button>
                      {showRecordMenu && (
                        <div className={styles.popoverMenu}>
                          <div className={styles.popoverHeader}>
                            Your Clinical Records
                          </div>
                          {mockRecords.map((record) => (
                            <div
                              key={record}
                              className={styles.popoverItem}
                              onClick={() => handleRecordSelect(record)}
                            >
                              {record}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.rightTools}>
                    <button
                      className={styles.iconBtn}
                      title="Attach Files"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <FiPaperclip size={18} />
                    </button>
                    <button
                      className={`${styles.submitActionBtn} ${
                        inputValue.trim() || attachments.length > 0
                          ? styles.activeSubmit
                          : ""
                      }`}
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() && attachments.length === 0}
                    >
                      <FiArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick prompts */}
            <div className={styles.quickPromptsSection}>
              {/* Keep your existing quick prompts here */}
            </div>
          </div>
        ) : (
          /* ── Active chat state ── */
          <div className={styles.chatView}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <h2 className={styles.chatHeaderTitle}>AI Triage Session</h2>
                <span className={styles.liveTag}>
                  <span className={styles.pulseDot}></span> Live
                </span>
              </div>
              {/* Clear chat button */}
              <button
                className={styles.clearChatBtn}
                onClick={handleClearChat}
                title="Clear chat history"
              >
                <FiTrash2 size={14} />
                <span>Clear</span>
              </button>
            </div>

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
                  {message.type === "ai" && (
                    <div className={styles.avatar}>E</div>
                  )}
                  <div className={styles.messageContent}>
                    <div className={styles.messageAuthor}>
                      {message.type === "user" ? "You" : selectedModel.name}
                    </div>
                    <div className={styles.messageBubble}>
                      {message.type === "ai" ? (
                        <div className={styles.markdownRender}>
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className={styles.mdH1}>{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className={styles.mdH2}>{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className={styles.mdH3}>{children}</h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className={styles.mdH4}>{children}</h4>
                              ),
                              h5: ({ children }) => (
                                <h5 className={styles.mdH5}>{children}</h5>
                              ),
                              h6: ({ children }) => (
                                <h6 className={styles.mdH6}>{children}</h6>
                              ),
                              p: ({ children }) => (
                                <p className={styles.mdP}>{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className={styles.mdUl}>{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className={styles.mdOl}>{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className={styles.mdLi}>{children}</li>
                              ),
                              code: ({ inline, className, children }) =>
                                inline ? (
                                  <code className={styles.mdInlineCode}>
                                    {children}
                                  </code>
                                ) : (
                                  <pre className={styles.mdPre}>
                                    <code className={className}>
                                      {children}
                                    </code>
                                  </pre>
                                ),
                              a: ({ href, children }) => (
                                <a
                                  className={styles.mdLink}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className={styles.mdBlockquote}>
                                  {children}
                                </blockquote>
                              ),
                              strong: ({ children }) => (
                                <strong className={styles.mdStrong}>
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className={styles.mdEm}>{children}</em>
                              ),
                              hr: () => <hr className={styles.mdHr} />,
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div>
                          <span>{message.text}</span>
                          {/* Show attachment names if any were sent */}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className={styles.messageAttachments}>
                                {message.attachments.map((name, i) => (
                                  <span
                                    key={i}
                                    className={styles.attachmentTag}
                                  >
                                    <FiFileText size={11} /> {name}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                    <div className={styles.messageTimestamp}>
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className={`${styles.messageWrapper} ${styles.aiMessage}`}>
                  <div className={styles.avatar}>E</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageAuthor}>
                      {selectedModel.name}
                    </div>
                    <div className={styles.messageBubble}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input bar */}
            <div className={styles.chatInputWrapper}>
              {/* Attachment chips in chat mode */}
              {attachments.length > 0 && (
                <div className={styles.chatAttachmentChips}>
                  {attachments.map((file, idx) => (
                    <div key={idx} className={styles.chip}>
                      <FiFileText size={12} />
                      <span className={styles.chipText}>{file.name}</span>
                      <button onClick={() => removeAttachment(idx)}>
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className={styles.chatFormContainer}
              >
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FiPaperclip size={18} />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Message ${selectedModel.name}...`}
                  className={styles.chatInput}
                />
                <button
                  type="submit"
                  disabled={
                    (!inputValue.trim() && attachments.length === 0) || isTyping
                  }
                  className={styles.chatSubmitBtn}
                >
                  <FiSend size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ── Right panel: Triage History ── */}
      <aside className={styles.rightPanel}>
        <TriageHistory onSelectTriage={(id) => setSelectedTriageId(id)} />
      </aside>

      {/* ── Triage Detail Modal ── */}
      {selectedTriageId && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedTriageId(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <TriageDetailView
              triageSessionId={selectedTriageId}
              onClose={() => setSelectedTriageId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
