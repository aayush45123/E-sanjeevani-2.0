import React, { useState, useEffect, useRef } from "react";
import { PatientDashboardSkeleton } from "../../components/Skeletons";
import {
  Sparkles,
  Command,
  Paperclip,
  ArrowUp,
  X,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Stethoscope,
  Thermometer,
  Calendar,
  Pill,
  Check,
  Bot,
  Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import io from "socket.io-client";
import Sidebar from "../../components/Sidebar/Sidebar";
import TriageHistory from "../../components/TriageHistory/TriageHistory";
import TriageDetailView from "../../components/TriageDetailView/TriageDetailView";
import NotificationService from "../../utils/notificationService";
import styles from "./PatientDashBoard.module.css";
import { authApi, apiClient } from "../../utils/api";
import { performLogout } from "../../utils/auth";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────
const getChatStorageKey = (userId) =>
  userId ? `chat_messages_${userId}` : "chat_messages_anon";

const loadMessagesFromStorage = (userId) => {
  try {
    const raw = localStorage.getItem(getChatStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
};

const saveMessagesToStorage = (userId, messages) => {
  try {
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
    icon: null,
    isPro: false,
    description: "Self-trained disease prediction model (/api/ai-triage/predict)",
    endpoint: "/api/ai-triage/predict",
  },
  {
    id: "fever-assessment",
    name: "Fever Assessment",
    provider: "E-Sanjeevani ML Model",
    icon: null,
    isPro: false,
    description: "Explainable fever differential (Dengue, Malaria, Typhoid)",
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
    question: "Do you have **joint pain or severe body aches**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "rash",
    question: "Do you have a **skin rash or red spots**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "nausea_vomiting",
    question: "Do you have **nausea or vomiting**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "diarrhea_constipation",
    question: "Do you have **diarrhea, abdominal discomfort, or constipation**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "cough_sore_throat",
    question: "Do you have a **cough, runny nose, or sore throat**? Reply **Yes** or **No**.",
    type: "yesno",
  },
  {
    key: "fatigue",
    question: "Do you have significant **fatigue or weakness**? Reply **Yes** or **No**.",
    type: "yesno",
  },
];

const isYes = (s) => /^y(es)?$/i.test(s.trim());

const mockRecords = [
  "Blood_Test_April2026.pdf",
  "MRI_Lumbar_Scan.jpg",
  "DrSmith_Prescription.docx",
];

// ─── Healthcare Command Palette Suggestions ─────────────────────────────────
const commandSuggestions = [
  {
    icon: <Stethoscope size={14} />,
    label: "Symptom Triage",
    description: "Start clinical assessment",
    prefix: "/triage",
    prompt: "I want to describe my symptoms for a clinical assessment: ",
  },
  {
    icon: <Thermometer size={14} />,
    label: "Fever Differential",
    description: "Multi-disease fever check",
    prefix: "/fever",
    prompt: "Start fever assessment",
    modelId: "fever-assessment",
  },
  {
    icon: <FileText size={14} />,
    label: "Clinical Records",
    description: "Attach past medical records",
    prefix: "/records",
    action: "records",
  },
  {
    icon: <Calendar size={14} />,
    label: "Find Specialist",
    description: "Connect with available doctors",
    prefix: "/doctor",
    prompt: "Help me find and consult an available doctor for ",
  },
  {
    icon: <Pill size={14} />,
    label: "Medication Info",
    description: "Dosage & precautions",
    prefix: "/meds",
    prompt: "What are the common dosage guidelines and precautions for: ",
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  // Model & dropdown state
  const [selectedModel, setSelectedModel] = useState(aiModelsData[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRecordMenu, setShowRecordMenu] = useState(false);

  // Triage state
  const [selectedTriageId, setSelectedTriageId] = useState(null);
  const [activeTriageSessionId, setActiveTriageSessionId] = useState(null);
  const [isHistoryMinimized, setIsHistoryMinimized] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Fever assessment state
  const [feverStep, setFeverStep] = useState(0);
  const [feverAnswers, setFeverAnswers] = useState({});
  const [feverActive, setFeverActive] = useState(false);

  const hasStartedChat = messages.length > 0;

  // Auto-resize textarea handler
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 160)}px`;
    }
  };

  // ── Fetch user & hydrate messages ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        const fetchedUser = response.data.user || response.data;
        setUser(fetchedUser);

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

  // Persist messages
  useEffect(() => {
    if (user) {
      const userId = user._id || user.id;
      saveMessagesToStorage(userId, messages);
    }
  }, [messages, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Command palette detection
  useEffect(() => {
    if (inputValue.startsWith("/") && !inputValue.includes(" ")) {
      setShowCommandPalette(true);
      const matchIdx = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.toLowerCase().startsWith(inputValue.toLowerCase())
      );
      if (matchIdx >= 0) setActiveSuggestion(matchIdx);
    } else {
      setShowCommandPalette(false);
    }
    adjustTextareaHeight();
  }, [inputValue]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowModelMenu(false);
      setShowRecordMenu(false);
      setShowCommandPalette(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Socket listener
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on(
      "participant-waiting",
      ({ waitingUserRole, waitingUserName, message }) => {
        const roleText = waitingUserRole === "doctor" ? "Dr." : "Patient";
        NotificationService.showToast(
          `${roleText} ${waitingUserName} is waiting for you to join the consultation!`,
          "warning"
        );
        NotificationService.playSound("alert");
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Select Command Suggestion ──────────────────────────────────────────────
  const handleSelectCommand = (cmd) => {
    if (cmd.modelId) {
      const targetModel = aiModelsData.find((m) => m.id === cmd.modelId);
      if (targetModel) setSelectedModel(targetModel);
    }
    if (cmd.action === "records") {
      setShowRecordMenu(true);
      setInputValue("");
    } else if (cmd.prompt) {
      setInputValue(cmd.prompt);
    } else {
      setInputValue(cmd.prefix + " ");
    }
    setShowCommandPalette(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // ── Keyboard Navigation in Command Palette ─────────────────────────────────
  const handleKeyDown = (e) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
        return;
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0 && activeSuggestion < commandSuggestions.length) {
          handleSelectCommand(commandSuggestions[activeSuggestion]);
        }
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Start New Chat Session ────────────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([]);
    setActiveTriageSessionId(null);
    setFeverActive(false);
    setFeverStep(0);
    setFeverAnswers({});
    setAttachments([]);
    setInputValue("");
    if (user) {
      const userId = user._id || user.id;
      localStorage.removeItem(getChatStorageKey(userId));
    }
    toast.success("Started a new chat session");
  };

  // ── Ask Fever Step Question ───────────────────────────────────────────────
  const askFeverQuestion = (stepIndex) => {
    const step = FEVER_STEPS[stepIndex];
    if (!step) return;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "ai",
          text: step.question,
          timestamp: new Date(),
        },
      ]);
    }, 400);
  };

  // ── Submit Fever Assessment ───────────────────────────────────────────────
  const submitFeverAssessment = async (answers) => {
    setIsTyping(true);
    try {
      const durationScore =
        typeof answers.duration === "number" ? answers.duration : 1;

      const payload = {
        high_fever: answers.high_fever ? 1 : 0,
        sudden_onset: answers.sudden_onset ? 1 : 0,
        chills: answers.chills ? 1 : 0,
        headache: answers.headache ? 1 : 0,
        pain_behind_eyes: answers.pain_behind_eyes ? 1 : 0,
        joint_pain: answers.joint_pain ? 1 : 0,
        rash: answers.rash ? 1 : 0,
        nausea_vomiting: answers.nausea_vomiting ? 1 : 0,
        diarrhea_constipation: answers.diarrhea_constipation ? 1 : 0,
        cough_sore_throat: answers.cough_sore_throat ? 1 : 0,
        fatigue: answers.fatigue ? 1 : 0,
        duration_days: durationScore,
      };

      const response = await apiClient.post("/fever/assess", payload);
      const data = response.data;

      if (data.success && data.assessment) {
        const a = data.assessment;
        let md = `## Fever Assessment Report\n\n`;
        md += `**Primary Suspect:** ${a.prediction} (${a.confidence}% confidence)\n`;
        md += `**Risk Level:** ${a.riskLevel}\n\n`;
        md += `### Clinical Summary\n${a.summary}\n\n`;

        if (a.topMatches && a.topMatches.length > 1) {
          md += `### Differential Probabilities\n`;
          a.topMatches.forEach((m) => {
            md += `• **${m.disease}**: ${m.probability}%\n`;
          });
          md += `\n`;
        }

        if (a.recommendations && a.recommendations.length > 0) {
          md += `### Recommended Next Steps\n`;
          a.recommendations.forEach((r) => {
            md += `• ${r}\n`;
          });
          md += `\n`;
        }

        if (a.suggestedSpecialist) {
          md += `**Suggested Specialist:** ${a.suggestedSpecialist}\n\n`;
        }

        md += `*${a.disclaimer}*`;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: md,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to get assessment");
      }
    } catch (err) {
      console.error("Fever assessment submission error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text:
            "I encountered an error submitting your answers to the fever assessment model. Please try again or consult a doctor directly.",
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

  // ── Handle Fever Flow Reply ───────────────────────────────────────────────
  const handleFeverReply = async (userText) => {
    const step = FEVER_STEPS[feverStep];
    if (!step) return;

    let answer = false;
    if (step.type === "yesno") {
      answer = isYes(userText);
    } else if (step.type === "choice") {
      answer = parseInt(userText.trim(), 10) || 1;
    }

    const newAnswers = { ...feverAnswers, [step.key]: answer };
    setFeverAnswers(newAnswers);

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
              "Do not delay — some of these symptoms may indicate severe dengue, severe malaria, or another critical emergency.",
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
      await submitFeverAssessment(newAnswers);
    } else {
      setFeverStep(nextStep);
      askFeverQuestion(nextStep);
    }
  };

  // ── Load History Session ──────────────────────────────────────────────────
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
          setMessages([]);
          setSelectedTriageId(sessionId);
        }
      }
    } catch (err) {
      console.error("Error fetching triage session details:", err);
    }
  };

  // ── Send Message ─────────────────────────────────────────────────────────
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Fever Assessment Flow
    if (selectedModel.id === "fever-assessment") {
      if (!feverActive) {
        setFeverActive(true);
        setFeverStep(0);
        setFeverAnswers({});
        setIsTyping(true);

        const ackMsg = {
          id: Date.now() + 1,
          type: "ai",
          text:
            "I'll help assess your fever symptoms through a structured questionnaire.\n\n" +
            "This is an **explainable differential assessment** — not a definitive diagnosis. Please answer each question honestly. Let's begin:",
          timestamp: new Date(),
        };

        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, ackMsg]);
          askFeverQuestion(0);
        }, 500);
      } else {
        await handleFeverReply(currentInput);
      }
      return;
    }

    // Standard Chat Models
    setIsTyping(true);
    try {
      const response = await apiClient.post("/chat", {
        prompt: currentInput,
        triageSessionId: activeTriageSessionId,
        model: selectedModel.id,
      });

      const data = response.data;
      const returnedSessionId =
        data?.data?.triageSessionId || data?.triageSessionId;
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
        {
          id: Date.now() + 1,
          type: "ai",
          text: aiMessageText || "No response generated",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: "AI service is currently unavailable. Please check back shortly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Clear Chat ────────────────────────────────────────────────────────────
  const handleClearChat = () => {
    handleNewChat();
  };

  // ── File Upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      toast.success(`Attached ${files.length} file(s)`);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ── Record Select ─────────────────────────────────────────────────────────
  const handleRecordSelect = (record) => {
    setInputValue(
      (prev) => prev + (prev.trim() ? " " : "") + `[Referencing: ${record}] `
    );
    setShowRecordMenu(false);
    toast.success(`Referenced ${record}`);
  };

  const handleLogout = () => performLogout();
  const firstName = user?.name?.split(" ")[0] || "Patient";

  if (loading) {
    return <PatientDashboardSkeleton />;
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        multiple
        onChange={handleFileUpload}
      />

      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Chat Area */}
      <main className={styles.mainContent}>
        {!hasStartedChat ? (
          /* ── Idle / Landing Hero State ── */
          <div className={styles.idleState}>
            <div className={styles.heroSection}>
              <h1 className={styles.greeting}>
                How can we help today, {firstName}?
              </h1>
              <p className={styles.subtitle}>
                Ask symptom questions, clinical insights, or type{" "}
                <strong>/</strong> for commands.
              </p>
            </div>

            {/* Center Input Card */}
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                {/* Attachment Chips */}
                {attachments.length > 0 && (
                  <div className={styles.attachmentChips}>
                    {attachments.map((file, idx) => (
                      <div key={idx} className={styles.chip}>
                        <FileText size={12} />
                        <span className={styles.chipText}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          title="Remove attachment"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Command Palette Dropdown */}
                {showCommandPalette && (
                  <div
                    className={styles.commandPaletteWrapper}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.commandPaletteHeader}>
                      <span className={styles.commandPaletteTitle}>Commands</span>
                      <span className={styles.commandPaletteShortcut}>↑↓ · Enter</span>
                    </div>
                    <div className={styles.commandList}>
                      {commandSuggestions.map((cmd, idx) => (
                        <div
                          key={cmd.prefix}
                          className={`${styles.commandItem} ${
                            activeSuggestion === idx ? styles.commandItemActive : ""
                          }`}
                          onClick={() => handleSelectCommand(cmd)}
                        >
                          {cmd.icon}
                          <span className={styles.commandItemLabel}>{cmd.label}</span>
                          <span className={styles.commandItemDesc}>{cmd.description}</span>
                          <span className={styles.commandItemPrefix}>{cmd.prefix}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-resizing Textarea */}
                <textarea
                  ref={textareaRef}
                  className={styles.largeInput}
                  placeholder="Ask about symptoms, health records, or type / for commands..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />

                {/* Input Bottom Tools Row */}
                <div className={styles.inputBottomRow}>
                  <div className={styles.leftTools}>
                    {/* Attach File Button */}
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Attach Records"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={15} />
                    </button>

                    {/* Toggle Command Palette */}
                    <button
                      type="button"
                      className={`${styles.iconButton} ${showCommandPalette ? styles.iconButtonActive : ""}`}
                      title="Commands (/)"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCommandPalette((prev) => !prev);
                        if (!inputValue.startsWith("/")) {
                          setInputValue("/");
                        }
                      }}
                    >
                      <Command size={14} />
                    </button>

                    {/* Model Picker Pill */}
                    <div
                      className={styles.relativeContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={styles.pillButton}
                        onClick={() => {
                          setShowModelMenu((v) => !v);
                          setShowRecordMenu(false);
                        }}
                      >
                        <Bot size={13} />
                        <span>{selectedModel.name}</span>
                        <ChevronDown size={12} />
                      </button>

                      {showModelMenu && (
                        <div className={`${styles.popoverMenu} ${styles.modelMenuWide}`}>
                          <div className={styles.popoverHeader}>Select AI Model</div>
                          <div className={styles.modelList}>
                            {aiModelsData.map((model) => (
                              <div
                                key={model.id}
                                className={`${styles.modelItem} ${
                                  selectedModel.id === model.id ? styles.selectedModelItem : ""
                                }`}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelMenu(false);
                                  if (model.id !== "fever-assessment") {
                                    setFeverActive(false);
                                    setFeverStep(0);
                                    setFeverAnswers({});
                                  }
                                  toast.success(`Switched model to ${model.name}`);
                                }}
                              >
                                <div className={styles.modelIconWrapper}>
                                  {model.icon ? (
                                    <img src={model.icon} alt={model.name} />
                                  ) : (
                                    <Activity size={16} />
                                  )}
                                </div>
                                <div className={styles.modelItemContent}>
                                  <div className={styles.modelItemHeader}>
                                    <span className={styles.modelItemTitle}>{model.name}</span>
                                    {model.isPro && <span className={styles.proBadge}>PRO</span>}
                                  </div>
                                  <span className={styles.modelItemProvider}>
                                    {model.provider} · {model.description}
                                  </span>
                                </div>
                                {selectedModel.id === model.id && (
                                  <div className={styles.modelItemCheck}>
                                    <Check size={15} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Records Dropdown */}
                    <div
                      className={styles.relativeContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={styles.pillButton}
                        onClick={() => {
                          setShowRecordMenu((v) => !v);
                          setShowModelMenu(false);
                        }}
                      >
                        <FileText size={13} />
                        <span>Records</span>
                        <ChevronDown size={12} />
                      </button>

                      {showRecordMenu && (
                        <div className={styles.popoverMenu}>
                          <div className={styles.popoverHeader}>Clinical Records</div>
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

                  {/* Send Button */}
                  <div className={styles.rightTools}>
                    <button
                      type="button"
                      className={`${styles.submitBtn} ${
                        inputValue.trim() || attachments.length > 0
                          ? styles.submitBtnActive
                          : ""
                      }`}
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() && attachments.length === 0}
                      title="Send Message"
                    >
                      <ArrowUp size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimalist Quick Suggestion Pills */}
            <div className={styles.suggestionsRow}>
              {[
                {
                  icon: <Stethoscope size={14} />,
                  label: "Check symptoms",
                  prompt: "I want to describe my symptoms for a medical assessment: ",
                },
                {
                  icon: <Thermometer size={14} />,
                  label: "Assess fever",
                  prompt: "Start fever assessment",
                  modelId: "fever-assessment",
                },
                {
                  icon: <Calendar size={14} />,
                  label: "Find doctor",
                  prompt: "Help me find and consult an available specialist doctor for ",
                },
                {
                  icon: <FileText size={14} />,
                  label: "Explain lab report",
                  prompt: "Please analyze and explain this medical report in plain language: ",
                },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  className={styles.suggestionPill}
                  onClick={() => {
                    if (pill.modelId) {
                      const targetModel = aiModelsData.find(
                        (m) => m.id === pill.modelId
                      );
                      if (targetModel) setSelectedModel(targetModel);
                    }
                    setInputValue(pill.prompt);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Active Chat State ── */
          <div className={styles.chatView}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <h2 className={styles.chatHeaderTitle}>Clinical Consultation</h2>
                <span className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  Live
                </span>

                {/* Clickable Model Badge in Header */}
                <div
                  className={styles.relativeContainer}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={styles.headerModelBadge}
                    onClick={() => {
                      setShowModelMenu((v) => !v);
                      setShowRecordMenu(false);
                    }}
                  >
                    <Bot size={13} />
                    <span>{selectedModel.name}</span>
                    <ChevronDown size={11} />
                  </button>

                  {showModelMenu && (
                    <div
                      className={`${styles.popoverMenu} ${styles.modelMenuWide}`}
                      style={{ top: "calc(100% + 6px)", bottom: "auto" }}
                    >
                      <div className={styles.popoverHeader}>Switch Model</div>
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
                              if (model.id !== "fever-assessment") {
                                setFeverActive(false);
                                setFeverStep(0);
                                setFeverAnswers({});
                              }
                              toast.success(`Switched model to ${model.name}`);
                            }}
                          >
                            <div className={styles.modelIconWrapper}>
                              {model.icon ? (
                                <img src={model.icon} alt={model.name} />
                              ) : (
                                <Activity size={16} />
                              )}
                            </div>
                            <div className={styles.modelItemContent}>
                              <div className={styles.modelItemHeader}>
                                <span className={styles.modelItemTitle}>
                                  {model.name}
                                </span>
                                {model.isPro && (
                                  <span className={styles.proBadge}>PRO</span>
                                )}
                              </div>
                              <span className={styles.modelItemProvider}>
                                {model.provider} · {model.description}
                              </span>
                            </div>
                            {selectedModel.id === model.id && (
                              <div className={styles.modelItemCheck}>
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Right Actions */}
              <div className={styles.chatHeaderRight}>
                <button
                  type="button"
                  className={`${styles.headerActionBtn} ${styles.headerActionBtnPrimary}`}
                  onClick={handleNewChat}
                  title="New Session"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>

                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={handleClearChat}
                  title="Clear View"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Message Thread Stream */}
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.type === "user" ? styles.userMessage : styles.aiMessage
                  }`}
                >
                  {message.type === "ai" ? (
                    <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                      <Bot size={15} />
                    </div>
                  ) : (
                    <div className={`${styles.avatar} ${styles.userAvatar}`}>
                      {firstName.charAt(0)}
                    </div>
                  )}

                  <div className={styles.messageContent}>
                    <div className={styles.messageAuthor}>
                      {message.type === "user" ? "You" : selectedModel.name}
                    </div>

                    <div className={styles.messageBubble}>
                      {message.type === "ai" ? (
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
                                  <code className={className}>{children}</code>
                                </pre>
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
                      ) : (
                        <div>
                          <span>{message.text}</span>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className={styles.messageAttachments}>
                              {message.attachments.map((name, i) => (
                                <span key={i} className={styles.attachmentTag}>
                                  <FileText size={11} />
                                  <span>{name}</span>
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

              {/* Typing Indicator */}
              {isTyping && (
                <div className={styles.typingWrapper}>
                  <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                    <Bot size={15} />
                  </div>
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Floating Input Bar in Chat Mode */}
            <div className={styles.chatInputWrapper}>
              {attachments.length > 0 && (
                <div className={styles.chatAttachmentChips}>
                  {attachments.map((file, idx) => (
                    <div key={idx} className={styles.chip}>
                      <FileText size={12} />
                      <span className={styles.chipText}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        title="Remove attachment"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Command Palette Dropdown in Chat Mode */}
              {showCommandPalette && (
                <div
                  className={styles.commandPaletteWrapper}
                  style={{ maxWidth: "720px", margin: "0 auto 6px" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.commandPaletteHeader}>
                    <span className={styles.commandPaletteTitle}>Commands</span>
                    <span className={styles.commandPaletteShortcut}>↑↓ · Enter</span>
                  </div>
                  <div className={styles.commandList}>
                    {commandSuggestions.map((cmd, idx) => (
                      <div
                        key={cmd.prefix}
                        className={`${styles.commandItem} ${
                          activeSuggestion === idx ? styles.commandItemActive : ""
                        }`}
                        onClick={() => handleSelectCommand(cmd)}
                      >
                        {cmd.icon}
                        <span className={styles.commandItemLabel}>{cmd.label}</span>
                        <span className={styles.commandItemDesc}>{cmd.description}</span>
                        <span className={styles.commandItemPrefix}>{cmd.prefix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className={styles.chatFormContainer}
              >
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Files"
                >
                  <Paperclip size={15} />
                </button>

                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommandPalette((prev) => !prev);
                    if (!inputValue.startsWith("/")) setInputValue("/");
                  }}
                  title="Commands (/)"
                >
                  <Command size={14} />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${selectedModel.name} or type / for commands...`}
                  className={styles.chatInput}
                />

                <button
                  type="submit"
                  disabled={
                    (!inputValue.trim() && attachments.length === 0) || isTyping
                  }
                  className={styles.chatSubmitBtn}
                  title="Send Message"
                >
                  <ArrowUp size={15} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ── Right Panel: Triage History ── */}
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
