import React, { useState, useEffect } from "react";
import styles from "./TriageHistory.module.css";
import { apiClient } from "../../utils/api";
import { PanelRightClose, PanelRightOpen, History, Trash2 } from "lucide-react";

const TriageHistory = ({
  onSelectTriage,
  onDeleteTriage,
  activeSessionId,
  isMinimized,
  onToggleMinimize,
  refreshTrigger,
}) => {
  const [triageHistory, setTriageHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTriageId, setSelectedTriageId] = useState(activeSessionId || null);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedTriageId(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchTriageHistory();
  }, [refreshTrigger, activeSessionId]);

  useEffect(() => {
    fetchTriageHistory();

    // Refetch when user focuses on window (comes back to tab)
    window.addEventListener("focus", fetchTriageHistory);

    // Also set up interval to check for new triages every 8 seconds
    const interval = setInterval(fetchTriageHistory, 8000);

    return () => {
      window.removeEventListener("focus", fetchTriageHistory);
      clearInterval(interval);
    };
  }, []);

  const fetchTriageHistory = async () => {
    try {
      const response = await apiClient.get("/triage/history");
      setTriageHistory(response.data.triageHistory || []);
    } catch (error) {
      console.error("Error fetching triage history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this triage conversation?")) return;

    try {
      await apiClient.delete(`/triage/history/${sessionId}`);
      setTriageHistory((prev) => prev.filter((item) => (item._id || item.id) !== sessionId));
      if (onDeleteTriage) onDeleteTriage(sessionId);
    } catch (error) {
      console.error("Error deleting session:", error);
      alert(error.response?.data?.message || "Failed to delete triage session");
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
    if (!dateString) return "";
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

  if (isMinimized) {
    return (
      <div className={`${styles.container} ${styles.containerMinimized}`}>
        <button
          className={styles.toggleBtn}
          onClick={onToggleMinimize}
          title="Expand Triage History"
        >
          <PanelRightOpen size={18} />
        </button>
        <div className={styles.minimizedBadge} title={`${triageHistory.length} Sessions`}>
          <History size={16} />
          <span className={styles.minimizedCount}>{triageHistory.length}</span>
        </div>
      </div>
    );
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3>Triage History</h3>
          <span className={styles.count}>{triageHistory.length}</span>
        </div>
        {onToggleMinimize && (
          <button
            className={styles.toggleBtn}
            onClick={onToggleMinimize}
            title="Minimize Triage History"
          >
            <PanelRightClose size={18} />
          </button>
        )}
      </div>

      {triageHistory.length === 0 ? (
        <div className={styles.empty}>
          <p>No triage assessments yet</p>
          <small>Your assessment history will appear here</small>
        </div>
      ) : (
        <div className={styles.historyList}>
          {triageHistory.map((triage) => {
            const sessionId = triage._id || triage.id;
            const isSelected = selectedTriageId === sessionId;

            return (
              <div
                key={sessionId}
                className={`${styles.historyItem} ${isSelected ? styles.active : ""}`}
                onClick={() => {
                  setSelectedTriageId(sessionId);
                  onSelectTriage && onSelectTriage(sessionId);
                }}
              >
                <div className={styles.itemHeader}>
                  <div
                    className={styles.urgencyBadge}
                    style={{
                      backgroundColor: getUrgencyColor(triage.urgencyScore || 0),
                    }}
                  >
                    {triage.urgencyScore || 0}
                  </div>
                  <div className={styles.itemTitle}>
                    <h4>{triage.summaryTitle || "Triage Session"}</h4>
                    <small className={styles.date}>
                      {formatDate(triage.createdAt)}
                    </small>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteSession(e, sessionId)}
                    title="Delete Conversation"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "4px",
                      marginLeft: "auto",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.itemBody}>
                  <p className={styles.description}>
                    {triage.summaryDescription
                      ? triage.summaryDescription.substring(0, 100) + "..."
                      : "Triage conversation stored"}
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
                    {getUrgencyLabel(triage.urgencyLevel || "low")}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.footer}>
        <small>Tip: Click on any assessment to view full conversation history</small>
      </div>
    </div>
  );
};

export default TriageHistory;

