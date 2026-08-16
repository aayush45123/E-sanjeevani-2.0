import React, { useState, useEffect, useRef } from "react";
import { PatientDashboardSkeleton } from "../../components/Skeletons";
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
import io from "socket.io-client";
import Sidebar from "../../components/Sidebar/Sidebar";
import TriageHistory from "../../components/TriageHistory/TriageHistory";
import TriageDetailView from "../../components/TriageDetailView/TriageDetailView";
import NotificationService from "../../utils/notificationService";
import styles from "./PatientDashBoard.module.css";
import { authApi, apiClient } from "../../utils/api";
import { performLogout } from "../../utils/auth";

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
    description: "Medical chatbot model (/api/chat)",
    endpoint: "/api/chat",
  },
  {
    id: "custom-triage-ai",
    name: "E-Sanjeevani AI Triage",
    provider: "Custom Medical Model",
    isPro: false,
    description:
      "Self-trained disease prediction model (/api/ai-triage/predict)",
    endpoint: "/api/ai-triage/predict",
  },
  {
    id: "fever-assessment",
    name: "Fever Assessment",
    provider: "E-Sanjeevani ML Model",
    icon: null,
    emoji: null,
    isPro: false,
    description: "Explainable fever differential (Dengue · Malaria · Typhoid · Chikungunya · Viral)",
    endpoint: "/api/fever/assess",
  },
];

// ─── Fever Assessment — conversation steps ───────────────────────────────────
const FEVER_STEPS = [
  {
    key: "red_flags",
    question:
      "**Safety check first.** Do you have any of these warning signs?\n\n" +
      "• Bleeding from nose, gums, or in vomit/stool\n" +
      "• Severe abdominal pain\n" +
      "• Difficulty breathing\n" +
      "• Confusion or loss of consciousness\n" +
      "• Fainting\n\n" +
      "Reply **Yes** or **No**.",
    type: "yesno",
    redFlag: true,
  },
  {
    key: "duration",
    question:
      "How long have you had the fever?\n\n" +
      "Reply: **1** = Less than 1 day · **2** = 1–3 days · **3** = 4–7 days · **4** = More than 7 days",
    type: "choice",
  },
  {
    key: "high_fever",
    question: "Is the fever **high** (feels very hot / ≥ 39 °C)? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "sudden_onset",
    question: "Did the fever start **suddenly / abruptly**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "chills",
    question: "Do you have **chills or shivering episodes**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "headache",
    question: "Do you have a **headache**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "pain_behind_eyes",
    question: "Do you have **pain behind the eyes** (retro-orbital pain)? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "joint_pain",
    question: "Do you have **joint pain**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "severe_joint_pain",
    question: "If yes to joint pain — is it **severe / debilitating**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "rash",
    question: "Do you have a **skin rash**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "nausea",
    question: "Do you have **nausea or vomiting**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "abdominal_pain",
    question: "Do you have **abdominal (stomach) pain**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "cough_throat",
    question: "Do you have **cough, sore throat, or runny nose**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "fatigue",
    question: "Do you have significant **fatigue or weakness**? Reply **Yes** or **No**.",
    type: "yesno",
  },
];

