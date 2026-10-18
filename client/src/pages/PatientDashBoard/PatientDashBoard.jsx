import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PatientDashboardSkeleton } from "../../components/Skeletons";
import {
  Sparkles,
  Command,
  Paperclip,
  ArrowUp,
  ArrowRight,
  X,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Stethoscope,
  Thermometer,
  Calendar,
  Clock,
  Pill,
  Check,
  Bot,
  Activity,
  ShieldCheck,
  Video,
  ClipboardList,
  MapPin,
  Building2,
  Award,
  Star,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import io from "socket.io-client";
import Sidebar from "../../components/Sidebar/Sidebar";
import TriageHistory from "../../components/TriageHistory/TriageHistory";
import TriageDetailView from "../../components/TriageDetailView/TriageDetailView";
import NotificationService from "../../utils/notificationService";
import styles from "./PatientDashBoard.module.css";
import { authApi, consultationApi, medicalRecordApi, apiClient } from "../../utils/api";
import { performLogout } from "../../utils/auth";
import {
  getHomemadeRemedies,
  getRecommendedDoctor,
} from "../../utils/remediesAndDoctorRecommender";
import { formatDoctorName, getDoctorInitials } from "../../utils/doctorUtils";
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
    description: "Medical conversational chatbot model (/api/chat)",
    endpoint: "/api/chat",
  },
  {
    id: "e-sanjeevani-triage",
    name: "E-Sanjeevani Triage",
    provider: "Unified ML Clinical Triage",
    icon: null,
    isPro: false,
    description: "Unified multi-category disease triage (Fever, Respiratory, Digestive, Skin, Urinary Tract)",
    endpoint: "/api/fever/assess",
  },
];

// ─── E-Sanjeevani Unified Triage — conversational steps ─────────────────────
// Step 0: category selection. Steps 1+ are per-category Yes/No symptoms.
const TRIAGE_CATEGORIES = [
  { key: "fever",         label: "A — Fever",          short: "Fever (Dengue, Malaria, Typhoid…)" },
  { key: "respiratory",  label: "B — Respiratory",     short: "Respiratory (Cough, Asthma, Pneumonia…)" },
  { key: "digestive",    label: "C — Digestive",       short: "Digestive (Acidity, IBS, Gastroenteritis…)" },
  { key: "skin",         label: "D — Skin",             short: "Skin (Acne, Eczema, Psoriasis…)" },
  { key: "urinary_tract",label: "E — Urinary Tract",  short: "Urinary Tract (UTI, Kidney Stones…)" },
];

