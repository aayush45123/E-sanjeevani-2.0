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
} from "lucide-react";

// Exact 25 WHO Fever Feature Definitions categorized by clinical domain
const FEVER_SYMPTOM_CATEGORIES = [
  {
    category: "General & Systemic",
    symptoms: [
      { key: "fever", label: "Fever" },
      { key: "high_fever", label: "High Fever (>102°F / 38.9°C)" },
      { key: "sudden_onset", label: "Sudden Onset of Fever" },
      { key: "fatigue", label: "Fatigue / Exhaustion" },
      { key: "weakness", label: "General Weakness" },
      { key: "loss_of_appetite", label: "Loss of Appetite" },
      { key: "chills", label: "Chills / Shivering" },
      { key: "sweating", label: "Profuse Sweating" },
    ],
  },
  {
    category: "Pain & Musculoskeletal",
    symptoms: [
      { key: "headache", label: "Headache" },
      { key: "severe_headache", label: "Severe Throbbing Headache" },
      { key: "pain_behind_eyes", label: "Pain Behind the Eyes (Retro-orbital)" },
      { key: "body_pain", label: "Generalized Body Aches" },
      { key: "muscle_pain", label: "Muscle Pain (Myalgia)" },
      { key: "joint_pain", label: "Joint Pain (Arthralgia)" },
      { key: "severe_joint_pain", label: "Severe / Debilitating Joint Pain" },
    ],
  },
  {
    category: "Respiratory & ENT",
    symptoms: [
      { key: "cough", label: "Cough" },
      { key: "sore_throat", label: "Sore Throat" },
      { key: "runny_nose", label: "Runny Nose / Congestion" },
      { key: "swollen_lymph_nodes", label: "Swollen Glands / Lymph Nodes" },
    ],
  },
  {
    category: "Gastrointestinal & Dermatological",
    symptoms: [
      { key: "rash", label: "Skin Rash / Petechiae" },
      { key: "nausea", label: "Nausea" },
      { key: "vomiting", label: "Vomiting" },
      { key: "abdominal_pain", label: "Abdominal Pain" },
      { key: "diarrhea", label: "Diarrhea" },
      { key: "constipation", label: "Constipation" },
    ],
  },
];

// Exact Red Flag Warning Signs from the ML model
const RED_FLAG_DEFINITIONS = [
  { key: "severe_abdominal_pain", label: "Severe / Unbearable Abdominal Pain" },
  { key: "persistent_vomiting", label: "Persistent Vomiting (Cannot keep fluids down)" },
  { key: "bleeding", label: "Bleeding (Gums, Nose, or Pinpoint Red Spots on Skin)" },
  { key: "blood_in_vomit", label: "Blood in Vomit (Coffee-ground appearance)" },
  { key: "blood_in_stool", label: "Blood in Stool or Black Tarry Stool" },
  { key: "breathing_difficulty", label: "Difficulty Breathing / Shortness of Breath" },
  { key: "rapid_breathing", label: "Rapid / Shallow Breathing" },
  { key: "confusion", label: "Confusion, Drowsiness, or Extreme Lethargy" },
  { key: "loss_of_consciousness", label: "Loss of Consciousness or Unresponsiveness" },
  { key: "fainting", label: "Fainting or Dizziness on Standing" },
  { key: "cold_clammy_skin", label: "Cold, Clammy, or Pale Extremities" },
  { key: "severe_weakness", label: "Severe Weakness / Inability to Stand or Walk" },
];

// Presets for quick evaluation and testing of all 5 disease classes
const DEMO_PRESETS = [
  {
    name: "Dengue Profile",
    symptoms: ["fever", "high_fever", "sudden_onset", "severe_headache", "pain_behind_eyes", "joint_pain", "rash", "nausea"],
    redFlags: [],
  },
  {
    name: "Malaria Profile",
    symptoms: ["fever", "high_fever", "chills", "sweating", "headache", "body_pain", "fatigue", "vomiting"],
    redFlags: [],
  },
  {
    name: "Typhoid Profile",
    symptoms: ["fever", "headache", "abdominal_pain", "constipation", "loss_of_appetite", "fatigue", "weakness"],
    redFlags: [],
  },
  {
    name: "Chikungunya Profile",
    symptoms: ["fever", "high_fever", "sudden_onset", "severe_joint_pain", "joint_pain", "rash", "muscle_pain", "headache"],
    redFlags: [],
  },
  {
    name: "Viral Fever Profile",
    symptoms: ["fever", "cough", "sore_throat", "runny_nose", "fatigue", "body_pain", "headache"],
    redFlags: [],
  },
  {
    name: "Emergency Red-Flag Case",
    symptoms: ["fever", "high_fever", "pain_behind_eyes", "severe_joint_pain"],
    redFlags: ["bleeding", "severe_abdominal_pain", "persistent_vomiting"],
  },
];

const AiTriage = () => {
  const [activeTab, setActiveTab] = useState("fever"); // "fever" | "general"

  // ---------------- Fever SHAP Triage State ----------------
  const [selectedFeverSymptoms, setSelectedFeverSymptoms] = useState({});
  const [selectedRedFlags, setSelectedRedFlags] = useState({});
  const [showRedFlagsAccordion, setShowRedFlagsAccordion] = useState(false);
  const [isFeverLoading, setIsFeverLoading] = useState(false);
  const [feverResult, setFeverResult] = useState(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // ---------------- General Triage State (Existing) ----------------
  const [step, setStep] = useState("symptoms"); // symptoms, review, response
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

  // --- Fever Symptom Handlers ---
  const toggleFeverSymptom = (key) => {
    setSelectedFeverSymptoms((prev) => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1,
    }));
  };

  const toggleRedFlag = (key) => {
    setSelectedRedFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyPreset = (preset) => {
    const newSymptoms = {};
    preset.symptoms.forEach((s) => {
      newSymptoms[s] = 1;
    });
    setSelectedFeverSymptoms(newSymptoms);

    const newRedFlags = {};
    preset.redFlags.forEach((rf) => {
      newRedFlags[rf] = true;
    });
    setSelectedRedFlags(newRedFlags);

    if (preset.redFlags.length > 0) {
      setShowRedFlagsAccordion(true);
    }
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const clearFeverForm = () => {
    setSelectedFeverSymptoms({});
    setSelectedRedFlags({});
    setFeverResult(null);
    setIsEmergencyModalOpen(false);
  };

  const handleFeverAssessment = async () => {
    const activeCount = Object.values(selectedFeverSymptoms).filter((v) => v === 1).length;
    const activeRedFlags = Object.entries(selectedRedFlags).filter(([_, v]) => v).map(([k]) => k);

    if (activeCount === 0 && activeRedFlags.length === 0) {
      toast.error("Please select at least one symptom or warning sign.");
      return;
    }

    setIsFeverLoading(true);
    try {
      // Build 25-feature binary vector
      const symptomVector = {};
      FEVER_SYMPTOM_CATEGORIES.forEach((cat) => {
        cat.symptoms.forEach((s) => {
          symptomVector[s.key] = selectedFeverSymptoms[s.key] === 1 ? 1 : 0;
        });
      });

      // Build red flags object
      const redFlagsObject = {};
      RED_FLAG_DEFINITIONS.forEach((rf) => {
        redFlagsObject[rf.key] = !!selectedRedFlags[rf.key];
      });

      const response = await apiClient.post("/fever/assess", {
        symptoms: symptomVector,
        red_flags: redFlagsObject,
      });

      const data = response.data;
      setFeverResult(data);

      if (data.red_flag_alert) {
        setIsEmergencyModalOpen(true);
        toast.error("Critical emergency red-flags detected! Please seek immediate care.", {
          duration: 6000,
        });
      } else {
        toast.success("AI Fever differential assessment complete!");
      }
    } catch (error) {
      console.error("Fever assessment error:", error);
      const errMsg = error.response?.data?.message || "Failed to run fever assessment. Ensure AI server is online.";
      toast.error(errMsg);
    } finally {
      setIsFeverLoading(false);
    }
  };

  // --- General Triage Handlers ---
  const addSymptom = () => {
    if (newSymptom.symptom.trim()) {
      setSymptoms([...symptoms, newSymptom]);
      setNewSymptom({
        symptom: "",
        duration: "",
        severity: "mild",
        description: "",
      });
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

  const getUrgencyColor = (score) => {
    if (score >= 8) return "#d32f2f";
    if (score >= 6) return "#f57c00";
    if (score >= 4) return "#fbc02d";
    return "#388e3c";
  };

  const selectedSymptomsCount = Object.values(selectedFeverSymptoms).filter((v) => v === 1).length;
  const selectedRedFlagsCount = Object.values(selectedRedFlags).filter(Boolean).length;

  return (
    <div className={styles.container}>
      {/* Emergency Modal Interrupt */}
      <RedFlagEmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        redFlags={
          feverResult?.red_flags?.map((rf) => {
            const found = RED_FLAG_DEFINITIONS.find((item) => item.key === rf);
            return found ? found.label : rf.replace(/_/g, " ");
          }) || []
        }
        message={feverResult?.red_flag_message}
      />

      {/* Main Header */}
      <div className={styles.header}>
        <div className={styles.badgeAi}>
          <Sparkles size={16} />
          <span>AI-Powered Clinical Intelligence</span>
        </div>
        <h1>AI Health &amp; Differential Triage</h1>
        <p>Instant clinical assessment, WHO fever differential diagnostics, and SHAP explainability</p>

        {/* Tab Switcher */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === "fever" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("fever")}
          >
            <Thermometer size={18} />
            <span>Fever Differential AI (SHAP)</span>
            <span className={styles.pillHighlight}>Explainable ML</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "general" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Activity size={18} />
            <span>General Health Triage</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: FEVER DIFFERENTIAL AI WITH SHAP
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "fever" && (
        <div>
          {!feverResult ? (
            <div className={styles.card}>
              {/* Presets Bar */}
              <div className={styles.presetsSection}>
                <div className={styles.presetsHeader}>
                  <ListFilter size={16} className={styles.presetIcon} />
                  <span>Quick Test Disease Profiles (1-Click Demo):</span>
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
                    <button
                      type="button"
                      onClick={clearFeverForm}
                      className={styles.presetChipClear}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* 25 Model Features in Categorized Groups */}
              <div className={styles.sectionHeadingRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Select Reported Fever Symptoms</h2>
                  <p className={styles.sectionSubtitle}>
                    Select all symptoms currently experienced. The XGBoost model evaluates all 25 WHO differential features.
                  </p>
                </div>
                <div className={styles.countBadge}>
                  {selectedSymptomsCount} selected
                </div>
              </div>

              <div className={styles.categoriesGrid}>
                {FEVER_SYMPTOM_CATEGORIES.map((cat, catIdx) => (
                  <div key={catIdx} className={styles.categoryCard}>
                    <h3 className={styles.categoryTitle}>{cat.category}</h3>
                    <div className={styles.symptomsGrid}>
                      {cat.symptoms.map((symptom) => {
                        const isChecked = selectedFeverSymptoms[symptom.key] === 1;
                        return (
                          <label
                            key={symptom.key}
                            className={`${styles.symptomToggle} ${isChecked ? styles.symptomToggleActive : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFeverSymptom(symptom.key)}
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

              {/* Red-Flag Warning Signs (Collapsible / Prominent) */}
              <div className={styles.redFlagsCard}>
                <div
                  className={styles.redFlagsHeader}
                  onClick={() => setShowRedFlagsAccordion(!showRedFlagsAccordion)}
                >
                  <div className={styles.redFlagsHeaderLeft}>
                    <ShieldAlert size={22} className={styles.redFlagsIcon} />
                    <div>
                      <h4>Emergency Red-Flag Symptoms</h4>
                      <p>Check if the patient has any high-risk warning signs requiring immediate emergency intervention</p>
                    </div>
                  </div>
                  <div className={styles.redFlagsBadge}>
                    {selectedRedFlagsCount > 0 ? (
                      <span className={styles.redFlagAlertCount}>{selectedRedFlagsCount} Alert Active</span>
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

              {/* Action Buttons */}
              <div className={styles.feverActions}>
                <button
                  type="button"
                  onClick={handleFeverAssessment}
                  disabled={isFeverLoading}
                  className={styles.btnPrimaryLg}
                >
                  {isFeverLoading ? (
                    <>
                      <RefreshCw size={18} className={styles.spinnerIcon} />
                      Analyzing Fever ML Differential &amp; Calculating SHAP...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Run AI Differential Assessment &amp; SHAP Explainer
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ─── FEVER ASSESSMENT RESULT VIEW ─── */
            <div className={styles.resultContainer}>
              {/* Emergency Banner if Red Flag */}
              {feverResult.red_flag_alert && (
                <div className={styles.criticalBanner}>
                  <div className={styles.criticalBannerLeft}>
                    <AlertTriangle size={28} className={styles.criticalIcon} />
                    <div>
                      <h3>URGENT WARNING — Red-Flag Symptoms Detected</h3>
                      <p>{feverResult.red_flag_message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className={styles.btnEmergencyDetails}
                  >
                    View Emergency Guidance
                  </button>
                </div>
              )}

              {/* Primary Prediction Hero Card */}
              <div className={styles.predictionCard}>
                <div className={styles.predictionTopRow}>
                  <div>
                    <span className={styles.predictionTag}>Primary Differential Prediction</span>
                    <h2 className={styles.predictedDiseaseTitle}>
                      {feverResult.top_ranking?.[0]?.disease?.replace(/_/g, " ") || "Undifferentiated Fever"}
                    </h2>
                    <p className={styles.diseaseCategory}>
                      Recommended Care: <strong>{feverResult.top_ranking?.[0]?.specialist || "General Physician"}</strong>
                    </p>
                  </div>

                  {feverResult.top_ranking?.[0]?.confidence_score && (
                    <div className={styles.confidenceBadgeBox}>
                      <span className={styles.confidenceVal}>
                        {feverResult.top_ranking[0].confidence_score}
                      </span>
                      <span className={styles.confidenceLabel}>Model Confidence</span>
                    </div>
                  )}
                </div>

                {/* Urgency and Next Steps Banner */}
                <div className={styles.actionRecommendationBox}>
                  <div className={styles.actionRecommendationHeader}>
                    <Stethoscope size={18} />
                    <span>Recommended Clinical Next Step:</span>
                  </div>
                  <p className={styles.actionRecommendationText}>
                    {feverResult.recommended_action || "Consult with a doctor for confirmatory laboratory testing."}
                  </p>
                </div>
              </div>

              {/* SHAP Explainability Visualization */}
              <div className={styles.card}>
                <ShapContributionChart
                  contributions={feverResult.shap_contributions || []}
                  predictedDisease={feverResult.top_ranking?.[0]?.disease?.replace(/_/g, " ") || "Primary Condition"}
                />
              </div>

              {/* Differential Diagnosis Top-3 Ranking Table */}
              <div className={styles.card}>
                <h3 className={styles.cardSectionTitle}>
                  <BarChart3 size={18} />
                  <span>Differential Disease Probability Distribution</span>
                </h3>
                <div className={styles.differentialTable}>
                  {feverResult.top_ranking?.map((rank, idx) => {
                    const probPct = rank.probability ? Math.round(rank.probability * 100) : (100 - idx * 25);
                    return (
                      <div key={idx} className={styles.diffRow}>
                        <div className={styles.diffInfo}>
                          <span className={styles.diffRank}>#{idx + 1}</span>
                          <div>
                            <strong className={styles.diffDisease}>{rank.disease?.replace(/_/g, " ")}</strong>
                            <span className={styles.diffSpecialist}>{rank.specialist}</span>
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
                            ></div>
                          </div>
                          <span className={styles.diffPct}>{rank.confidence_score || `${probPct}%`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Explanations & Evidence */}
              {feverResult.primary_explanation && feverResult.primary_explanation.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardSectionTitle}>
                    <CheckCircle2 size={18} />
                    <span>Clinical Reasoning &amp; Key Symptom Drivers</span>
                  </h3>
                  <ul className={styles.reasoningList}>
                    {feverResult.primary_explanation.map((item, idx) => (
                      <li key={idx} className={styles.reasoningItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Disclaimer */}
              <div className={styles.disclaimerBox}>
                <HelpCircle size={16} className={styles.disclaimerIcon} />
                <p>{feverResult.medical_disclaimer || "This is an AI-assisted differential triage screening tool only. It does not replace formal clinical evaluation or laboratory diagnostics."}</p>
              </div>

              {/* Result Actions */}
              <div className={styles.resultActions}>
                <button
                  type="button"
                  onClick={() => setFeverResult(null)}
                  className={styles.btnSecondary}
                >
                  ← Modify Symptoms / Retest
                </button>
                <button
                  type="button"
                  onClick={clearFeverForm}
                  className={styles.btnPrimary}
                >
                  Start New Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: GENERAL HEALTH TRIAGE (EXISTING WORKFLOW)
      ───────────────────────────────────────────────────────────── */}
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
                  onChange={(e) =>
                    setNewSymptom({ ...newSymptom, symptom: e.target.value })
                  }
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
                    onChange={(e) =>
                      setNewSymptom({ ...newSymptom, duration: e.target.value })
                    }
                    placeholder="e.g., 2 days, 1 week"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Severity *</label>
                  <select
                    value={newSymptom.severity}
                    onChange={(e) =>
                      setNewSymptom({ ...newSymptom, severity: e.target.value })
                    }
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
                  onChange={(e) =>
                    setNewSymptom({ ...newSymptom, description: e.target.value })
                  }
                  placeholder="Additional details about this symptom"
                  className={styles.textarea}
                  rows="3"
                />
              </div>

              <button onClick={addSymptom} className={styles.btnSecondary}>
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
                        <span
                          className={styles.severity}
                          style={{
                            backgroundColor:
                              symptom.severity === "severe"
                                ? "#d32f2f"
                                : symptom.severity === "moderate"
                                  ? "#f57c00"
                                  : "#388e3c",
                          }}
                        >
                          {symptom.severity}
                        </span>
                      </div>
                      <button
                        onClick={() => removeSymptom(index)}
                        className={styles.btnRemove}
                      >
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
                  rows="3"
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
                    rows="3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Allergies (optional)</label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Any known allergies"
                    className={styles.textarea}
                    rows="3"
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
                  rows="3"
                />
              </div>

              <div className={styles.actions}>
                <button
                  onClick={handleCreateSession}
                  disabled={symptoms.length === 0 || isLoading}
                  className={styles.btnPrimary}
                >
                  {isLoading ? "Processing..." : "Continue"}
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
                    <strong>{symptom.symptom}</strong> - {symptom.duration},{" "}
                    {symptom.severity} severity
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
                <button
                  onClick={() => setStep("symptoms")}
                  className={styles.btnSecondary}
                >
                  Back
                </button>
                <button
                  onClick={handleProcessTriage}
                  disabled={isLoading}
                  className={styles.btnPrimary}
                >
                  {isLoading ? "Processing AI Analysis..." : "Get AI Assessment"}
                </button>
              </div>
            </div>
          )}

          {!isLoading && step === "response" && triageResponse && (
            <div className={styles.card}>
              <h2>AI Health Assessment</h2>

              <div
                className={styles.urgencyBox}
                style={{
                  borderColor: getUrgencyColor(
                    triageResponse.triageResponse.urgencyScore,
                  ),
                }}
              >
                <div
                  className={styles.urgencyScore}
                  style={{
                    color: getUrgencyColor(
                      triageResponse.triageResponse.urgencyScore,
                    ),
                  }}
                >
                  Urgency Score: {triageResponse.triageResponse.urgencyScore}/10
                </div>
                <div className={styles.urgencyLevel}>
                  Level:{" "}
                  <strong>
                    {triageResponse.triageResponse.urgencyLevel.toUpperCase()}
                  </strong>
                </div>
              </div>

              {triageResponse.autoMatchedConsultation && (
                <div className={styles.autoMatchedBox}>
                  <h3>✓ Doctor Auto-Matched</h3>
                  <p>
                    Due to high urgency, a specialist doctor has been assigned to you:
                  </p>
                  <div className={styles.doctorInfo}>
                    <p>
                      <strong>
                        {triageResponse.autoMatchedConsultation.doctorName}
                      </strong>
                    </p>
                    <p>{triageResponse.autoMatchedConsultation.specialization}</p>
                    <p>
                      Scheduled:{" "}
                      {new Date(
                        triageResponse.autoMatchedConsultation.scheduledDate,
                      ).toLocaleDateString()}{" "}
                      at {triageResponse.autoMatchedConsultation.scheduledTime}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.assessmentSection}>
                <h3>Preliminary Assessment</h3>
                <p>{triageResponse.triageResponse.preliminaryAssessment}</p>
              </div>

              {triageResponse.triageResponse.possibleConditions &&
                triageResponse.triageResponse.possibleConditions.length > 0 && (
                  <div className={styles.assessmentSection}>
                    <h3>Possible Conditions</h3>
                    {triageResponse.triageResponse.possibleConditions.map(
                      (condition, index) => (
                        <div key={index} className={styles.conditionItem}>
                          <strong>{condition.condition}</strong>
                          <p>
                            Probability: {(condition.probability * 100).toFixed(0)}%
                          </p>
                          <p>{condition.description}</p>
                        </div>
                      ),
                    )}
                  </div>
                )}

              {triageResponse.triageResponse.recommendedTests && (
                <div className={styles.assessmentSection}>
                  <h3>Recommended Tests</h3>
                  <ul>
                    {triageResponse.triageResponse.recommendedTests.map(
                      (test, index) => (
                        <li key={index}>{test}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {triageResponse.triageResponse.recommendedSpecialties && (
                <div className={styles.assessmentSection}>
                  <h3>Recommended Specialties</h3>
                  <div className={styles.specialtiesList}>
                    {triageResponse.triageResponse.recommendedSpecialties.map(
                      (specialty, index) => (
                        <span key={index} className={styles.specialtyTag}>
                          {specialty}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {triageResponse.triageResponse.immediateRecommendations && (
                <div className={styles.assessmentSection}>
                  <h3>Recommendations</h3>
                  <ul>
                    {triageResponse.triageResponse.immediateRecommendations.map(
                      (rec, index) => (
                        <li key={index}>{rec}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              <div className={styles.actions}>
                <button
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
