import React, { useState } from "react";
import styles from "./AiTriage.module.css";
import { apiClient } from "../../utils/api";
import { AiTriageSkeleton } from "../Skeletons";
import toast from "react-hot-toast";

const AiTriage = () => {
  const [step, setStep] = useState("symptoms"); // symptoms, medical, review, response
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

      console.log("✅ Triage session created:", response.data.triageSessionId);
      setTriageSessionId(response.data.triageSessionId);
      setStep("review");
      toast.success("Symptoms recorded. Review and confirm to process.");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error("❌ Failed:", errorMsg);
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
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Error processing triage assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (score) => {
    if (score >= 8) return "#d32f2f"; // red
    if (score >= 6) return "#f57c00"; // orange
    if (score >= 4) return "#fbc02d"; // yellow
    return "#388e3c"; // green
  };

  if (isLoading) {
    return <AiTriageSkeleton />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>AI Health Triage</h1>
        <p>Get an instant health assessment based on your symptoms</p>
      </div>

      {step === "symptoms" && (
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

      {step === "review" && !triageResponse && (
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

      {step === "response" && triageResponse && (
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
                Due to high urgency, a specialist doctor has been assigned to
                you:
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
  );
};

export default AiTriage;