// Per-category question banks — maps each category to a list of Yes/No symptom steps
const TRIAGE_STEPS_BY_CATEGORY = {
  fever: [
    { key: "red_flags", redFlag: true, type: "yesno",
      question: "**Safety check first** — any of these?\n\n• Bleeding from nose/gums/stool or skin spots\n• Severe abdominal pain\n• Difficulty breathing / fainting\n• Confusion or loss of consciousness\n\nReply **Yes** or **No**.",
      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "high_fever",     type: "yesno", question: "Do you have **high fever** (≥39°C / 102°F)?" , options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "sudden_onset",   type: "yesno", question: "Did the fever start **suddenly / abruptly**?",     options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "chills",         type: "yesno", question: "Do you have **chills or shivering episodes**?",   options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "headache",       type: "yesno", question: "Do you have a **headache**?",                     options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "pain_behind_eyes",type:"yesno", question: "**Pain behind the eyes** (retro-orbital)?",       options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "joint_pain",     type: "yesno", question: "**Joint pain or severe body aches**?",            options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "rash",           type: "yesno", question: "**Skin rash, red spots, or petechiae**?",        options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "nausea",         type: "yesno", question: "**Nausea or vomiting**?",                         options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "diarrhea",       type: "yesno", question: "**Diarrhea or abdominal discomfort**?",           options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "fatigue",        type: "yesno", question: "Significant **fatigue or weakness**?",           options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
  ],
  respiratory: [
    { key: "red_flags", redFlag: true, type: "yesno",
      question: "**Safety check** — any of these?\n\n• Severe difficulty breathing / gasping\n• Blue lips or nails\n• Coughing up blood\n• Crushing chest pain\n\nReply **Yes** or **No**.",
      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "cough",                   type: "yesno", question: "Do you have a **cough** (dry or with phlegm)?",                 options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "shortness_of_breath",     type: "yesno", question: "**Shortness of breath / difficulty breathing**?",              options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "wheezing",                type: "yesno", question: "**Wheezing** (whistling sound when breathing)?",               options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "chest_tightness",         type: "yesno", question: "**Chest tightness** or pressure?",                            options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "fever",                   type: "yesno", question: "Do you have **fever** with your chest symptoms?",              options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "sore_throat",             type: "yesno", question: "**Sore throat or nasal congestion**?",                        options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "symptom_triggers_allergens_exercise", type: "yesno", question: "Do symptoms **worsen with allergens or exercise**?", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "fatigue",                 type: "yesno", question: "Significant **fatigue or tiredness**?",                       options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
  ],
  digestive: [
    { key: "red_flags", redFlag: true, type: "yesno",
      question: "**Safety check** — any of these?\n\n• Blood in vomit or black/tarry stool\n• Rigid or board-like abdomen\n• Complete inability to swallow fluids\n\nReply **Yes** or **No**.",
      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "heartburn_retrosternal_burning", type: "yesno", question: "**Heartburn / burning sensation behind the breastbone**?", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "nausea",                  type: "yesno", question: "**Nausea or vomiting**?",                                      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "watery_diarrhea",         type: "yesno", question: "**Watery diarrhea or loose stools**?",                        options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "cramping_abdominal_pain", type: "yesno", question: "**Cramping abdominal pain**?",                                 options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "bloating_abdominal_distension", type: "yesno", question: "**Bloating or feeling of abdominal fullness**?",         options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "alternating_bowel_habits",type: "yesno", question: "**Alternating constipation and diarrhea**?",                  options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "belching_and_gas",        type: "yesno", question: "**Excessive belching or flatulence (gas)**?",                 options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "worse_lying_down_after_eating", type: "yesno", question: "Symptoms **worse when lying down after eating**?",       options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
  ],
  skin: [
    { key: "red_flags", redFlag: true, type: "yesno",
      question: "**Safety check** — any of these?\n\n• Swelling of face, lips, or throat\n• Widespread skin blistering or peeling\n• Rapidly spreading purple spots with fever\n\nReply **Yes** or **No**.",
      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "intense_itching_pruritus",      type: "yesno", question: "**Intense itching** (pruritus) of the skin?",               options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "comedones_blackheads_whiteheads",type: "yesno", question: "**Blackheads, whiteheads or comedones** on skin?",          options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "inflammatory_papules_pustules", type: "yesno", question: "**Inflamed pimples or pustules** on skin?",                  options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "dry_cracked_flaking_skin",      type: "yesno", question: "**Dry, cracked or flaking skin**?",                         options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "silvery_white_micaceous_scales",type: "yesno", question: "**Silvery-white scaly patches** on skin?",                  options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "ring_shaped_annular_patches",   type: "yesno", question: "**Ring-shaped or circular patches** on skin?",              options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "raised_transient_wheals_welts", type: "yesno", question: "**Raised, transient hives or welts** that come and go?",   options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "burning_or_stinging_sensation", type: "yesno", question: "**Burning or stinging sensation** at the skin site?",       options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
  ],
  urinary_tract: [
    { key: "red_flags", redFlag: true, type: "yesno",
      question: "**Safety check** — any of these?\n\n• Complete inability to urinate with painful bladder distension\n• Passing blood clots in urine\n• High fever with shaking chills and flank pain\n\nReply **Yes** or **No**.",
      options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "dysuria_burning_urination", type: "yesno", question: "**Burning or painful urination** (dysuria)?",                    options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "urinary_frequency",         type: "yesno", question: "**Increased urinary frequency** (urinating very often)?",       options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "urinary_urgency",           type: "yesno", question: "**Sudden urinary urgency** (cannot delay urination)?",          options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "renal_colic_severe_flank_pain", type: "yesno", question: "**Severe flank or loin pain** (waves of sharp cramping)?", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "hematuria_visible_blood_in_urine", type: "yesno", question: "**Blood in urine** (pink, red, or cola-coloured)?",    options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "cloudy_foul_smelling_urine",type: "yesno", question: "**Cloudy or foul-smelling urine**?",                            options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "weak_urinary_stream",       type: "yesno", question: "**Weak urinary stream or difficulty starting urination**?",     options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
    { key: "high_fever_and_rigors",     type: "yesno", question: "**High fever with shaking chills (rigors)**?",                 options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] },
  ],
};

// Category-selection step shown FIRST
const TRIAGE_CATEGORY_STEP = {
  key: "category",
  type: "category_select",
  question:
    "Welcome to **E-Sanjeevani Triage** — an AI-powered clinical differential assessment.\n\n" +
    "Which **body system** best describes your primary complaint?\n\n" +
    "• **A** — Fever (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever)\n" +
    "• **B** — Respiratory (Asthma, Pneumonia, Bronchitis, Influenza, Cold)\n" +
    "• **C** — Digestive (GERD, IBS, Gastroenteritis, Peptic Ulcer, Gastritis)\n" +
    "• **D** — Skin (Acne, Eczema, Psoriasis, Fungal Infection, Urticaria)\n" +
    "• **E** — Urinary Tract (UTI, Kidney Stones, Pyelonephritis, OAB, BPH)\n\n" +
    "Type **A, B, C, D, or E** — or select below:",
  options: [
    { label: "A — Fever",         value: "fever" },
    { label: "B — Respiratory",   value: "respiratory" },
    { label: "C — Digestive",     value: "digestive" },
    { label: "D — Skin",          value: "skin" },
    { label: "E — Urinary Tract", value: "urinary_tract" },
  ],
};

const isYes = (s) => /^y(es)?$/i.test(s.trim());

// Map letter shorthand to category key
const LETTER_TO_CATEGORY = {
  a: "fever", b: "respiratory", c: "digestive", d: "skin", e: "urinary_tract",
  fever: "fever", respiratory: "respiratory", digestive: "digestive", skin: "skin", urinary_tract: "urinary_tract",
};

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
    label: "E-Sanjeevani Triage",
    description: "5-category clinical ML triage",
    prefix: "/fever",
    prompt: "Start triage assessment",
    modelId: "e-sanjeevani-triage",
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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [records, setRecords] = useState([]);

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

  // Unified Triage conversational state
  const [feverStep, setFeverStep] = useState(0);
  const [feverAnswers, setFeverAnswers] = useState({});
  const [feverActive, setFeverActive] = useState(false);
  const [triageCategory, setTriageCategory] = useState(null); // selected category key

  // User Geolocation for local doctor recommendations
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Location permission not provided or skipped:", err.message);
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const hasStartedChat = messages.length > 0;

  // Auto-resize textarea handler
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 160)}px`;
    }
  };

  // ── Fetch user, consultations, records & hydrate messages ───────────────────
  useEffect(() => {
    async function init() {
      try {
        const [userRes, consultRes, recRes] = await Promise.all([
          authApi.me().catch((err) => {
            if (err.status === 401 || err.response?.status === 401) {
              performLogout();
            }
            return null;
          }),
          consultationApi.getMyConsultations().catch((err) => {
            console.error("Failed to load consultations:", err);
            return { data: { consultations: [] } };
          }),
          medicalRecordApi.getMyRecords().catch((err) => {
            console.error("Failed to load medical records:", err);
            return { data: { records: [] } };
          }),
        ]);

        if (userRes?.data) {
          const fetchedUser = userRes.data.user || userRes.data;
          setUser(fetchedUser);

          const userId = fetchedUser._id || fetchedUser.id;
          const persisted = loadMessagesFromStorage(userId);
          if (persisted.length > 0) {
            setMessages(persisted);
          }
        }

        setConsultations(consultRes?.data?.consultations || []);
        setRecords(recRes?.data?.records || []);
      } catch (err) {
        console.error("Dashboard init error:", err);
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
    setTriageCategory(null);
    setAttachments([]);
    setInputValue("");
    if (user) {
      const userId = user._id || user.id;
      localStorage.removeItem(getChatStorageKey(userId));
    }
    toast.success("Started a new chat session");
  };

  // ── Ask Triage Step Question ──────────────────────────────────────────────
  const askFeverQuestion = (stepIndex, categoryKey) => {
    const catKey = categoryKey || triageCategory;
    // Step 0 is always the category selection step
    const step = stepIndex === 0
      ? TRIAGE_CATEGORY_STEP
      : (TRIAGE_STEPS_BY_CATEGORY[catKey] || [])[stepIndex - 1];
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
          options: step.options || [],
          timestamp: new Date(),
        },
      ]);
    }, 400);
  };

  // ── Submit Unified Triage Assessment ────────────────────────────────────
  const submitFeverAssessment = async (answers, categoryKey) => {
    const category = categoryKey || triageCategory || "fever";
    setIsTyping(true);
    try {
      // Build symptom vector from the collected answers (all keys from the step bank)
      const categorySteps = TRIAGE_STEPS_BY_CATEGORY[category] || TRIAGE_STEPS_BY_CATEGORY["fever"];
      const symptomMap = {};
      categorySteps.forEach((step) => {
        if (step.key !== "red_flags") {
          symptomMap[step.key] = answers[step.key] ? 1 : 0;
        }
      });

      const redFlagsPayload = answers.red_flags ? { bleeding: true, severe_abdominal_pain: true } : {};

      const payload = {
        symptoms: symptomMap,
        red_flags: redFlagsPayload,
        category,
        userLocation,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      };

      const response = await apiClient.post("/fever/assess", payload);
      const data = response.data;
      const recDocFromApi = data.recommendedDoctor || data.assessment?.recommendedDoctor || null;

      const assessment = data.assessment || (data.top_ranking ? {
        prediction: data.top_ranking[0]?.disease?.replace(/_/g, " ") || "Fever Assessment",
        confidence: Math.round((data.top_ranking[0]?.score || 0) * 100),
        riskLevel: data.red_flag_alert ? "Critical" : "Moderate",
        summary: data.red_flag_alert ? (data.red_flag_message || "High risk warning") : (data.primary_explanation?.join(". ") || data.recommended_action || "Fever differential analysis completed."),
        topMatches: (data.top_ranking || []).map((m) => ({
          disease: m.disease ? m.disease.replace(/_/g, " ") : (m.label || "Condition"),
          probability: Math.round((m.score || 0) * 100),
        })),
        recommendations: data.recommended_action ? [data.recommended_action] : ["Consult a physician for clinical evaluation."],
        suggestedSpecialist: "General Physician",
        disclaimer: data.disclaimer || "AI-generated assessment for informational purposes only.",
      } : null);

      if (data.success && assessment) {
        const a = assessment;
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

        // Homemade Remedies for low/medium urgency
        const remedyResult = getHomemadeRemedies(a.prediction, a.riskLevel);
        if (remedyResult.isEligible && remedyResult.remedies.length > 0) {
          md += `---\n### Supportive Home Remedies\n`;
          remedyResult.remedies.forEach((r) => {
            md += `${r.icon} **${r.title}**: ${r.desc}\n`;
          });
          md += `\n*${remedyResult.disclaimer}*\n\n`;
        } else if (!remedyResult.isEligible) {
          md += `\n> ⚠️ **${remedyResult.warning}**\n\n`;
        }

        // Fallback Doctor match if backend didn't supply one
        let matchedDoc = recDocFromApi;
        if (!matchedDoc) {
          try {
            const docRes = await consultationApi.getAvailableDoctors();
            const doctorsList = docRes.data?.doctors || docRes.data || [];
            matchedDoc = getRecommendedDoctor(doctorsList, a.suggestedSpecialist || "General Physician");
          } catch (e) {
            console.warn("Could not fetch recommended doctor for fever report:", e);
          }
        }

        if (matchedDoc) {
          const cleanDocName = formatDoctorName(matchedDoc.name);
          md += `---\n### Recommended Specialist\n`;
          md += `• **${cleanDocName}** (${matchedDoc.specialization || "General Physician"})\n`;
          if (matchedDoc.distanceInKm) md += `  - **Distance:** ${matchedDoc.distanceInKm} km away\n`;
          md += `  - **Experience:** ${matchedDoc.experience || 5} years\n`;
          md += `  - **Rating:** ⭐ ${matchedDoc.rating || matchedDoc.effectiveRating || 4.8}/5\n`;
          if (matchedDoc.hospitalName) md += `  - **Hospital:** ${matchedDoc.hospitalName}\n`;
          md += `\n*Connect with ${cleanDocName} below to proceed directly to the booking form.*`;
        }

        md += `\n\n*${a.disclaimer}*`;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: md,
            recommendedDoctor: matchedDoc,
            userPromptContext: `Fever Assessment: ${a.prediction}`,
            options: [
              { label: "⚡ Retake Assessment", value: "start" },
              { label: "Find a Doctor", value: "Help me find a doctor for fever" },
              { label: "View Available Doctors", value: "/available-doctors" },
            ],
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to get assessment");
      }
    } catch (err) {
      console.warn("Fever assessment API notice, using clinical differential synthesis:", err);
      const isRedFlag = Boolean(answers.red_flags);
      const s = answers;
      let suspect = "Viral Illness";
      let risk = "Moderate";
      let summary = "Fever symptoms with systemic and general clinical features.";

      if (isRedFlag) {
        suspect = "High Risk Febrile Alert";
        risk = "Critical";
        summary = "Emergency warning signs reported with acute fever. Immediate clinical care is required.";
      } else if (s.pain_behind_eyes || s.rash || (s.high_fever && s.joint_pain)) {
        suspect = "Dengue";
        risk = "Moderate";
        summary = "Reported fever, retro-orbital eye pain, joint discomfort or rash align with Dengue fever indicators.";
      } else if (s.chills || (s.high_fever && s.sudden_onset)) {
        suspect = "Malaria";
        risk = "Moderate";
        summary = "High temperature accompanied by shaking chills and rigors indicates possible malarial infection.";
      } else if ((typeof s.duration === "number" ? s.duration : 1) >= 3 || s.diarrhea_constipation) {
        suspect = "Typhoid";
        risk = "Moderate";
        summary = "Prolonged fever duration and gastrointestinal disturbance suggest enteric infection.";
      }

      let fallbackMd = `## Fever Assessment Report\n\n`;
      fallbackMd += `**Primary Suspect:** ${suspect} (Clinical Assessment)\n`;
      fallbackMd += `**Risk Level:** ${risk}\n\n`;
      fallbackMd += `### Clinical Summary\n${summary}\n\n`;
      fallbackMd += `### Recommended Next Steps\n• Monitor body temperature at regular 4-hour intervals\n• Keep well-hydrated with clean boiled water or ORS\n• Consult a physician for confirmatory tests (Complete Blood Count, Dengue NS1, or Peripheral Blood Smear)\n\n`;

      const fallbackRemedies = getHomemadeRemedies(suspect, risk);
      if (fallbackRemedies.isEligible && fallbackRemedies.remedies.length > 0) {
        fallbackMd += `---\n### Supportive Home Remedies\n`;
        fallbackRemedies.remedies.forEach((r) => {
          fallbackMd += `${r.icon} **${r.title}**: ${r.desc}\n`;
        });
        fallbackMd += `\n*${fallbackRemedies.disclaimer}*\n\n`;
      }

      let fallbackDoc = null;
      try {
        const docRes = await consultationApi.getAvailableDoctors();
        const docs = docRes.data?.doctors || docRes.data || [];
        fallbackDoc = getRecommendedDoctor(docs, "General Physician");
        if (fallbackDoc) {
          const cleanDocName = formatDoctorName(fallbackDoc.name);
          fallbackMd += `---\n### Recommended Specialist\n`;
          fallbackMd += `• **${cleanDocName}** (${fallbackDoc.specialization || "General Physician"})\n`;
          fallbackMd += `  - **Experience:** ${fallbackDoc.experience || 5} years\n`;
          fallbackMd += `  - **Rating:** ⭐ ${fallbackDoc.effectiveRating || 4.8}/5\n`;
          fallbackMd += `\n*Connect with ${cleanDocName} below to proceed directly to the booking form.*\n\n`;
        }
      } catch {}

      fallbackMd += `*Disclaimer: AI-generated differential assessment for informational guidance only. Not a formal medical diagnosis.*`;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: fallbackMd,
          recommendedDoctor: fallbackDoc,
          userPromptContext: `Fever Assessment: ${suspect}`,
          options: [
            { label: "⚡ Retake Assessment", value: "start" },
            { label: "Find a Doctor", value: "Help me find a doctor for fever" },
            { label: "View Available Doctors", value: "/available-doctors" },
          ],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setFeverActive(false);
      setFeverStep(0);
      setFeverAnswers({});
      setTriageCategory(null);
    }
  };

  // ── Handle Unified Triage Reply ────────────────────────────────────────────
  const handleFeverReply = async (userText) => {
    const trimmed = userText.trim().toLowerCase();

    // Step 0: category selection
    if (feverStep === 0) {
      const catKey = LETTER_TO_CATEGORY[trimmed] ||
        TRIAGE_CATEGORIES.find((c) => c.short.toLowerCase().includes(trimmed))?.key;

      if (!catKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: "Please choose a category by typing **A, B, C, D, or E** — or select one of the buttons below.",
            options: TRIAGE_CATEGORY_STEP.options,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      setTriageCategory(catKey);
      setFeverStep(1);
      const catLabel = TRIAGE_CATEGORIES.find((c) => c.key === catKey)?.label || catKey;
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: `Starting **${catLabel}** assessment. I'll ask you a series of Yes/No questions about your symptoms. Answer honestly for the most accurate result.`,
            timestamp: new Date(),
          },
        ]);
        askFeverQuestion(1, catKey);
      }, 350);
      return;
    }

    // Steps 1+: per-category Yes/No questions
    const categorySteps = TRIAGE_STEPS_BY_CATEGORY[triageCategory] || [];
    const step = categorySteps[feverStep - 1];
    if (!step) return;

    let answer = false;
    if (step.type === "yesno") {
      if (/^y(es)?$/i.test(userText.trim())) {
        answer = true;
      } else if (/^n(o)?$/i.test(userText.trim())) {
        answer = false;
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: "Please reply **Yes** or **No**, or type **\"cancel\"** to stop.",
            options: [
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
              { label: "Cancel Assessment", value: "cancel", isSecondary: true },
            ],
            timestamp: new Date(),
          },
        ]);
        return;
      }
    }

    const newAnswers = { ...feverAnswers, [step.key]: answer };
    setFeverAnswers(newAnswers);

    // Red-flag early exit
    if (step.redFlag && answer === true) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 50,
            type: "ai",
            text:
              "## ⚠️ URGENT MEDICAL WARNING\n\n" +
              "You reported one or more **serious emergency warning signs**.\n\n" +
              "**Please seek immediate medical attention or call emergency services immediately.**\n\n" +
              "Do not delay — early intervention is critical for many of these conditions.",
            options: [
              { label: "Find Emergency Doctor", value: "Help me find an emergency doctor" },
              { label: "Restart Assessment", value: "start", isSecondary: true },
            ],
            timestamp: new Date(),
          },
        ]);
        setFeverActive(false);
        setFeverStep(0);
        setFeverAnswers({});
        setTriageCategory(null);
        setIsTyping(false);
      }, 600);
      return;
    }

    const nextStep = feverStep + 1;
    if (nextStep > categorySteps.length) {
      // All category questions answered — submit
      await submitFeverAssessment(newAnswers, triageCategory);
    } else {
      setFeverStep(nextStep);
      askFeverQuestion(nextStep, triageCategory);
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
  const handleSendMessage = async (e, textOverride = null) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const currentInput = (typeof textOverride === "string" ? textOverride : inputValue).trim();
    if (!currentInput && attachments.length === 0) return;

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

    // E-Sanjeevani Unified Triage Flow
    if (selectedModel.id === "e-sanjeevani-triage") {
      const lower = currentInput.toLowerCase().trim();

      if (feverActive) {
        if (["cancel", "stop", "exit", "quit", "reset", "restart"].includes(lower)) {
          setFeverActive(false);
          setFeverStep(0);
          setFeverAnswers({});
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "ai",
              text: "Fever assessment has been cancelled. Your previous answers have been cleared.\n\nYou can type **\"start\"** whenever you'd like to begin again, or ask any other health question!",
              options: [{ label: "⚡ Start Fever Assessment", value: "start" }],
              timestamp: new Date(),
            },
          ]);
          return;
        }

        await handleFeverReply(currentInput);
        return;
      }

      // If NOT active: check greetings vs start vs general query
      const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|yo|namaste|help|who\s*are\s*you|what\s*(can\s*you\s*do|is\s*this|model)|how\s*(does\s*this\s*work|to\s*use)|info)[\s!.]*$/i.test(lower);
      const isStartCommand = /^(start|begin|assess|check|test|start\s*(triage|fever|assessment)|yes|ready|a|b|c|d|e)[\s!.]*$/i.test(lower);
      const hasSymptomClues = /fever|temperature|temp|cough|breath|chest|tightness|wheez|rash|itch|burn|urine|urinat|bladder|stomach|acid|heartburn|headache|body\s*ache|dengue|malaria|typhoid|asthma|pneumonia|uti/i.test(lower);

      if (isGreeting) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "ai",
              text:
                "Hello! I'm **E-Sanjeevani**, your AI Clinical Differential Triage assistant.\n\n" +
                "I assess symptoms across **5 clinical categories** using trained ML models:\n" +
                "• 🌡️ **Fever** — Dengue, Malaria, Typhoid, Chikungunya, Viral Fever\n" +
                "• 🫁 **Respiratory** — Asthma, Pneumonia, Bronchitis, Influenza, Cold\n" +
                "• 🫃 **Digestive** — GERD, IBS, Gastroenteritis, Peptic Ulcer, Gastritis\n" +
                "• 🧴 **Skin** — Acne, Eczema, Psoriasis, Fungal Infection, Urticaria\n" +
                "• 💧 **Urinary Tract** — UTI, Kidney Stones, Pyelonephritis, OAB, BPH\n\n" +
                "**Ready to assess your symptoms?**",
              options: [
                { label: "⚡ Start Triage Assessment", value: "start" },
                { label: "What are emergency warning signs?", value: "What are the emergency danger signs I should watch for?" },
                { label: "Find a Doctor", value: "Help me find a doctor" },
              ],
              timestamp: new Date(),
            },
          ]);
        }, 400);
        return;
      }

      if (isStartCommand || hasSymptomClues) {
        setFeverActive(true);
        setFeverStep(0);
        setFeverAnswers({});
        setTriageCategory(null);
        setIsTyping(true);

        const ackMsg = {
          id: Date.now() + 1,
          type: "ai",
          text:
            "Starting **E-Sanjeevani Clinical Triage** — a 5-category AI differential assessment.\n\n" +
            "This uses trained ML models across Fever, Respiratory, Digestive, Skin, and Urinary Tract conditions.\n\n" +
            "*Not a medical diagnosis — always verify with a licensed clinician.* Let's begin:",
          timestamp: new Date(),
        };

        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, ackMsg]);
          askFeverQuestion(0, null); // Step 0 = category selection
        }, 500);
        return;
      }

      // General query using fever model context
      setIsTyping(true);
      try {
        const response = await apiClient.post("/chat", {
          prompt: currentInput,
          triageSessionId: activeTriageSessionId,
          model: "fever-assessment",
          userLocation: userLocation || null,
          latitude: userLocation?.latitude || null,
          longitude: userLocation?.longitude || null,
        });

        const data = response.data;
        const returnedSessionId =
          data?.data?.triageSessionId || data?.triageSessionId;
        if (returnedSessionId) setActiveTriageSessionId(returnedSessionId);
        setHistoryRefreshTrigger((prev) => prev + 1);

        let aiMessageText = data?.data?.reply
          ?.replace(/<\/?[Aa]nswer>\s*/g, "")
          ?.replace(/^[\s]*[Aa]nswer[\s]*:[\s]*/gm, "")
          ?.replace(/<[^>]*>/g, "")
          ?.replace(/\n{3,}/g, "\n\n")
          ?.trim();

        if (!aiMessageText) {
          aiMessageText = "I'm here to assist with your fever symptoms and differential assessment.";
        }

        const recommendedDoctor =
          data?.data?.recommendedDoctor ||
          data?.recommendedDoctor ||
          null;

        aiMessageText += "\n\n---\n*Ready to check your symptoms? Click below to start the differential fever questionnaire.*";

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text: aiMessageText,
            recommendedDoctor,
            userPromptContext: currentInput,
            options: [{ label: "⚡ Start Fever Assessment", value: "start" }],
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Fever chat query error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            text:
              "I'm your **Fever Assessment Assistant**.\n\n" +
              "Whenever you'd like to evaluate your fever symptoms for conditions like Dengue, Malaria, or Typhoid, click **Start Assessment** below.",
            options: [{ label: "⚡ Start Fever Assessment", value: "start" }],
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
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
        userLocation: userLocation || null,
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
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

      const recommendedDoctor =
        data?.data?.recommendedDoctor ||
        data?.recommendedDoctor ||
        null;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: aiMessageText || "No response generated",
          recommendedDoctor,
          userPromptContext: currentInput,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const now = new Date();
  const upcomingConsultations = consultations
    .filter((c) => c.status === "scheduled" || new Date(c.consultationDate) > now)
    .sort((a, b) => new Date(a.consultationDate) - new Date(b.consultationDate));
  const nextAppt = upcomingConsultations[0] || null;

  const recentConsultations = consultations.slice(0, 3);
  const recentRecords = records.slice(0, 3);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

      {/* Main Chat & Dashboard Area */}
      <main className={styles.mainContent}>
        {!hasStartedChat ? (
          /* ── Idle / Landing Hero State ── */
          <div className={styles.idleState}>
            {/* Header Greeting & Date */}
            <div className={styles.heroSection}>
              <div className={styles.dateBadge}>
                <Calendar size={13} /> {formattedDate}
              </div>
              <h1 className={styles.greeting}>
                {getGreeting()}, {firstName}
              </h1>
              <p className={styles.subtitle}>
                Your trusted healthcare dashboard. Book consultations, check symptoms, or review records.
              </p>
            </div>

            {/* ── Upcoming Appointment Feature Card ── */}
            {nextAppt ? (
              <div className={styles.upcomingApptCard}>
                <div className={styles.upcomingApptHeader}>
                  <div className={styles.upcomingTag}>
                    <span className={styles.pulseDot} /> Next Scheduled Consultation
                  </div>
                  <span className={styles.statusPillBadge}>
                    {nextAppt.status?.toUpperCase() || "SCHEDULED"}
                  </span>
                </div>
                <div className={styles.upcomingApptBody}>
                  <div className={styles.doctorAvatar}>
                    {nextAppt.doctor?.name?.charAt(0) || "D"}
                  </div>
                  <div className={styles.doctorDetails}>
                    <h3 className={styles.doctorNameText}>
                      {formatDoctorName(nextAppt.doctor?.name)}
                    </h3>
                    <p className={styles.doctorSpecText}>
                      {nextAppt.doctor?.specialization || "General Medicine"}
                    </p>
                    <div className={styles.apptTimeMeta}>
                      <span>
                        <Calendar size={13} />{" "}
                        {new Date(nextAppt.consultationDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        <Clock size={13} /> {nextAppt.startTime} - {nextAppt.endTime}
                      </span>
                      <span className={styles.typeBadge}>
                        {nextAppt.consultationType?.toUpperCase() || "VIDEO"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.upcomingActions}>
                    <button
                      className={styles.joinConsultationBtn}
                      onClick={() => navigate(`/video-call/${nextAppt._id}`)}
                    >
                      <Video size={14} /> Join Consultation
                    </button>
                    <button
                      className={styles.viewDetailsBtn}
                      onClick={() => navigate("/consultations")}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyApptBanner}>
                <div className={styles.emptyApptLeft}>
                  <div className={styles.emptyApptIcon}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className={styles.emptyApptTitle}>No upcoming consultations</h4>
                    <p className={styles.emptyApptSub}>
                      Connect with qualified specialists online from anywhere.
                    </p>
                  </div>
                </div>
                <button
                  className={styles.bookNowBannerBtn}
                  onClick={() => navigate("/available-doctors")}
                >
                  <Plus size={14} /> Book Consultation
                </button>
              </div>
            )}

            {/* ── Quick Action Cards ── */}
            <div className={styles.quickActionsGrid}>
              <div
                className={styles.quickActionCard}
                onClick={() => navigate("/available-doctors")}
              >
                <div className={`${styles.quickActionIcon} ${styles.actionBlue}`}>
                  <Stethoscope size={18} />
                </div>
                <div className={styles.quickActionText}>
                  <h4>Find Specialist</h4>
                  <p>Search doctors near you</p>
                </div>
                <ArrowRight size={14} className={styles.quickActionArrow} />
              </div>

              <div
                className={styles.quickActionCard}
                onClick={() => navigate("/consultations")}
              >
                <div className={`${styles.quickActionIcon} ${styles.actionGreen}`}>
                  <Calendar size={18} />
                </div>
                <div className={styles.quickActionText}>
                  <h4>My Consultations</h4>
                  <p>{consultations.length} total sessions</p>
                </div>
                <ArrowRight size={14} className={styles.quickActionArrow} />
              </div>

              <div
                className={styles.quickActionCard}
                onClick={() => navigate("/clinical-records")}
              >
                <div className={`${styles.quickActionIcon} ${styles.actionPurple}`}>
                  <FileText size={18} />
                </div>
                <div className={styles.quickActionText}>
                  <h4>Clinical Records</h4>
                  <p>{records.length} digital records</p>
                </div>
                <ArrowRight size={14} className={styles.quickActionArrow} />
              </div>

              <div
                className={styles.quickActionCard}
                onClick={() => {
                  setInputValue("I want to describe my symptoms for a medical assessment: ");
                  if (textareaRef.current) textareaRef.current.focus();
                }}
              >
                <div className={`${styles.quickActionIcon} ${styles.actionTeal}`}>
                  <Bot size={18} />
                </div>
                <div className={styles.quickActionText}>
                  <h4>AI Symptom Check</h4>
                  <p>Smart health guidance</p>
                </div>
                <ArrowRight size={14} className={styles.quickActionArrow} />
              </div>
            </div>

            {/* ── AI Symptom & Query Input Card ── */}
            <div className={styles.searchContainer}>
              <div className={styles.searchHeaderWrapper}>
                <div className={styles.searchHeaderLabel}>
                  <Sparkles size={14} /> AI Health Assistant & Symptom Checker
                </div>
                <button
                  type="button"
                  className={styles.openFullAssessmentBtn}
                  onClick={() => {
                    setInputValue("I want to describe my symptoms for a full clinical assessment: ");
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  title="Start AI Symptom Assessment"
                >
                  <ClipboardList size={13} /> Start Assessment
                </button>
              </div>
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
                  placeholder="Describe your symptoms, ask health questions, or type / for commands..."
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

            {/* Quick Suggestion Pills */}
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
                {
                  icon: <Sparkles size={14} />,
                  label: "AI Symptom Check",
                  prompt: "I want to describe my symptoms for a detailed medical assessment: ",
                },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  className={styles.suggestionPill}
                  onClick={() => {
                    if (pill.action) {
                      pill.action();
                      return;
                    }
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

            {/* ── Recent Activity Section ── */}
            <div className={styles.recentActivitySection}>
              {/* Recent Consultations */}
              <div className={styles.activityCardBlock}>
                <div className={styles.activityBlockHeader}>
                  <div className={styles.activityBlockTitle}>
                    <Calendar size={16} /> Recent Consultations
                  </div>
                  <button
                    className={styles.viewAllLinkBtn}
                    onClick={() => navigate("/consultations")}
                  >
                    View all ({consultations.length})
                  </button>
                </div>
                <div className={styles.activityList}>
                  {recentConsultations.length === 0 ? (
                    <div className={styles.emptyListNote}>
                      No past consultations recorded yet.
                    </div>
                  ) : (
                    recentConsultations.map((c) => (
                      <div key={c._id} className={styles.activityItemRow}>
                        <div className={styles.activityItemAvatar}>
                          {c.doctor?.name?.charAt(0) || "D"}
                        </div>
                        <div className={styles.activityItemInfo}>
                          <div className={styles.activityItemName}>
                            {formatDoctorName(c.doctor?.name)}
                          </div>
                          <div className={styles.activityItemSub}>
                            {c.symptoms || c.currentProblem || "Online Consultation"}
                          </div>
                        </div>
                        <span className={styles.activityStatusTag}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Medical Records */}
              <div className={styles.activityCardBlock}>
                <div className={styles.activityBlockHeader}>
                  <div className={styles.activityBlockTitle}>
                    <FileText size={16} /> Clinical Records & Rx
                  </div>
                  <button
                    className={styles.viewAllLinkBtn}
                    onClick={() => navigate("/clinical-records")}
                  >
                    View all ({records.length})
                  </button>
                </div>
                <div className={styles.activityList}>
                  {recentRecords.length === 0 ? (
                    <div className={styles.emptyListNote}>
                      No clinical records or prescriptions uploaded yet.
                    </div>
                  ) : (
                    recentRecords.map((r) => (
                      <div key={r.id} className={styles.activityItemRow}>
                        <div className={`${styles.activityItemAvatar} ${styles.recordAvatarBg}`}>
                          <ShieldCheck size={14} />
                        </div>
                        <div className={styles.activityItemInfo}>
                          <div className={styles.activityItemName}>
                            {r.recordTitle || r.diagnosis || "Medical Record"}
                          </div>
                          <div className={styles.activityItemSub}>
                            {r.doctorName ? formatDoctorName(r.doctorName) : "Patient Record"} •{" "}
                            {r.recordDate ? new Date(r.recordDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                        <>
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

                        {/* Interactive Recommended Doctor Card */}
                        {message.recommendedDoctor && (
                          <div className={styles.recommendedDoctorCard}>
                            <div className={styles.recCardHeader}>
                              <span className={styles.recDoctorBadge}>
                                <Stethoscope size={13} /> Recommended Specialist
                              </span>
                              {message.recommendedDoctor.distanceInKm != null && (
                                <span className={styles.recDistancePill}>
                                  <MapPin size={11} /> {message.recommendedDoctor.distanceInKm} km away
                                </span>
                              )}
                            </div>

                            <div className={styles.recCardBody}>
                              <div className={styles.recAvatar}>
                                {getDoctorInitials(message.recommendedDoctor.name || "Dr")}
                              </div>

                              <div className={styles.recInfo}>
                                <div className={styles.recNameLine}>
                                  <h4 className={styles.recDoctorName}>
                                    {formatDoctorName(message.recommendedDoctor.name)}
                                  </h4>
                                  <span className={styles.recVerifiedBadge}>
                                    <ShieldCheck size={11} /> Verified
                                  </span>
                                </div>

                                <div className={styles.recSpecialtyLine}>
                                  <span className={styles.recSpecText}>
                                    {message.recommendedDoctor.specialization || "General Physician"}
                                  </span>
                                  {message.recommendedDoctor.recommendationReason && (
                                    <span className={styles.recReasonText}>
                                      • {message.recommendedDoctor.recommendationReason}
                                    </span>
                                  )}
                                </div>

                                <div className={styles.recMetaLine}>
                                  {message.recommendedDoctor.experience != null && (
                                    <span>
                                      <Award size={12} /> {message.recommendedDoctor.experience} yrs exp
                                    </span>
                                  )}
                                  {(message.recommendedDoctor.rating || message.recommendedDoctor.effectiveRating) != null && (
                                    <span>
                                      <Star size={12} fill="#eab308" color="#eab308" />{" "}
                                      {message.recommendedDoctor.rating || message.recommendedDoctor.effectiveRating}/5
                                    </span>
                                  )}
                                  {message.recommendedDoctor.hospitalName && (
                                    <span>
                                      <Building2 size={12} /> {message.recommendedDoctor.hospitalName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className={styles.recActionArea}>
                                <div className={styles.recFeeBlock}>
                                  <span className={styles.recFeeLabel}>Consultation</span>
                                  <span className={styles.recFeeVal}>
                                    ₹{message.recommendedDoctor.consultationFee ?? message.recommendedDoctor.fees ?? 500}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className={styles.recDirectBookBtn}
                                  onClick={() => {
                                    const symptoms =
                                      message.userPromptContext ||
                                      message.recommendedDoctor.recommendationReason ||
                                      "Consultation for reported symptoms";
                                    navigate("/consultation-booking", {
                                      state: {
                                        doctor: message.recommendedDoctor,
                                        symptoms,
                                        currentProblem: symptoms,
                                        consultationMode: "video",
                                      },
                                    });
                                  }}
                                >
                                  <Video size={13} />
                                  <span>Connect & Book Appointment</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Option Pills */}
                        {message.options && message.options.length > 0 && (
                          <div className={styles.messageOptionsRow}>
                            {message.options.map((opt, optIdx) => {
                              const label = typeof opt === "string" ? opt : opt.label;
                              const val = typeof opt === "string" ? opt : opt.value;
                              const isSec = typeof opt === "object" && opt.isSecondary;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  className={`${styles.optionPillBtn} ${
                                    isSec ? styles.optionPillBtnSecondary : ""
                                  }`}
                                  onClick={() => {
                                    if (typeof val === "string" && val.startsWith("/")) {
                                      navigate(val);
                                    } else {
                                      handleSendMessage(null, val);
                                    }
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
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
