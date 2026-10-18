import React, { useState } from "react";
import styles from "./AiTriage.module.css";
import { apiClient } from "../../utils/api";
import { AiTriageSkeleton } from "../Skeletons";
import toast from "react-hot-toast";
import ShapContributionChart from "./ShapContributionChart";
import RedFlagEmergencyModal from "./RedFlagEmergencyModal";
import {
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  ListFilter,
  Check,
  Wind,
  Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DEFINITIONS — mirroring the 5 trained ML models
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "fever",
    label: "Category A: Fever",
    subtitle: "Dengue · Malaria · Typhoid · Chikungunya · Viral Fever",
    icon: <Thermometer size={18} />,
    color: "#e84393",
    specialist: "General Physician / Infectious Disease Specialist",
    symptomGroups: [
      {
        group: "General & Systemic",
        symptoms: [
          { key: "fever", label: "Fever" },
          { key: "high_fever", label: "High Fever (≥39°C / 102°F)" },
          { key: "sudden_onset", label: "Sudden / Abrupt Onset of Fever" },
          { key: "fatigue", label: "Fatigue / Exhaustion" },
          { key: "weakness", label: "General Weakness" },
          { key: "loss_of_appetite", label: "Loss of Appetite" },
          { key: "chills", label: "Chills / Shivering Episodes" },
          { key: "sweating", label: "Profuse Sweating" },
        ],
      },
      {
        group: "Pain & Musculoskeletal",
        symptoms: [
          { key: "headache", label: "Headache" },
          { key: "severe_headache", label: "Severe Throbbing Headache" },
          { key: "pain_behind_eyes", label: "Pain Behind Eyes (Retro-orbital)" },
          { key: "body_pain", label: "Generalized Body Aches" },
          { key: "muscle_pain", label: "Muscle Pain (Myalgia)" },
          { key: "joint_pain", label: "Joint Pain (Arthralgia)" },
          { key: "severe_joint_pain", label: "Severe / Debilitating Joint Pain" },
        ],
      },
      {
        group: "Respiratory & ENT",
        symptoms: [
          { key: "cough", label: "Cough" },
          { key: "sore_throat", label: "Sore Throat" },
          { key: "runny_nose", label: "Runny Nose / Congestion" },
          { key: "swollen_lymph_nodes", label: "Swollen Lymph Nodes / Glands" },
        ],
      },
      {
        group: "Gastrointestinal & Skin",
        symptoms: [
          { key: "rash", label: "Skin Rash / Petechiae" },
          { key: "nausea", label: "Nausea" },
          { key: "vomiting", label: "Vomiting" },
          { key: "abdominal_pain", label: "Abdominal Pain" },
          { key: "diarrhea", label: "Diarrhea" },
          { key: "constipation", label: "Constipation" },
        ],
      },
    ],
  },
  {
    key: "respiratory",
    label: "Category B: Respiratory",
    subtitle: "Common Cold · Asthma · Pneumonia · Bronchitis · Influenza",
    icon: <Wind size={18} />,
    color: "#3b82f6",
    specialist: "Pulmonologist / Chest Physician",
    symptomGroups: [
      {
        group: "Airway Symptoms",
        symptoms: [
          { key: "cough", label: "Cough (Dry or Wet)" },
          { key: "productive_cough", label: "Productive Cough (Mucus / Phlegm)" },
          { key: "shortness_of_breath", label: "Shortness of Breath / Dyspnoea" },
          { key: "wheezing", label: "Wheezing (Whistling Sound on Breathing)" },
          { key: "chest_tightness", label: "Chest Tightness" },
          { key: "pleuritic_chest_pain", label: "Chest Pain Worsening on Breathing" },
          { key: "rapid_shallow_breathing", label: "Rapid / Shallow Breathing" },
        ],
      },
      {
        group: "Systemic & ENT",
        symptoms: [
          { key: "fever", label: "Fever" },
          { key: "high_fever", label: "High Fever" },
          { key: "chills", label: "Chills" },
          { key: "sore_throat", label: "Sore Throat" },
          { key: "runny_nose", label: "Runny Nose / Nasal Discharge" },
          { key: "nasal_congestion", label: "Nasal Congestion / Blockage" },
          { key: "sneezing", label: "Sneezing" },
        ],
      },
      {
        group: "General",
        symptoms: [
          { key: "fatigue", label: "Fatigue / Tiredness" },
          { key: "headache", label: "Headache" },
          { key: "muscle_aches", label: "Muscle Aches / Body Pain" },
          { key: "loss_of_appetite", label: "Loss of Appetite" },
          { key: "night_sweats", label: "Night Sweats" },
          { key: "symptom_triggers_allergens_exercise", label: "Symptoms Triggered by Allergens / Exercise" },
        ],
      },
    ],
  },
  {
    key: "digestive",
    label: "Category C: Digestive",
    subtitle: "Gastroenteritis · GERD · Gastritis · Peptic Ulcer · IBS",
    icon: <Activity size={18} />,
    color: "#10b981",
    specialist: "Gastroenterologist",
    symptomGroups: [
      {
        group: "Acid & Reflux Symptoms",
        symptoms: [
          { key: "heartburn_retrosternal_burning", label: "Heartburn / Burning Behind Breastbone" },
          { key: "acid_regurgitation", label: "Acid Regurgitation (Sour Taste)" },
          { key: "epigastric_burning_pain", label: "Burning Upper Abdominal Pain" },
          { key: "pain_relieved_by_food_or_antacids", label: "Pain Relieved by Food or Antacids" },
          { key: "pain_worse_on_empty_stomach_or_night", label: "Pain Worse on Empty Stomach or at Night" },
          { key: "worse_lying_down_after_eating", label: "Symptoms Worse When Lying Down After Eating" },
        ],
      },
      {
        group: "Nausea, Vomiting & Diarrhea",
        symptoms: [
          { key: "nausea", label: "Nausea" },
          { key: "vomiting", label: "Vomiting" },
          { key: "watery_diarrhea", label: "Watery Diarrhea" },
          { key: "cramping_abdominal_pain", label: "Cramping Abdominal Pain" },
          { key: "dehydration_thirst", label: "Dehydration / Excessive Thirst" },
          { key: "fever", label: "Fever (with GI symptoms)" },
        ],
      },
      {
        group: "Bloating & Bowel Changes",
        symptoms: [
          { key: "bloating_abdominal_distension", label: "Bloating / Abdominal Distension" },
          { key: "alternating_bowel_habits", label: "Alternating Constipation & Diarrhea" },
          { key: "pain_eased_after_bowel_movement", label: "Pain Eased After Bowel Movement" },
          { key: "mucus_in_stool", label: "Mucus in Stool" },
          { key: "belching_and_gas", label: "Excessive Belching & Gas (Flatulence)" },
          { key: "early_satiety", label: "Early Satiety (Fullness after Small Meals)" },
          { key: "loss_of_appetite", label: "Loss of Appetite" },
          { key: "food_triggers_spicy_fatty_stress", label: "Symptoms Triggered by Spicy / Fatty Food or Stress" },
        ],
      },
    ],
  },
  {
    key: "skin",
    label: "Category D: Skin",
    subtitle: "Acne · Eczema · Psoriasis · Fungal Infection · Urticaria",
    icon: <Sparkles size={18} />,
    color: "#f59e0b",
    specialist: "Dermatologist",
    symptomGroups: [
      {
        group: "Acne-Type Features",
        symptoms: [
          { key: "comedones_blackheads_whiteheads", label: "Comedones / Blackheads / Whiteheads" },
          { key: "inflammatory_papules_pustules", label: "Inflammatory Papules or Pustules" },
          { key: "deep_painful_nodules_cysts", label: "Deep Painful Nodules or Cysts" },
          { key: "oily_skin_seborrhea", label: "Oily Skin / Seborrhoea" },
          { key: "facial_chest_back_distribution", label: "Distribution on Face, Chest or Back" },
        ],
      },
      {
        group: "Eczema & Inflammatory Skin",
        symptoms: [
          { key: "intense_itching_pruritus", label: "Intense Itching / Pruritus" },
          { key: "dry_cracked_flaking_skin", label: "Dry, Cracked or Flaking Skin" },
          { key: "flexural_distribution_inner_elbows_knees", label: "Rash in Skin Folds (Elbows, Knees, Neck)" },
          { key: "oozing_weeping_crusted_patches", label: "Oozing, Weeping or Crusted Skin Patches" },
        ],
      },
      {
        group: "Psoriasis Features",
        symptoms: [
          { key: "silvery_white_micaceous_scales", label: "Silvery-White / Micaceous Scales on Skin" },
          { key: "well_demarcated_thick_red_plaques", label: "Well-Demarcated Thick Red Plaques" },
          { key: "extensor_distribution_knees_elbows_scalp", label: "Distribution on Knees, Elbows or Scalp" },
          { key: "nail_changes_pitting_ridging", label: "Nail Changes (Pitting or Ridging)" },
        ],
      },
      {
        group: "Fungal & Urticaria",
        symptoms: [
          { key: "ring_shaped_annular_patches", label: "Ring-Shaped / Annular Skin Patches" },
          { key: "macerated_scaly_skin_folds", label: "Macerated / Scaly Skin in Folds" },
          { key: "raised_transient_wheals_welts", label: "Raised Transient Wheals / Welts (Hives)" },
          { key: "welts_resolve_within_24_hours", label: "Welts Resolve Within 24 Hours" },
          { key: "burning_or_stinging_sensation", label: "Burning or Stinging Sensation" },
          { key: "allergic_or_contact_trigger", label: "Allergic or Contact Trigger Suspected" },
          { key: "aggravated_by_sweat_heat_friction", label: "Aggravated by Sweat, Heat or Friction" },
        ],
      },
    ],
  },
  {
    key: "urinary_tract",
    label: "Category E: Urinary Tract",
    subtitle: "UTI · Kidney Stones · Pyelonephritis · OAB · BPH",
    icon: <ShieldAlert size={18} />,
    color: "#8b5cf6",
    specialist: "Urologist / Nephrologist",
    symptomGroups: [
      {
        group: "Urination Symptoms",
        symptoms: [
          { key: "dysuria_burning_urination", label: "Burning / Painful Urination (Dysuria)" },
          { key: "urinary_frequency", label: "Increased Urinary Frequency" },
          { key: "urinary_urgency", label: "Sudden Urinary Urgency (Cannot Delay)" },
          { key: "urgency_incontinence", label: "Urgency Incontinence (Leakage on Urgency)" },
          { key: "nocturia_multiple_night_trips", label: "Nocturia (Multiple Night-time Toilet Trips)" },
          { key: "suprapubic_pelvic_pressure", label: "Suprapubic / Pelvic Pressure or Pain" },
        ],
      },
      {
        group: "Voiding Dysfunction (BPH / Obstruction)",
        symptoms: [
          { key: "weak_urinary_stream", label: "Weak or Reduced Urine Stream" },
          { key: "hesitancy_delayed_start", label: "Hesitancy / Delayed Start of Urination" },
          { key: "intermittent_stream_stop_start", label: "Intermittent / Stop-Start Urinary Stream" },
          { key: "straining_to_void", label: "Straining to Pass Urine" },
          { key: "feeling_incomplete_emptying", label: "Sensation of Incomplete Bladder Emptying" },
        ],
      },
      {
        group: "Stone & Infection Signs",
        symptoms: [
          { key: "renal_colic_severe_flank_pain", label: "Severe Flank / Loin Pain (Renal Colic)" },
          { key: "pain_radiating_to_groin", label: "Pain Radiating to Groin / Inner Thigh" },
          { key: "costovertebral_angle_tenderness", label: "Tenderness at Costovertebral Angle (Back)" },
          { key: "pain_fluctuates_in_spasms_waves", label: "Pain Fluctuates in Waves / Spasms" },
          { key: "high_fever_and_rigors", label: "High Fever with Shaking Chills (Rigors)" },
          { key: "hematuria_visible_blood_in_urine", label: "Blood in Urine / Pink or Red Urine" },
          { key: "cloudy_foul_smelling_urine", label: "Cloudy or Foul-Smelling Urine" },
          { key: "nausea_and_vomiting", label: "Nausea and Vomiting" },
          { key: "fatigue_and_malaise", label: "Fatigue and General Malaise" },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RED FLAG DEFINITIONS — covers all 5 categories
// ─────────────────────────────────────────────────────────────────────────────
const RED_FLAG_DEFINITIONS = [
  // Fever / General
  { key: "severe_abdominal_pain", label: "Severe / Unbearable Abdominal Pain" },
  { key: "persistent_vomiting", label: "Persistent Vomiting (Cannot Keep Fluids Down)" },
  { key: "bleeding", label: "Bleeding (Gums, Nose, Vomit, or Red Spots on Skin)" },
  { key: "blood_in_vomit", label: "Blood in Vomit (Coffee-Ground Appearance)" },
  { key: "blood_in_stool", label: "Blood in Stool or Black Tarry Stool" },
  { key: "fainting", label: "Fainting or Syncope" },
  { key: "cold_clammy_skin", label: "Cold, Clammy Extremities / Signs of Shock" },
  { key: "severe_weakness", label: "Severe Weakness / Inability to Stand" },
  // Respiratory
  { key: "breathing_difficulty", label: "Severe Difficulty Breathing / Gasping for Air" },
  { key: "rapid_breathing", label: "Rapid or Shallow Breathing" },
  { key: "cyanosis_blue_lips", label: "Bluish Discoloration of Lips or Nails" },
  { key: "coughing_blood", label: "Coughing up Blood or Bloody Phlegm" },
  { key: "chest_pain_severe", label: "Crushing or Severe Constant Chest Pain" },
  // Digestive
  { key: "unbearable_rigid_abdomen", label: "Rigid, Board-like, or Unbearable Abdomen" },
  { key: "unable_to_swallow_fluids", label: "Complete Inability to Swallow Liquids" },
  // Skin
  { key: "airway_or_facial_swelling", label: "Swelling of Face, Lips, Tongue or Throat (Anaphylaxis)" },
  { key: "skin_sloughing_blisters", label: "Widespread Peeling, Blistering, or Skin Detachment" },
  { key: "spreading_purple_rash", label: "Rapidly Spreading Purple/Dark Spots with Fever (Purpura)" },
  // Urinary
  { key: "acute_urinary_retention", label: "Complete Inability to Pass Urine with Painful Distension" },
  { key: "heavy_blood_clots_in_urine", label: "Passage of Frank Blood Clots in Urine" },
  { key: "urosepsis_rigors", label: "High Shaking Chills with Flank Pain and Confusion" },
  // Neurological / General
  { key: "confusion", label: "Acute Confusion, Delirium, or Extreme Lethargy" },
  { key: "loss_of_consciousness", label: "Loss of Consciousness or Unresponsiveness" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO PRESETS
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_PRESETS = [
  {
    name: "Dengue Profile",
    category: "fever",
    symptoms: ["fever", "high_fever", "sudden_onset", "severe_headache", "pain_behind_eyes", "joint_pain", "rash", "nausea"],
    redFlags: [],
  },
  {
    name: "Malaria Profile",
    category: "fever",
    symptoms: ["fever", "high_fever", "chills", "sweating", "headache", "body_pain", "fatigue", "vomiting"],
    redFlags: [],
  },
  {
    name: "Asthma Profile",
    category: "respiratory",
    symptoms: ["wheezing", "chest_tightness", "shortness_of_breath", "symptom_triggers_allergens_exercise", "cough"],
    redFlags: [],
  },
  {
    name: "GERD Profile",
    category: "digestive",
    symptoms: ["heartburn_retrosternal_burning", "acid_regurgitation", "worse_lying_down_after_eating", "belching_and_gas"],
    redFlags: [],
  },
  {
    name: "Psoriasis Profile",
    category: "skin",
    symptoms: ["silvery_white_micaceous_scales", "well_demarcated_thick_red_plaques", "extensor_distribution_knees_elbows_scalp", "intense_itching_pruritus"],
    redFlags: [],
  },
  {
    name: "UTI Profile",
    category: "urinary_tract",
    symptoms: ["dysuria_burning_urination", "urinary_frequency", "urinary_urgency", "cloudy_foul_smelling_urine", "suprapubic_pelvic_pressure"],
    redFlags: [],
  },
  {
    name: "⚠️ Emergency Case",
    category: "fever",
    symptoms: ["fever", "high_fever", "pain_behind_eyes", "severe_joint_pain"],
    redFlags: ["bleeding", "severe_abdominal_pain", "persistent_vomiting"],
  },
];

const getUrgencyColor = (score) => {
  if (score >= 8) return "#d32f2f";
  if (score >= 6) return "#f57c00";
  if (score >= 4) return "#fbc02d";
  return "#388e3c";
};

const severityColor = (severity) =>
  severity === "severe" ? "#d32f2f" : severity === "moderate" ? "#f57c00" : "#388e3c";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const AiTriage = () => {
  const [activeTab, setActiveTab] = useState("unified"); // "unified" | "general"

  // Unified Triage State
  const [selectedCategory, setSelectedCategory] = useState("fever");
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [selectedRedFlags, setSelectedRedFlags] = useState({});
  const [showRedFlagsAccordion, setShowRedFlagsAccordion] = useState(false);
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // General Triage State
  const [step, setStep] = useState("symptoms"); // symptoms | review | response
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState({
    symptom: "",
    duration: "",
    severity: "mild",
    description: "",
  });
  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [triageResponse, setTriageResponse] = useState(null);
  const [triageSessionId, setTriageSessionId] = useState(null);

  const currentCategory = CATEGORIES.find((c) => c.key === selectedCategory);

  // ---------- Unified handlers ----------
  const toggleSymptom = (key) => {
    setSelectedSymptoms((prev) => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
  };

  const toggleRedFlag = (key) => {
    setSelectedRedFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset) => {
    setSelectedCategory(preset.category);
    const newSyms = {};
    preset.symptoms.forEach((s) => {
      newSyms[s] = 1;
    });
    setSelectedSymptoms(newSyms);
    const newRfs = {};
    preset.redFlags.forEach((rf) => {
      newRfs[rf] = true;
    });
    setSelectedRedFlags(newRfs);
    if (preset.redFlags.length > 0) setShowRedFlagsAccordion(true);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const clearForm = () => {
    setSelectedSymptoms({});
    setSelectedRedFlags({});
    setTriageResult(null);
    setIsEmergencyModalOpen(false);
  };

  const handleCategorySwitch = (catKey) => {
    setSelectedCategory(catKey);
    setSelectedSymptoms({});
    setTriageResult(null);
  };

  const handleRunAssessment = async () => {
    const activeCount = Object.values(selectedSymptoms).filter((v) => v === 1).length;
    const activeRedFlags = Object.entries(selectedRedFlags)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (activeCount === 0 && activeRedFlags.length === 0) {
      toast.error("Please select at least one symptom or warning sign.");
      return;
    }

    setIsTriageLoading(true);
    try {
      const symptomVector = {};
      currentCategory.symptomGroups.forEach((group) => {
        group.symptoms.forEach((s) => {
          symptomVector[s.key] = selectedSymptoms[s.key] === 1 ? 1 : 0;
        });
      });

      const redFlagsObject = {};
      RED_FLAG_DEFINITIONS.forEach((rf) => {
        redFlagsObject[rf.key] = !!selectedRedFlags[rf.key];
      });

      const response = await apiClient.post("/fever/assess", {
        symptoms: symptomVector,
        red_flags: redFlagsObject,
        category: selectedCategory,
      });

      const data = response.data;
      setTriageResult(data);

      if (data.red_flag_alert) {
        setIsEmergencyModalOpen(true);
        toast.error("Critical emergency red-flags detected! Please seek immediate care.", { duration: 6000 });
      } else {
        toast.success("E-Sanjeevani Triage assessment complete!");
      }
    } catch (error) {
      console.error("Triage assessment error:", error);
      const errMsg = error.response?.data?.message || "Failed to run assessment. Ensure AI server is online.";
      toast.error(errMsg);
    } finally {
      setIsTriageLoading(false);
    }
  };

  // ---------- General triage handlers ----------
  const addSymptom = () => {
    if (newSymptom.symptom.trim()) {
      setSymptoms([...symptoms, newSymptom]);
      setNewSymptom({ symptom: "", duration: "", severity: "mild", description: "" });
    }
  };

  const removeSymptom = (index) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleCreateSession = async () => {
    if (symptoms.length === 0) {
      toast.error("Please add at least one symptom before proceeding.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post("/triage/create", {
        symptoms,
        medicalHistory,
        currentMedications,
        allergies,
        additionalNotes,
      });
      setTriageSessionId(response.data.triageSessionId);
      setStep("review");
      toast.success("Symptoms recorded. Review and confirm to process.");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error("Error creating triage session: " + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessTriage = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/triage/process/${triageSessionId}`);
      setTriageResponse(response.data);
      setStep("response");
      toast.success("AI Triage assessment complete!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error processing triage assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSymptomsCount = Object.values(selectedSymptoms).filter((v) => v === 1).length;
  const selectedRedFlagsCount = Object.values(selectedRedFlags).filter(Boolean).length;

  // Resolve display values from unified response structure
  const primaryAssessment = triageResult?.assessments?.[0] || null;
  const displayTopRanking = primaryAssessment?.candidate_ranking || triageResult?.top_ranking || [];
  const displayPrimaryCondition =
    primaryAssessment?.top_condition || triageResult?.primary_condition || "Assessment Result";
  const displayConfidence = primaryAssessment?.confidence_pct ?? triageResult?.overall_confidence ?? 0;
  const displaySpecialist =
    primaryAssessment?.recommended_specialist || triageResult?.recommended_specialist || "General Physician";
  const displayExplanation = primaryAssessment?.primary_explanation || triageResult?.primary_explanation || [];
  const displayShap =
    triageResult?.shap_contributions ||
    triageResult?.feature_contributions ||
    primaryAssessment?.feature_contributions ||
    [];

  // General triage response (nested object from backend)
  const gtr = triageResponse?.triageResponse || null;

  return (
    <div className={styles.container}>
      {/* Emergency Modal */}
      <RedFlagEmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        redFlags={(triageResult?.red_flags_detected || []).map((rf) => {
          const found = RED_FLAG_DEFINITIONS.find(
            (item) =>
              item.key === rf || item.label.toLowerCase().includes(String(rf).toLowerCase().replace(/_/g, " "))
          );
          return found ? found.label : String(rf).replace(/_/g, " ");
        })}
        message={triageResult?.red_flag_message}
      />

      {/* Main Header */}
      <div className={styles.header}>
        <div className={styles.badgeAi}>
          <Sparkles size={16} />
          <span>E-Sanjeevani Unified Triage — 5 Categories · 25 Diseases</span>
        </div>
        <h1>AI Clinical Differential Triage</h1>
        <p>Select a clinical category, report symptoms, and receive an explainable ML differential assessment</p>

        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "unified" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("unified")}
          >
            <Layers size={18} />
            <span>E-Sanjeevani Triage (Unified ML)</span>
            <span className={styles.pillHighlight}>5 Categories</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Activity size={18} />
            <span>General Health Triage</span>
          </button>
        </div>
      </div>

      {/* ───────── TAB 1: UNIFIED TRIAGE ───────── */}
      {activeTab === "unified" && (
        <div>
          {!triageResult ? (
            <div className={styles.card}>
              {/* Demo Presets */}
              <div className={styles.presetsSection}>
                <div className={styles.presetsHeader}>
                  <ListFilter size={16} className={styles.presetIcon} />
                  <span>Quick Test Profiles (1-Click Demo):</span>
                </div>
                <div className={styles.presetsList}>
                  {DEMO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`${styles.presetChip} ${preset.redFlags.length > 0 ? styles.presetChipEmergency : ""}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                  {(selectedSymptomsCount > 0 || selectedRedFlagsCount > 0) && (
                    <button type="button" onClick={clearForm} className={styles.presetChipClear}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Step 1 */}
              <div className={styles.sectionHeadingRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Step 1 — Select Clinical Category</h2>
                  <p className={styles.sectionSubtitle}>Choose the primary body system affected by your symptoms</p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1.75rem",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategorySwitch(cat.key)}
                    className={styles.categoryCard}
                    style={{
                      cursor: "pointer",
                      border: `2px solid ${selectedCategory === cat.key ? cat.color : "transparent"}`,
                      boxShadow: selectedCategory === cat.key ? `0 0 0 2px ${cat.color}33` : undefined,
                      background: selectedCategory === cat.key ? `${cat.color}11` : undefined,
                    }}
                  >
                    <span style={{ color: cat.color, display: "flex", marginBottom: "0.35rem" }}>{cat.icon}</span>
                    <div className={styles.categoryTitle} style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem", lineHeight: 1.3 }}>
                      {cat.subtitle}
                    </div>
                  </button>
                ))}
              </div>

              {/* Step 2 */}
              <div className={styles.sectionHeadingRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Step 2 — Select Reported Symptoms</h2>
                  <p className={styles.sectionSubtitle}>
                    <strong style={{ color: currentCategory?.color }}>{currentCategory?.label}</strong> — Select all
                    symptoms currently experienced. The ML classifier evaluates every feature below.
                  </p>
                </div>
                <div className={styles.countBadge}>{selectedSymptomsCount} selected</div>
              </div>

              <div className={styles.categoriesGrid}>
                {currentCategory?.symptomGroups.map((group, gIdx) => (
                  <div key={gIdx} className={styles.categoryCard}>
                    <h3 className={styles.categoryTitle}>{group.group}</h3>
                    <div className={styles.symptomsGrid}>
                      {group.symptoms.map((symptom) => {
                        const isChecked = selectedSymptoms[symptom.key] === 1;
                        return (
                          <label
                            key={symptom.key}
                            className={`${styles.symptomToggle} ${isChecked ? styles.symptomToggleActive : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSymptom(symptom.key)}
                              className={styles.hiddenCheckbox}
                            />
                            <span className={styles.customCheck}>
                              {isChecked && <Check size={13} strokeWidth={3} />}
                            </span>
                            <span className={styles.symptomLabel}>{symptom.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 3 */}
              <div className={styles.redFlagsCard}>
                <div
                  className={styles.redFlagsHeader}
                  onClick={() => setShowRedFlagsAccordion(!showRedFlagsAccordion)}
                >
                  <div className={styles.redFlagsHeaderLeft}>
                    <ShieldAlert size={22} className={styles.redFlagsIcon} />
                    <div>
                      <h4>Step 3 — Emergency Red-Flag Warning Signs</h4>
                      <p>Check if any acute danger signs are present requiring emergency medical intervention</p>
                    </div>
                  </div>
                  <div className={styles.redFlagsBadge}>
                    {selectedRedFlagsCount > 0 ? (
                      <span className={styles.redFlagAlertCount}>
                        {selectedRedFlagsCount} Alert{selectedRedFlagsCount > 1 ? "s" : ""} Active
                      </span>
                    ) : (
                      <span>{showRedFlagsAccordion ? "Hide Checklist" : "Show Checklist"}</span>
                    )}
                  </div>
                </div>

                {showRedFlagsAccordion && (
                  <div className={styles.redFlagsContent}>
                    <div className={styles.redFlagsGrid}>
                      {RED_FLAG_DEFINITIONS.map((rf) => {
                        const isChecked = !!selectedRedFlags[rf.key];
                        return (
                          <label
                            key={rf.key}
                            className={`${styles.redFlagToggle} ${isChecked ? styles.redFlagToggleActive : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRedFlag(rf.key)}
                              className={styles.hiddenCheckbox}
                            />
                            <span className={styles.customCheckRed}>
                              {isChecked && <Check size={13} strokeWidth={3} />}
                            </span>
                            <span className={styles.redFlagLabel}>{rf.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className={styles.feverActions}>
                <button
                  type="button"
                  onClick={handleRunAssessment}
                  disabled={isTriageLoading}
                  className={styles.btnPrimaryLg}
                >
                  {isTriageLoading ? (
                    <>
                      <RefreshCw size={18} className={styles.spinnerIcon} />
                      Running Unified ML Assessment...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Run E-Sanjeevani Triage Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ─── RESULT VIEW ─── */
            <div className={styles.resultContainer}>
              {triageResult.red_flag_alert && (
                <div className={styles.criticalBanner}>
                  <div className={styles.criticalBannerLeft}>
                    <AlertTriangle size={28} className={styles.criticalIcon} />
                    <div>
                      <h3>URGENT WARNING — Emergency Red-Flag Symptoms Detected</h3>
                      <p>{triageResult.red_flag_message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className={styles.btnEmergencyDetails}
                  >
                    View Emergency Guidance
                  </button>
                </div>
              )}

              {triageResult.insufficient_information && (
                <div className={styles.predictionCard}>
                  <h3>More Information Needed</h3>
                  <p>{triageResult.message}</p>
                  {triageResult.guidance_questions?.map((q, i) => (
                    <p key={i} style={{ marginTop: "0.5rem" }}>
                      <strong style={{ textTransform: "capitalize" }}>{q.category}:</strong> {q.question}
                    </p>
                  ))}
                </div>
              )}

              {!triageResult.red_flag_alert && !triageResult.insufficient_information && (
                <div className={styles.predictionCard}>
                  <div className={styles.predictionTopRow}>
                    <div>
                      <span className={styles.predictionTag}>
                        {CATEGORIES.find((c) => c.key === (triageResult.primary_category || selectedCategory))
                          ?.label || "Primary Differential"}
                      </span>
                      <h2 className={styles.predictedDiseaseTitle}>{displayPrimaryCondition}</h2>
                      <p className={styles.diseaseCategory}>
                        Recommended Care: <strong>{displaySpecialist}</strong>
                      </p>
                    </div>
                    {displayConfidence > 0 && (
                      <div className={styles.confidenceBadgeBox}>
                        <span className={styles.confidenceVal}>{Math.round(displayConfidence)}%</span>
                        <span className={styles.confidenceLabel}>Model Confidence</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.actionRecommendationBox}>
                    <div className={styles.actionRecommendationHeader}>
                      <Stethoscope size={18} />
                      <span>Recommended Clinical Next Step:</span>
                    </div>
                    <p className={styles.actionRecommendationText}>
                      {triageResult.recommended_action ||
                        `Consult a ${displaySpecialist} for complete diagnostic validation and confirmatory testing.`}
                    </p>
                  </div>
                </div>
              )}

              {triageResult.assessments && triageResult.assessments.length > 1 && (
                <div className={styles.card}>
                  <h3 className={styles.cardSectionTitle}>
                    <Layers size={18} />
                    <span>
                      Multi-Category Assessment Breakdown ({triageResult.assessments.length} categories matched)
                    </span>
                  </h3>
                  {triageResult.assessments.map((assess, aIdx) => {
                    const catColor = CATEGORIES.find((c) => c.key === assess.category)?.color || "#0ea5a4";
                    return (
                      <div
                        key={aIdx}
                        style={{
                          marginBottom: "0.75rem",
                          padding: "0.75rem",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: "0.5rem",
                          borderLeft: `3px solid ${catColor}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ color: catColor }}>{assess.category_name || assess.category}</strong>
                            <span style={{ marginLeft: "0.75rem", fontSize: "0.85rem" }}>→ {assess.top_condition}</span>
                          </div>
                          <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {Math.round(assess.confidence_pct || 0)}% confidence
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {displayShap.length > 0 && (
                <div className={styles.card}>
                  <ShapContributionChart contributions={displayShap} predictedDisease={displayPrimaryCondition} />
                </div>
              )}

              {displayTopRanking.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardSectionTitle}>
                    <BarChart3 size={18} />
                    <span>Differential Disease Probability Distribution</span>
                  </h3>
                  <div className={styles.differentialTable}>
                    {displayTopRanking.map((rank, idx) => {
                      const probPct =
                        rank.confidence_pct ??
                        (rank.score ? Math.round(rank.score * 100) : Math.max(5, 88 - idx * 25));
                      return (
                        <div key={idx} className={styles.diffRow}>
                          <div className={styles.diffInfo}>
                            <span className={styles.diffRank}>#{rank.rank || idx + 1}</span>
                            <div>
                              <strong className={styles.diffDisease}>
                                {(rank.label || rank.disease || "Condition").replace(/_/g, " ")}
                              </strong>
                            </div>
                          </div>
                          <div className={styles.diffBarCol}>
                            <div className={styles.diffBarTrack}>
                              <div
                                className={styles.diffBarFill}
                                style={{
                                  width: `${Math.min(100, Math.max(5, probPct))}%`,
                                  backgroundColor: idx === 0 ? "#0ea5a4" : idx === 1 ? "#3b82f6" : "#64748b",
                                }}
                              />
                            </div>
                            <span className={styles.diffPct}>{Math.round(probPct)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {displayExplanation && displayExplanation.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardSectionTitle}>
                    <CheckCircle2 size={18} />
                    <span>Clinical Reasoning &amp; Key Symptom Drivers</span>
                  </h3>
                  <ul className={styles.reasoningList}>
                    {displayExplanation.map((item, idx) => (
                      <li key={idx} className={styles.reasoningItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.disclaimerBox}>
                <HelpCircle size={16} className={styles.disclaimerIcon} />
                <p>
                  {triageResult.disclaimer ||
                    triageResult.medical_disclaimer ||
                    "This is an AI-assisted clinical differential triage tool for informational and educational purposes only. It does NOT constitute a confirmed medical diagnosis. Seek clinical evaluation by a certified doctor for definitive diagnosis and treatment."}
                </p>
              </div>

              <div className={styles.resultActions}>
                <button type="button" onClick={() => setTriageResult(null)} className={styles.btnSecondary}>
                  ← Modify Symptoms / Retest
                </button>
                <button type="button" onClick={clearForm} className={styles.btnPrimary}>
                  Start New Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── TAB 2: GENERAL HEALTH TRIAGE ───────── */}
      {activeTab === "general" && (
        <div>
          {isLoading && <AiTriageSkeleton />}

          {!isLoading && step === "symptoms" && (
            <div className={styles.card}>
              <h2>What symptoms are you experiencing?</h2>

              <div className={styles.formGroup}>
                <label>Symptom *</label>
                <input
                  type="text"
                  value={newSymptom.symptom}
                  onChange={(e) => setNewSymptom({ ...newSymptom, symptom: e.target.value })}
                  placeholder="e.g., Fever, Cough, Headache"
                  className={styles.input}
                />
              </div>

              <div className={styles.rowInputs}>
                <div className={styles.formGroup}>
                  <label>Duration *</label>
                  <input
                    type="text"
                    value={newSymptom.duration}
                    onChange={(e) => setNewSymptom({ ...newSymptom, duration: e.target.value })}
                    placeholder="e.g., 2 days, 1 week"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Severity *</label>
                  <select
                    value={newSymptom.severity}
                    onChange={(e) => setNewSymptom({ ...newSymptom, severity: e.target.value })}
                    className={styles.select}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  value={newSymptom.description}
                  onChange={(e) => setNewSymptom({ ...newSymptom, description: e.target.value })}
                  placeholder="Additional details about this symptom"
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <button type="button" onClick={addSymptom} className={styles.btnSecondary}>
                Add Symptom
              </button>

              {symptoms.length > 0 && (
                <div className={styles.symptomsList}>
                  <h3>Added Symptoms ({symptoms.length})</h3>
                  {symptoms.map((symptom, index) => (
                    <div key={index} className={styles.symptomItem}>
                      <div className={styles.symptomInfo}>
                        <strong>{symptom.symptom}</strong>
                        <span className={styles.duration}>{symptom.duration}</span>
                        <span className={styles.severity} style={{ backgroundColor: severityColor(symptom.severity) }}>
                          {symptom.severity}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeSymptom(index)} className={styles.btnRemove}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Medical History (optional)</label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="Any chronic diseases, surgeries, etc."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.rowInputs}>
                <div className={styles.formGroup}>
                  <label>Current Medications (optional)</label>
                  <textarea
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    placeholder="List any medications you're taking"
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Allergies (optional)</label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Any known allergies"
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Additional Notes (optional)</label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any other relevant information"
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleCreateSession}
                  disabled={symptoms.length === 0 || isLoading}
                  className={styles.btnPrimary}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      <ChevronRight size={18} /> Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {!isLoading && step === "review" && !triageResponse && (
            <div className={styles.card}>
              <h2>Review Your Information</h2>

              <div className={styles.reviewSection}>
                <h3>Symptoms</h3>
                {symptoms.map((symptom, index) => (
                  <div key={index} className={styles.reviewItem}>
                    <strong>{symptom.symptom}</strong> - {symptom.duration}, {symptom.severity} severity
                    {symptom.description && <p>{symptom.description}</p>}
                  </div>
                ))}
              </div>

              {medicalHistory && (
                <div className={styles.reviewSection}>
                  <h3>Medical History</h3>
                  <p>{medicalHistory}</p>
                </div>
              )}

              {currentMedications && (
                <div className={styles.reviewSection}>
                  <h3>Current Medications</h3>
                  <p>{currentMedications}</p>
                </div>
              )}

              {allergies && (
                <div className={styles.reviewSection}>
                  <h3>Allergies</h3>
                  <p>{allergies}</p>
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" onClick={() => setStep("symptoms")} className={styles.btnSecondary}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProcessTriage}
                  disabled={isLoading}
                  className={styles.btnPrimary}
                >
                  {isLoading ? "Processing AI Analysis..." : "Get AI Assessment"}
                </button>
              </div>
            </div>
          )}

          {!isLoading && step === "response" && triageResponse && gtr && (
            <div className={styles.card}>
              <h2>AI Health Assessment</h2>

              <div className={styles.urgencyBox} style={{ borderColor: getUrgencyColor(gtr.urgencyScore) }}>
                <div className={styles.urgencyScore} style={{ color: getUrgencyColor(gtr.urgencyScore) }}>
                  Urgency Score: {gtr.urgencyScore}/10
                </div>
                <div className={styles.urgencyLevel}>
                  Level: <strong>{String(gtr.urgencyLevel || "").toUpperCase()}</strong>
                </div>
              </div>

              {triageResponse.autoMatchedConsultation && (
                <div className={styles.autoMatchedBox}>
                  <h3>✓ Doctor Auto-Matched</h3>
                  <p>Due to high urgency, a specialist doctor has been assigned to you:</p>
                  <div className={styles.doctorInfo}>
                    <p>
                      <strong>{triageResponse.autoMatchedConsultation.doctorName}</strong>
                    </p>
                    <p>{triageResponse.autoMatchedConsultation.specialization}</p>
                    <p>
                      Scheduled:{" "}
                      {new Date(triageResponse.autoMatchedConsultation.scheduledDate).toLocaleDateString()} at{" "}
                      {triageResponse.autoMatchedConsultation.scheduledTime}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.assessmentSection}>
                <h3>Preliminary Assessment</h3>
                <p>{gtr.preliminaryAssessment}</p>
              </div>

              {gtr.possibleConditions && gtr.possibleConditions.length > 0 && (
                <div className={styles.assessmentSection}>
                  <h3>Possible Conditions</h3>
                  {gtr.possibleConditions.map((condition, index) => (
                    <div key={index} className={styles.conditionItem}>
                      <strong>{condition.condition}</strong>
                      <p>Probability: {((condition.probability || 0) * 100).toFixed(0)}%</p>
                      <p>{condition.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {gtr.recommendedTests && gtr.recommendedTests.length > 0 && (
                <div className={styles.assessmentSection}>
                  <h3>Recommended Tests</h3>
                  <ul>
                    {gtr.recommendedTests.map((test, index) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {gtr.recommendedSpecialties && gtr.recommendedSpecialties.length > 0 && (
                <div className={styles.assessmentSection}>
                  <h3>Recommended Specialties</h3>
                  <div className={styles.specialtiesList}>
                    {gtr.recommendedSpecialties.map((specialty, index) => (
                      <span key={index} className={styles.specialtyTag}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {gtr.immediateRecommendations && gtr.immediateRecommendations.length > 0 && (
                <div className={styles.assessmentSection}>
                  <h3>Recommendations</h3>
                  <ul>
                    {gtr.immediateRecommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("symptoms");
                    setSymptoms([]);
                    setTriageResponse(null);
                    setTriageSessionId(null);
                  }}
                  className={styles.btnPrimary}
                >
                  New Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiTriage;