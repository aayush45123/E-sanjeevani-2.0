import React, { useState, useEffect } from "react";
import styles from "./TriageDetailView.module.css";
import { apiClient } from "../../utils/api";

const TriageDetailView = ({ triageSessionId, onClose }) => {
  const [triageDetails, setTriageDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (triageSessionId) {
      fetchTriageDetails();
    }
  }, [triageSessionId]);

  const fetchTriageDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/triage/details/${triageSessionId}`);
      setTriageDetails(response.data.triageSession);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Error fetching triage details");
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading assessment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!triageDetails) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Assessment details not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{triageDetails.summaryTitle}</h2>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div
        className={styles.urgencySection}
        style={{ borderColor: getUrgencyColor(triageDetails.urgencyScore) }}
      >
        <div
          className={styles.urgencyScore}
          style={{ color: getUrgencyColor(triageDetails.urgencyScore) }}
        >
          Urgency Score: {triageDetails.urgencyScore}/10
        </div>
        <div className={styles.urgencyLevel}>
          Level: <strong>{triageDetails.urgencyLevel?.toUpperCase()}</strong>
        </div>
        <div className={styles.createdDate}>
          Assessment Date:{" "}
          {new Date(triageDetails.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      <div className={styles.symptomsSection}>
        <h3>Reported Symptoms</h3>
        <div className={styles.symptomsList}>
          {triageDetails.symptoms?.map((symptom, index) => (
            <div key={index} className={styles.symptomItem}>
              <div className={styles.symptomName}>{symptom.symptom}</div>
              <div className={styles.symptomDetails}>
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
              {symptom.description && (
                <div className={styles.symptomDescription}>
                  {symptom.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {triageDetails.medicalHistory && (
        <div className={styles.infoSection}>
          <h3>Medical History</h3>
          <p>{triageDetails.medicalHistory}</p>
        </div>
      )}

      {triageDetails.currentMedications && (
        <div className={styles.infoSection}>
          <h3>Current Medications</h3>
          <p>{triageDetails.currentMedications}</p>
        </div>
      )}

      {triageDetails.allergies && (
        <div className={styles.infoSection}>
          <h3>Known Allergies</h3>
          <p>{triageDetails.allergies}</p>
        </div>
      )}

      {triageDetails.aiResponse && (
        <>
          <div className={styles.assessmentSection}>
            <h3>AI Assessment</h3>
            <p className={styles.assessmentText}>
              {triageDetails.aiResponse.preliminaryAssessment}
            </p>
          </div>

          {triageDetails.aiResponse.possibleConditions &&
            triageDetails.aiResponse.possibleConditions.length > 0 && (
              <div className={styles.conditionsSection}>
                <h3>Possible Conditions</h3>
                <div className={styles.conditionsList}>
                  {triageDetails.aiResponse.possibleConditions.map(
                    (condition, index) => (
                      <div key={index} className={styles.conditionItem}>
                        <div className={styles.conditionName}>
                          {condition.condition}
                        </div>
                        <div className={styles.conditionProbability}>
                          Probability:{" "}
                          {(condition.probability * 100).toFixed(0)}%
                        </div>
                        <div className={styles.conditionDescription}>
                          {condition.description}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {triageDetails.aiResponse.recommendedTests &&
            triageDetails.aiResponse.recommendedTests.length > 0 && (
              <div className={styles.testsSection}>
                <h3>Recommended Tests</h3>
                <ul className={styles.testsList}>
                  {triageDetails.aiResponse.recommendedTests.map(
                    (test, index) => (
                      <li key={index}>{test}</li>
                    ),
                  )}
                </ul>
              </div>
            )}

          {triageDetails.aiResponse.recommendedSpecialties &&
            triageDetails.aiResponse.recommendedSpecialties.length > 0 && (
              <div className={styles.specialtiesSection}>
                <h3>Recommended Specialties</h3>
                <div className={styles.specialtiesList}>
                  {triageDetails.aiResponse.recommendedSpecialties.map(
                    (specialty, index) => (
                      <span key={index} className={styles.specialtyTag}>
                        {specialty}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

          {triageDetails.aiResponse.immediateRecommendations &&
            triageDetails.aiResponse.immediateRecommendations.length > 0 && (
              <div className={styles.recommendationsSection}>
                <h3>Recommendations</h3>
                <ul className={styles.recommendationsList}>
                  {triageDetails.aiResponse.immediateRecommendations.map(
                    (rec, index) => (
                      <li key={index}>{rec}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
        </>
      )}

      {triageDetails.assignedDoctor && (
        <div className={styles.doctorSection}>
          <h3>✓ Doctor Assigned</h3>
          <div className={styles.doctorInfo}>
            <p>
              <strong>{triageDetails.assignedDoctor.fullName}</strong>
            </p>
            <p>Specialization: {triageDetails.assignedDoctor.specialization}</p>
            {triageDetails.assignedDoctor.rating && (
              <p>Rating: ⭐ {triageDetails.assignedDoctor.rating}/5</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TriageDetailView;
