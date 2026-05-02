import React, { useState, useEffect } from "react";
import styles from "./TriageHistory.module.css";

const TriageHistory = ({ onSelectTriage }) => {
  const [triageHistory, setTriageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTriageId, setSelectedTriageId] = useState(null);

  useEffect(() => {
    fetchTriageHistory();
  }, []);

  const fetchTriageHistory = async () => {
    try {
      const response = await fetch("/api/triage/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTriageHistory(data.triageHistory);
      } else {
        console.error("Error fetching triage history:", data.message);
      }
    } catch (error) {
      console.error("Error:", error);
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

  const getUrgencyLabel = (level) => {
    const labels = {
      critical: "CRITICAL",
      high: "HIGH",
      moderate: "MODERATE",
      low: "LOW",
    };
    return labels[level] || level;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return (
        "Today " +
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (date.toDateString() === yesterday.toDateString()) {
      return (
        "Yesterday " +
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading history...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Triage History</h3>
        <span className={styles.count}>{triageHistory.length}</span>
      </div>

      {triageHistory.length === 0 ? (
        <div className={styles.empty}>
          <p>No triage assessments yet</p>
          <small>Your assessment history will appear here</small>
        </div>
      ) : (
        <div className={styles.historyList}>
          {triageHistory.map((triage) => (
            <div
              key={triage._id}
              className={`${styles.historyItem} ${selectedTriageId === triage._id ? styles.active : ""}`}
              onClick={() => {
                setSelectedTriageId(triage._id);
                onSelectTriage && onSelectTriage(triage._id);
              }}
            >
              <div className={styles.itemHeader}>
                <div
                  className={styles.urgencyBadge}
                  style={{
                    backgroundColor: getUrgencyColor(triage.urgencyScore),
                  }}
                >
                  {triage.urgencyScore}
                </div>
                <div className={styles.itemTitle}>
                  <h4>{triage.summaryTitle || "Triage Assessment"}</h4>
                  <small className={styles.date}>
                    {formatDate(triage.createdAt)}
                  </small>
                </div>
              </div>

              <div className={styles.itemBody}>
                <p className={styles.description}>
                  {triage.summaryDescription
                    ? triage.summaryDescription.substring(0, 100) + "..."
                    : "Assessment completed"}
                </p>

                {triage.recommendedSpecialty && (
                  <div className={styles.specialty}>
                    <small>Specialty: {triage.recommendedSpecialty}</small>
                  </div>
                )}

                {triage.status === "assigned_doctor" && (
                  <div className={styles.badge}>
                    <small>✓ Doctor Assigned</small>
                  </div>
                )}
              </div>

              <div className={styles.itemFooter}>
                <small className={styles.urgencyLevel}>
                  {getUrgencyLabel(triage.urgencyLevel || "unknown")}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <small>Tip: Click on any assessment to view full details</small>
      </div>
    </div>
  );
};

export default TriageHistory;