const isYes = (s) => /^y(es)?$/i.test(s.trim());
const isNo  = (s) => /^n(o)?$/i.test(s.trim());

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
  const [activeTriageSessionId, setActiveTriageSessionId] = useState(null);
  const [isHistoryMinimized, setIsHistoryMinimized] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // ── Fever assessment conversation state ─────────────────────────────────
  const [feverStep, setFeverStep] = useState(0);          // index into FEVER_STEPS
  const [feverAnswers, setFeverAnswers] = useState({});   // collected answers
  const [feverActive, setFeverActive] = useState(false);  // is fever flow running?

  // ── Derived ─────────────────────────────────────────────────────────────
  const hasStartedChat = messages.length > 0;

  // ── Fetch user, then hydrate messages ─────────────────
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        const fetchedUser = response.data.user || response.data;
        setUser(fetchedUser);

        // Load persisted messages from local storage fallback initially
        const userId = fetchedUser._id || fetchedUser.id;
        const persisted = loadMessagesFromStorage(userId);
        if (persisted.length > 0) {
          setMessages(persisted);
        }
      } catch (err) {
        if (err.status === 401 || err.response?.status === 401) {
          performLogout();
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

  // ── Socket listener for consultation notifications ───────────────────────
  useEffect(() => {
const SOCKET_URL =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
        const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on(
      "participant-waiting",
      ({ waitingUserRole, waitingUserName, message }) => {
        console.log(`⏳ ${message}`);
        const roleText = waitingUserRole === "doctor" ? "Dr." : "Patient";
        NotificationService.showToast(
          `⏳ ${roleText} ${waitingUserName} is waiting for you to join the consultation!`,
          "warning",
        );
        NotificationService.playSound("alert");
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Start a fresh new chat session ───────────────────────────────────────
  const handleNewChat = () => {
    setActiveTriageSessionId(null);
    setMessages([]);
    setFeverStep(0);
    setFeverAnswers({});
    setFeverActive(false);
    if (user) {
      const userId = user._id || user.id;
      localStorage.removeItem(getChatStorageKey(userId));
    }
  };

  // ── Fever: ask next question ────────────────────────────────────────────
  const askFeverQuestion = (stepIndex, msgs) => {
    const step = FEVER_STEPS[stepIndex];
    if (!step) return;
    const aiMsg = {
      id: Date.now() + stepIndex,
      type: "ai",
      text: step.question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...(msgs || prev), aiMsg]);
  };

  // ── Fever: build symptom vector from answers ─────────────────────────────
  const buildFeverPayload = (answers) => {
    const sym = {
      fever: 1,
      high_fever:        answers.high_fever   ? 1 : 0,
      sudden_onset:      answers.sudden_onset ? 1 : 0,
      headache:          answers.headache      ? 1 : 0,
      severe_headache:   answers.headache      ? 1 : 0,  // proxy
      chills:            answers.chills        ? 1 : 0,
      sweating:          answers.chills        ? 1 : 0,  // often co-occurs
      body_pain:         answers.joint_pain    ? 1 : 0,
      muscle_pain:       answers.joint_pain    ? 1 : 0,
      joint_pain:        answers.joint_pain    ? 1 : 0,
      severe_joint_pain: answers.severe_joint_pain ? 1 : 0,
      pain_behind_eyes:  answers.pain_behind_eyes  ? 1 : 0,
      rash:              answers.rash           ? 1 : 0,
      nausea:            answers.nausea         ? 1 : 0,
      vomiting:          answers.nausea         ? 1 : 0,
      abdominal_pain:    answers.abdominal_pain ? 1 : 0,
      diarrhea:          0,
      constipation:      0,
      cough:             answers.cough_throat   ? 1 : 0,
      sore_throat:       answers.cough_throat   ? 1 : 0,
      runny_nose:        answers.cough_throat   ? 1 : 0,
      fatigue:           answers.fatigue        ? 1 : 0,
      weakness:          answers.fatigue        ? 1 : 0,
      swollen_lymph_nodes: 0,
      loss_of_appetite:  0,
    };
    const red = {
      bleeding:           answers.red_flags || false,
      severe_abdominal_pain: answers.red_flags || false,
      confusion:          answers.red_flags || false,
      breathing_difficulty: answers.red_flags || false,
      fainting:           answers.red_flags || false,
    };
    return { symptoms: sym, red_flags: red };
  };

  // ── Fever: submit to API and render result ───────────────────────────────
  const submitFeverAssessment = async (answers) => {
    setIsTyping(true);
    try {
      const payload = { ...buildFeverPayload(answers), triageSessionId: activeTriageSessionId };
      const res = await apiClient.post("/fever/assess", payload);
      const data = res.data;

      if (data.triageSessionId) {
        setActiveTriageSessionId(data.triageSessionId);
      }
      setHistoryRefreshTrigger((prev) => prev + 1);

      let resultText = "";

      if (data.red_flag_alert) {
        resultText =
          `## URGENT WARNING\n\n` +
          `${data.red_flag_message}\n\n` +
          `**Warning signs detected:** ${data.red_flags_detected?.join(", ")}\n\n` +
          `Please call emergency services or go to the nearest hospital immediately.`;
      } else if (data.success && data.top_ranking) {
        const top = data.top_ranking;
        const explain = data.primary_explanation || [];
        const topDiseaseName = (top[0]?.disease || "Fever-like illness").replace(/_/g, " ");

        resultText =
          `## Fever Symptom Assessment\n\n` +
          `**Predicted Condition:** ${topDiseaseName}\n\n` +
          `**Why this condition was predicted:**\n` +
          (explain.length > 0
            ? explain.map((b) => `• ${b}`).join("\n")
            : "• Based on reported symptom combination") +
          `\n\n---\n\n` +
          `**Important:** ${data.disclaimer}\n\n` +
          `**Next Step:** ${data.recommended_action}`;
      } else {
        resultText = data.message || "Could not complete the fever assessment. Please ensure the AI server is running.";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 99, type: "ai", text: resultText, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 99,
          type: "ai",
          text: err.response?.data?.message || "Could not reach the fever assessment service. Please make sure the AI server is running.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setFeverActive(false);
      setFeverStep(0);
      setFeverAnswers({});
    }
  };

  // ── Fever: handle one user reply ─────────────────────────────────────────
  const handleFeverReply = async (userText) => {
    const step = FEVER_STEPS[feverStep];
    if (!step) return;

    // Record answer
    let answer = false;
    if (step.type === "yesno") {
      answer = isYes(userText);
    } else if (step.type === "choice") {
      answer = parseInt(userText.trim(), 10) || 1;
    }

    const newAnswers = { ...feverAnswers, [step.key]: answer };
    setFeverAnswers(newAnswers);

    // Red-flag short-circuit
    if (step.redFlag && answer === true) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 50,
            type: "ai",
            text:
              "## URGENT WARNING\n\n" +
              "You reported one or more serious warning signs.\n\n" +
              "**Please seek immediate medical attention or call emergency services.**\n\n" +
              "Do not delay — some of these symptoms may indicate severe dengue, severe malaria, or another medical emergency.",
            timestamp: new Date(),
          },
        ]);
        setFeverActive(false);
        setFeverStep(0);
        setFeverAnswers({});
        setIsTyping(false);
      }, 600);
      return;
    }

    const nextStep = feverStep + 1;

    if (nextStep >= FEVER_STEPS.length) {
      // All questions answered — submit
      await submitFeverAssessment(newAnswers);
    } else {
      setFeverStep(nextStep);
      setTimeout(() => askFeverQuestion(nextStep), 400);
    }
  };

  // ── Load a previous triage session from PostgreSQL history ────────────────
  const handleSelectTriageSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      const response = await apiClient.get(`/triage/history/${sessionId}`);
      const data = response.data;

      if (data.triageSession) {
        const session = data.triageSession;
        setActiveTriageSessionId(session.id);

        if (session.messages && session.messages.length > 0) {
          const loadedMsgs = session.messages.map((m) => ({
            id: m.id,
            type: m.role === "assistant" ? "ai" : "user",
            text: m.content,
            timestamp: new Date(m.createdAt),
          }));
          setMessages(loadedMsgs);
        } else {
          // If session has no chat messages (e.g. form submission assessment), clear current chat and open detail modal
          setMessages([]);
          setSelectedTriageId(sessionId);
        }
      } else {
        console.error("Failed to load triage session history:", data.message);
      }
    } catch (err) {
      console.error("Error fetching triage session details:", err);
    }
  };

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

    // ── FEVER ASSESSMENT MODEL ───────────────────────────────────────────────
    if (selectedModel.id === "fever-assessment") {
      if (!feverActive) {
        // First message kicks off the flow
        setFeverActive(true);
        setFeverStep(0);
        setFeverAnswers({});
        // Brief acknowledgement then ask step 0
        const ackMsg = {
          id: Date.now() + 1,
          type: "ai",
          text:
            "I'll help assess your fever symptoms through a short questionnaire.\n\n" +
            "This is a **differential assessment** — not a diagnosis. Please answer each question honestly. Let's begin:",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, ackMsg]);
        setTimeout(() => askFeverQuestion(0), 600);
      } else {
        // Ongoing fever conversation — process the reply
        await handleFeverReply(currentInput);
      }
      return;
    }

    // ── STANDARD CHAT MODELS ────────────────────────────────────────────────
    setIsTyping(true);
    try {
      const response = await apiClient.post("/chat", {
        prompt: currentInput,
        triageSessionId: activeTriageSessionId,
        model: selectedModel.id,
      });

      const data = response.data;
      const returnedSessionId = data?.data?.triageSessionId || data?.triageSessionId;
      if (returnedSessionId) setActiveTriageSessionId(returnedSessionId);
      setHistoryRefreshTrigger((prev) => prev + 1);

      const aiMessageText = data?.data?.reply
        ?.replace(/<\/?[Aa]nswer>\s*/g, "")
        ?.replace(/^[\s]*[Aa]nswer[\s]*:[\s]*/gm, "")
        ?.replace(/<[^>]*>/g, "")
        ?.replace(/\n{3,}/g, "\n\n")
        ?.trim();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: "ai", text: aiMessageText || "No response generated", timestamp: new Date() },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: "ai", text: "AI service is currently unavailable. Please try again later.", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const handleClearChat = () => {
    handleNewChat();
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
  const handleLogout = () => performLogout();

  const firstName = user?.name?.split(" ")[0] || "Patient";

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return <PatientDashboardSkeleton />;
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
                                  // Reset fever flow when switching models
                                  if (model.id !== "fever-assessment") {
                                    setFeverActive(false);
                                    setFeverStep(0);
                                    setFeverAnswers({});
                                  }
                                }}
                              >
                                <div className={styles.modelIconWrapper}>
                                  {model.icon ? (
                                    <img src={model.icon} alt={model.name} />
                                  ) : model.emoji ? (
                                    <span style={{ fontSize: "18px" }}>{model.emoji}</span>
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
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className={styles.clearChatBtn}
                  onClick={handleNewChat}
                  title="Start New Chat Session"
                  style={{ background: "#2563eb", color: "#ffffff" }}
                >
                  <span>+ New Chat</span>
                </button>
                <button
                  className={styles.clearChatBtn}
                  onClick={handleClearChat}
                  title="Clear current view"
                >
                  <FiTrash2 size={14} />
                  <span>Clear</span>
                </button>
              </div>
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
      <aside
        className={`${styles.rightPanel} ${
          isHistoryMinimized ? styles.rightPanelMinimized : ""
        }`}
      >
        <TriageHistory
          activeSessionId={activeTriageSessionId}
          onSelectTriage={handleSelectTriageSession}
          onDeleteTriage={(id) => {
            if (id === activeTriageSessionId) {
              handleNewChat();
            }
          }}
          isMinimized={isHistoryMinimized}
          onToggleMinimize={() => setIsHistoryMinimized((v) => !v)}
          refreshTrigger={historyRefreshTrigger}
        />
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
