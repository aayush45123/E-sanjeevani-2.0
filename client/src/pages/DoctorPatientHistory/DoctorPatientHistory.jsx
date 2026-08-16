import React, { useState, useEffect } from "react";
import {
  X, User, Calendar, FileText, Pill, Activity, AlertCircle, Shield,
  TrendingUp, Download, CheckCircle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { patientHistoryApi } from "../../utils/api";
import styles from "./DoctorPatientHistory.module.css";

/**
 * DoctorPatientHistory Modal / Page
 * Allows a doctor during or outside consultation to review a patient's
 * complete longitudinal history and factual analytics.
 */
export default function DoctorPatientHistory({ patientId, doctorId, onClose }) {
  const [history, setHistory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      if (!patientId || !doctorId) return;
      try {
        setLoading(true);
        setError("");
        const [histRes, analyticsRes] = await Promise.all([
          patientHistoryApi.getDoctorPatientHistory(doctorId, patientId),
          patientHistoryApi.getDoctorPatientAnalytics(doctorId, patientId),
        ]);
        setHistory(histRes.data.history);
        setAnalytics(analyticsRes.data.analytics);
      } catch (err) {
        console.error("Error loading doctor patient history:", err);
        setError(err.response?.data?.message || "Failed to load patient history.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId, doctorId]);

  if (!patientId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <h2>Patient Clinical History</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <p className={styles.headerSub}>
            Longitudinal records, factual consultation counts &amp; active medications
          </p>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Fetching clinical history…</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <AlertCircle size={32} />
            <p>{error}</p>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Patient Header Banner */}
            {history?.patientOverview && (
              <div className={styles.patientBanner}>
                <div className={styles.patientBannerRow}>
                  <div className={styles.avatar}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className={styles.patientName}>{history.patientOverview.name}</h3>
                    <div className={styles.patientDetails}>
                      {[
                        history.patientOverview.gender,
                        history.patientOverview.age,
                        `Blood Group: ${history.patientOverview.bloodGroup}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>

                <div className={styles.allergyRow}>
                  {history.patientOverview.knownAllergies !== "None reported" && (
                    <span className={styles.allergyBadge}>
                      ⚠️ Allergies: {history.patientOverview.knownAllergies}
                    </span>
                  )}
                  {history.patientOverview.existingConditions !== "None reported" && (
                    <span className={styles.conditionBadge}>
                      🛡️ Conditions: {history.patientOverview.existingConditions}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Factual Statistics Bar */}
            {analytics?.summary && (
              <div className={styles.factualBar}>
                <div className={styles.factItem}>
                  <span className={styles.factNum}>{analytics.summary.totalConsultations}</span>
                  <span className={styles.factLabel}>Total Consultations</span>
                </div>
                <div className={styles.factItem}>
                  <span className={styles.factNum}>{analytics.summary.totalPrescriptionsIssued}</span>
                  <span className={styles.factLabel}>Prescriptions</span>
                </div>
                <div className={styles.factItem}>
                  <span className={styles.factNum}>{analytics.summary.activeMedicationCount}</span>
                  <span className={styles.factLabel}>Active Meds</span>
                </div>
                <div className={styles.factItem}>
                  <span className={styles.factNum}>{analytics.diseaseAnalytics?.totalUniqueConditions || 0}</span>
                  <span className={styles.factLabel}>Recorded Diagnoses</span>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className={styles.tabs}>
              {[
                { id: "overview", label: "Overview & Analytics" },
                { id: "timeline", label: "Timeline" },
                { id: "prescriptions", label: "Prescriptions" },
                { id: "medications", label: "Active Medications" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`${styles.tabBtn} ${activeTab === t.id ? styles.activeTabBtn : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW & ANALYTICS */}
            {activeTab === "overview" && (
              <div className={styles.tabContent}>
                {/* Factual Diagnoses List */}
                <div className={styles.sectionCard}>
                  <h4><TrendingUp size={16} /> Previous Diagnoses (Factual Records)</h4>
                  {analytics?.diseaseAnalytics?.frequentDiagnoses?.length > 0 ? (
                    <div className={styles.factNotesList}>
                      {analytics.diseaseAnalytics.frequentDiagnoses.map((d, i) => (
                        <div key={i} className={styles.factNoteRow}>
                          <span className={styles.factNoteText}>• {d.note}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.mutedText}>No previous diagnoses recorded in system.</p>
                  )}
                  <div className={styles.disclaimerNote}>
                    ℹ️ Counts reflect past recorded consultations. Clinical diagnosis is the attending doctor's decision.
                  </div>
                </div>

                {/* Factual Symptoms List */}
                <div className={styles.sectionCard}>
                  <h4><Activity size={16} /> Reported Symptoms Frequency</h4>
                  {analytics?.symptomAnalytics?.length > 0 ? (
                    <div className={styles.factNotesList}>
                      {analytics.symptomAnalytics.map((s, i) => (
                        <div key={i} className={styles.factNoteRow}>
                          <span className={styles.factNoteText}>• {s.note}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.mutedText}>No recurring symptoms identified in records.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === "timeline" && (
              <div className={styles.tabContent}>
                {history?.timeline?.length > 0 ? (
                  history.timeline.map((group) => (
                    <div key={group.period} className={styles.timelinePeriodGroup}>
                      <div className={styles.periodHeader}>{group.period}</div>
                      {group.events.map((evt) => (
                        <div key={evt.id} className={styles.eventItem}>
                          <div className={styles.eventTitle}>{evt.title}</div>
                          <div className={styles.eventDate}>
                            {new Date(evt.date).toLocaleDateString("en-IN")}
                          </div>
                          {evt.details?.diagnosis && (
                            <div className={styles.eventDiag}>Diagnosis: {evt.details.diagnosis}</div>
                          )}
                          {evt.details?.pdfUrl && (
                            <a href={evt.details.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                              <Download size={12} /> Prescription PDF
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className={styles.mutedText}>No timeline events available.</p>
                )}
              </div>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {activeTab === "prescriptions" && (
              <div className={styles.tabContent}>
                {history?.prescriptions?.length > 0 ? (
                  history.prescriptions.map((rx) => (
                    <div key={rx.id} className={styles.rxCard}>
                      <div className={styles.rxHeader}>
                        <strong>{rx.diagnosis || "Prescription"}</strong>
                        <span className={styles.rxDate}>
                          {new Date(rx.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      {rx.items?.length > 0 && (
                        <ul className={styles.rxMedList}>
                          {rx.items.map((m) => (
                            <li key={m.id}>
                              {m.medicineName} {m.dosage} ({m.route || "Oral"}) — {m.frequency} for {m.duration}
                            </li>
                          ))}
                        </ul>
                      )}
                      {rx.pdfUrl && (
                        <a href={rx.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                          <Download size={12} /> Download PDF
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.mutedText}>No prescriptions recorded for this patient.</p>
                )}
              </div>
            )}

            {/* TAB: ACTIVE MEDICATIONS */}
            {activeTab === "medications" && (
              <div className={styles.tabContent}>
                {analytics?.prescriptionAnalytics?.activeMedications?.length > 0 ? (
                  <div className={styles.medGrid}>
                    {analytics.prescriptionAnalytics.activeMedications.map((m) => (
                      <div key={m.id} className={styles.activeMedBox}>
                        <div className={styles.medName}>{m.medicineName} {m.dosage}</div>
                        <div className={styles.medSub}>{m.frequency} · {m.duration} ({m.route})</div>
                        {m.instructions && <div className={styles.medNote}>{m.instructions}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>No currently active medications.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
