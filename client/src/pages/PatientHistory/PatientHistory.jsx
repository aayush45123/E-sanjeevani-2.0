import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, FileText, Pill, Activity, Download, ChevronDown,
  ChevronUp, Clock, CheckCircle, XCircle, AlertCircle, User, Shield,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { patientHistoryApi, prescriptionApi } from "../../utils/api";
import styles from "./PatientHistory.module.css";

export default function PatientHistory() {
  const [history, setHistory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");
  const [expandedRx, setExpandedRx] = useState(null);

  const patientId = localStorage.getItem("userId");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [histRes, analyticsRes] = await Promise.all([
        patientHistoryApi.getPatientClinicalRecords(patientId),
        patientHistoryApi.getDoctorPatientAnalytics("me", patientId).catch(() => null),
      ]);
      setHistory(histRes.data);
      if (analyticsRes?.data?.analytics) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      setError("Failed to load clinical history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { patientOverview, prescriptions = [], documents = [], timeline = [] } = history || {};
  const activeMeds = analytics?.prescriptionAnalytics?.activeMedications || [];
  const completedMeds = analytics?.prescriptionAnalytics?.completedMedications || [];

  return (
    <div className={styles.layout}>
      <Sidebar onLogout={() => {}} />

      <main className={styles.main}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Clinical History</h1>
            <p className={styles.subtitle}>
              Your complete longitudinal medical record — consultations, prescriptions &amp; documents
            </p>
          </div>
          <div className={styles.statsRow}>
            <StatChip icon={<Calendar size={14} />} label="Consultations"
              value={patientOverview?.totalConsultations ?? "—"} color="blue" />
            <StatChip icon={<FileText size={14} />} label="Prescriptions"
              value={patientOverview?.totalPrescriptions ?? "—"} color="green" />
            <StatChip icon={<Pill size={14} />} label="Active Medicines"
              value={activeMeds.length} color="amber" />
          </div>
        </div>

        {/* ── Patient Summary Card ── */}
        {patientOverview && (
          <div className={styles.patientCard}>
            <div className={styles.patientCardRow}>
              <div className={styles.avatarCircle}>
                <User size={24} />
              </div>
              <div>
                <div className={styles.patientName}>{patientOverview.name}</div>
                <div className={styles.patientMeta}>
                  {[patientOverview.gender, patientOverview.age, patientOverview.bloodGroup]
                    .filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            <div className={styles.patientAlerts}>
              {patientOverview.knownAllergies !== "None reported" && (
                <div className={styles.alertChip}>
                  <AlertCircle size={12} /> Allergies: {patientOverview.knownAllergies}
                </div>
              )}
              {patientOverview.existingConditions !== "None reported" && (
                <div className={styles.conditionChip}>
                  <Shield size={12} /> {patientOverview.existingConditions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {[
            { id: "timeline", label: "Timeline", icon: <Clock size={14} /> },
            { id: "prescriptions", label: "Prescriptions", icon: <FileText size={14} /> },
            { id: "medications", label: "Medications", icon: <Pill size={14} /> },
            { id: "documents", label: "Documents", icon: <Activity size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: TIMELINE ── */}
        {activeTab === "timeline" && (
          <div className={styles.timeline}>
            {timeline.length === 0 ? (
              <EmptyState text="No clinical events yet" />
            ) : (
              timeline.map((group) => (
                <div key={group.period} className={styles.timelineGroup}>
                  <div className={styles.timelinePeriod}>{group.period}</div>
                  <div className={styles.timelineEvents}>
                    {group.events.map((evt) => (
                      <TimelineEvent key={evt.id} event={evt} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: PRESCRIPTIONS ── */}
        {activeTab === "prescriptions" && (
          <div className={styles.rxList}>
            {prescriptions.length === 0 ? (
              <EmptyState text="No prescriptions issued yet" />
            ) : (
              prescriptions
                .filter((rx) => rx.status === "finalized")
                .map((rx) => (
                  <PrescriptionCard
                    key={rx.id}
                    rx={rx}
                    expanded={expandedRx === rx.id}
                    onToggle={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                  />
                ))
            )}
          </div>
        )}

        {/* ── TAB: MEDICATIONS ── */}
        {activeTab === "medications" && (
          <div className={styles.medSection}>
            {activeMeds.length > 0 && (
              <>
                <h3 className={styles.medGroupTitle}>
                  <span className={styles.activeDot} /> Active Medications ({activeMeds.length})
                </h3>
                <div className={styles.medGrid}>
                  {activeMeds.map((med) => (
                    <MedCard key={med.id} med={med} status="active" />
                  ))}
                </div>
              </>
            )}
            {completedMeds.length > 0 && (
              <>
                <h3 className={`${styles.medGroupTitle} ${styles.completedTitle}`}>
                  Completed Medications ({completedMeds.length})
                </h3>
                <div className={styles.medGrid}>
                  {completedMeds.map((med) => (
                    <MedCard key={med.id} med={med} status="completed" />
                  ))}
                </div>
              </>
            )}
            {activeMeds.length === 0 && completedMeds.length === 0 && (
              <EmptyState text="No medication history found" />
            )}
          </div>
        )}

        {/* ── TAB: DOCUMENTS ── */}
        {activeTab === "documents" && (
          <div className={styles.docList}>
            {documents.length === 0 ? (
              <EmptyState text="No supporting documents uploaded" />
            ) : (
              documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, label, value, color }) {
  return (
    <div className={`${styles.statChip} ${styles[`statChip_${color}`]}`}>
      {icon}
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function TimelineEvent({ event }) {
  const iconMap = {
    consultation: "🩺",
    prescription: "💊",
    document_upload: "📄",
  };
  return (
    <div className={styles.timelineEvent}>
      <div className={styles.timelineIcon}>{iconMap[event.type] || "📋"}</div>
      <div className={styles.timelineBody}>
        <div className={styles.timelineTitle}>{event.title}</div>
        <div className={styles.timelineDate}>
          {event.date ? new Date(event.date).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          }) : "—"}
        </div>
        {event.details?.diagnosis && (
          <div className={styles.timelineDiag}>Diagnosis: {event.details.diagnosis}</div>
        )}
        {event.details?.pdfUrl && (
          <a href={event.details.pdfUrl} target="_blank" rel="noopener noreferrer"
            className={styles.pdfLink}>
            <Download size={12} /> Download PDF
          </a>
        )}
      </div>
    </div>
  );
}

function PrescriptionCard({ rx, expanded, onToggle }) {
  const statusColor = { finalized: "green", draft: "amber", amended: "blue" };
  return (
    <div className={styles.rxCard}>
      <div className={styles.rxCardHeader} onClick={onToggle}>
        <div>
          <div className={styles.rxDiagnosis}>{rx.diagnosis || "Prescription"}</div>
          <div className={styles.rxMeta}>
            {new Date(rx.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
            {rx.items?.length > 0 && ` · ${rx.items.length} medicine${rx.items.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <div className={styles.rxCardActions}>
          <span className={`${styles.statusBadge} ${styles[`status_${statusColor[rx.status]}`]}`}>
            {rx.status}
          </span>
          {rx.pdfUrl && (
            <a href={rx.pdfUrl} target="_blank" rel="noopener noreferrer"
              className={styles.pdfIconBtn} onClick={(e) => e.stopPropagation()}
              title="Download PDF">
              <Download size={14} />
            </a>
          )}
          <span className={styles.expandIcon}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className={styles.rxCardBody}>
          {rx.advice && (
            <div className={styles.rxSection}>
              <span className={styles.rxSectionLabel}>Advice</span>
              <p>{rx.advice}</p>
            </div>
          )}
          {rx.recommendedTests && (
            <div className={styles.rxSection}>
              <span className={styles.rxSectionLabel}>Recommended Tests</span>
              <p>{rx.recommendedTests}</p>
            </div>
          )}
          {rx.referralInfo && (
            <div className={styles.rxSection}>
              <span className={styles.rxSectionLabel}>Referral</span>
              <p>{rx.referralInfo}</p>
            </div>
          )}
          {rx.items?.length > 0 && (
            <div className={styles.rxSection}>
              <span className={styles.rxSectionLabel}>Medicines</span>
              <div className={styles.medTable}>
                <div className={styles.medTableHead}>
                  <span>Medicine</span><span>Dosage</span><span>Route</span>
                  <span>Frequency</span><span>Duration</span><span>Status</span>
                </div>
                {rx.items.map((item) => (
                  <div key={item.id} className={styles.medTableRow}>
                    <span>{item.medicineName}</span>
                    <span>{item.dosage}</span>
                    <span>{item.route || "Oral"}</span>
                    <span>{item.frequency}</span>
                    <span>{item.duration}</span>
                    <span>
                      <MedStatusBadge status={item.currentStatus || item.status} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MedCard({ med, status }) {
  const endStr = med.endDate
    ? new Date(med.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className={`${styles.medCard} ${styles[`medCard_${status}`]}`}>
      <div className={styles.medName}>{med.medicineName}</div>
      <div className={styles.medDetail}>{med.dosage} · {med.route || "Oral"}</div>
      <div className={styles.medDetail}>{med.frequency} · {med.duration}</div>
      {med.instructions && <div className={styles.medInstr}>{med.instructions}</div>}
      <div className={styles.medFooter}>
        <MedStatusBadge status={status} />
        <span className={styles.medEnd}>
          {status === "active" ? `Until ${endStr}` : `Ended ${endStr}`}
        </span>
      </div>
    </div>
  );
}

function MedStatusBadge({ status }) {
  const cfg = {
    active: { icon: <CheckCircle size={10} />, cls: styles.badge_active, label: "Active" },
    completed: { icon: <Clock size={10} />, cls: styles.badge_completed, label: "Completed" },
    discontinued: { icon: <XCircle size={10} />, cls: styles.badge_discontinued, label: "Discontinued" },
  };
  const c = cfg[status] || cfg.completed;
  return (
    <span className={`${styles.medBadge} ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function DocumentCard({ doc }) {
  return (
    <div className={styles.docCard}>
      <div className={styles.docIcon}><FileText size={20} /></div>
      <div className={styles.docBody}>
        <div className={styles.docTitle}>{doc.recordTitle || "Document"}</div>
        <div className={styles.docMeta}>
          {doc.recordType?.replace("_", " ")} ·{" "}
          {doc.recordDate ? new Date(doc.recordDate).toLocaleDateString("en-IN") : ""}
        </div>
        {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
        {doc.attachments?.map((att) => (
          <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
            className={styles.attLink}>
            <Download size={12} /> {att.fileName}
          </a>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className={styles.empty}><FileText size={36} /><p>{text}</p></div>;
}

function LoadingState() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading clinical history…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.error}>
      <AlertCircle size={36} />
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
