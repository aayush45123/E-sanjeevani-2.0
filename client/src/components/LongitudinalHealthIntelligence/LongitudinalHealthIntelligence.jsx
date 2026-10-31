import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileText,
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  Thermometer,
  Heart,
  Droplets,
  Layers,
  Info,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { patientHistoryApi } from "../../utils/api";
import styles from "./LongitudinalHealthIntelligence.module.css";

export default function LongitudinalHealthIntelligence({
  patientId,
  doctorId,
  patientName = "Patient",
  currentComplaint = "",
  initialData = null,
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [activeChartTab, setActiveChartTab] = useState("temperature"); // 'temperature' | 'cardiovascular' | 'oxygen' | 'platelets'
  const [showLogModal, setShowLogModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Quick vital form state
  const [vitalForm, setVitalForm] = useState({
    temperature: "",
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    spo2: "",
    bloodGlucose: "",
    plateletCount: "",
    notes: "",
  });
  const [vitalSubmitting, setVitalSubmitting] = useState(false);

  const fetchIntelligence = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError("");
      const res = await patientHistoryApi.getLongitudinalIntelligence(patientId, currentComplaint);
      if (res.data?.intelligence) {
        setData(res.data.intelligence);
      }
    } catch (err) {
      console.error("Failed to load longitudinal intelligence:", err);
      setError(err.response?.data?.message || "Failed to load longitudinal clinical intelligence.");
    } finally {
      setLoading(false);
    }
  }, [patientId, currentComplaint]);

  useEffect(() => {
    if (!initialData && patientId) {
      fetchIntelligence();
    }
  }, [patientId, initialData, fetchIntelligence]);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await patientHistoryApi.regenerateAiSummary(patientId, { currentComplaint });
      if (res.data?.intelligence) {
        setData(res.data.intelligence);
      }
    } catch (err) {
      console.error("Error regenerating summary:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleVitalSubmit = async (e) => {
    e.preventDefault();
    try {
      setVitalSubmitting(true);
      await patientHistoryApi.recordHealthMetric(patientId, vitalForm);
      setShowLogModal(false);
      setVitalForm({
        temperature: "",
        systolicBp: "",
        diastolicBp: "",
        heartRate: "",
        spo2: "",
        bloodGlucose: "",
        plateletCount: "",
        notes: "",
      });
      // Refresh intelligence to update trends & charts
      await fetchIntelligence();
    } catch (err) {
      console.error("Failed to record metric:", err);
      alert("Failed to log parameters: " + (err.response?.data?.message || err.message));
    } finally {
      setVitalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Synthesizing Longitudinal Health Intelligence…</p>
        <span className={styles.loadingSub}>Analyzing recurring symptoms, vital slopes &amp; clinical RAG corpus</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorBox}>
        <AlertTriangle size={24} className={styles.errorIcon} />
        <div>
          <h4>Clinical Intelligence Unavailable</h4>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchIntelligence}>Retry Analysis</button>
        </div>
      </div>
    );
  }

  const symptomIntel = data?.symptom_intelligence || {};
  const paramsIntel = data?.parameters_intelligence || {};
  const summary = data?.summary || {};
  const trajectoryAlert = symptomIntel.trajectory_alert || summary.trajectory_alert;
  const timeSeries = paramsIntel.time_series_data || [];
  const compMatrix = paramsIntel.comparative_matrix || [];
  const worseningTrends = paramsIntel.worsening_trends || [];

  return (
    <div className={styles.intelligenceWrapper}>
      {/* ── HEADER ACTION BAR ── */}
      <div className={styles.topBar}>
        <div className={styles.headerInfo}>
          <div className={styles.titleBadgeRow}>
            <span className={styles.aiTag}>
              <Sparkles size={14} /> AI Longitudinal Intelligence
            </span>
            <span className={styles.statusPill}>
              {paramsIntel.latest_mews >= 3 ? (
                <span className={styles.criticalPill}>High Clinical Attention (MEWS {paramsIntel.latest_mews})</span>
              ) : (
                <span className={styles.normalPill}>Longitudinal Tracking Active</span>
              )}
            </span>
          </div>
          <h3 className={styles.sectionHeading}>
            Intelligent Health Overview &amp; Trajectory Analysis
          </h3>
          <p className={styles.sectionSubtitle}>
            Detects recurring symptoms across consultations, tracks vital trajectories &amp; flags deteriorating parameters.
          </p>
        </div>

        <div className={styles.actionBtnGroup}>
          <button
            className={styles.logVitalsBtn}
            onClick={() => setShowLogModal(true)}
            title="Record current consultation vitals"
          >
            <PlusCircle size={16} /> Log Vitals
          </button>
          <button
            className={styles.regenerateBtn}
            onClick={handleRegenerate}
            disabled={regenerating}
            title="Re-run RAG & AI synthesis"
          >
            <RefreshCw size={15} className={regenerating ? styles.spinIcon : ""} />
            {regenerating ? "Analyzing…" : "Regenerate AI"}
          </button>
        </div>
      </div>

      {/* ── 1. PROMINENT RECURRING SYMPTOM & ESCALATION TRAJECTORY ALERT ── */}
      {trajectoryAlert ? (
        <div
          className={`${styles.trajectoryAlertCard} ${
            trajectoryAlert.severity === "critical"
              ? styles.alertCritical
              : styles.alertWarning
          }`}
        >
          <div className={styles.alertHeaderRow}>
            <div className={styles.alertTitleGroup}>
              <ShieldAlert
                size={22}
                className={
                  trajectoryAlert.severity === "critical"
                    ? styles.iconCritical
                    : styles.iconWarning
                }
              />
              <div>
                <h4 className={styles.alertMainTitle}>{trajectoryAlert.title}</h4>
                <span className={styles.alertBadgeTag}>{trajectoryAlert.badge}</span>
              </div>
            </div>
            <div className={styles.severityIndicator}>
              {trajectoryAlert.severity.toUpperCase()}
            </div>
          </div>

          <p className={styles.alertSummaryText}>{trajectoryAlert.summary}</p>

          {/* Sequential Progression Chain (e.g. Visit 1: Fever -> Visit 2: Fever + Fatigue -> Visit 3: Fever + Fatigue + Joint Pain) */}
          {trajectoryAlert.progression_chain?.length > 0 && (
            <div className={styles.progressionPathwayContainer}>
              <div className={styles.pathwayLabel}>
                <Clock size={14} /> Chronological Progression Pathway:
              </div>
              <div className={styles.pathwaySteps}>
                {trajectoryAlert.progression_chain.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className={styles.pathwayStep}>
                      <span className={styles.stepNum}>{idx + 1}</span>
                      <span className={styles.stepContent}>{step}</span>
                    </div>
                    {idx < trajectoryAlert.progression_chain.length - 1 && (
                      <ArrowRight size={16} className={styles.pathwayArrow} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Clinician Action Recommendation */}
          {trajectoryAlert.doctor_action && (
            <div className={styles.doctorActionBox}>
              <strong>Recommended Clinical Action:</strong> {trajectoryAlert.doctor_action}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.stableBanner}>
          <CheckCircle2 size={18} className={styles.stableIcon} />
          <div>
            <strong>No Recurring Symptom Escalation Flagged</strong>
            <p>Reported symptoms appear isolated without multi-visit escalation patterns.</p>
          </div>
        </div>
      )}

      {/* ── 2. EXECUTIVE AI CLINICAL SUMMARY CARD ── */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <Sparkles size={18} className={styles.sparkleIcon} />
            <h4>AI-Powered Longitudinal Patient Health Summary</h4>
          </div>
          <span className={styles.timestampBadge}>
            Updated {new Date(data?.analysis_timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={styles.synopsisBox}>
          <div
            className={styles.markdownContent}
            dangerouslySetInnerHTML={{
              __html: (summary.clinical_synopsis || "")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        </div>

        {/* Worsening Parameter Alerts in Summary */}
        {worseningTrends.length > 0 && (
          <div className={styles.worseningAlertList}>
            <div className={styles.worseningHeader}>
              <TrendingDown size={16} /> Deteriorating Health Trends Identified ({worseningTrends.length})
            </div>
            <ul>
              {worseningTrends.map((trend, i) => (
                <li key={i} className={styles.worseningItem}>
                  <AlertTriangle size={13} className={styles.trendAlertDot} />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Clinical Recommendations for Attending Doctor */}
        {summary.actionable_recommendations?.length > 0 && (
          <div className={styles.recommendationsSection}>
            <h5 className={styles.recTitle}>Suggested Clinical Investigations &amp; Next Steps:</h5>
            <div className={styles.recGrid}>
              {summary.actionable_recommendations.map((rec, i) => (
                <div key={i} className={styles.recItem}>
                  <span className={styles.recNum}>{i + 1}</span>
                  <span className={styles.recText}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. TIME-SERIES HEALTH PARAMETER VISUALIZATIONS (RECHARTS) ── */}
      <div className={styles.chartSectionCard}>
        <div className={styles.chartSectionHeader}>
          <div>
            <h4><Activity size={18} /> Longitudinal Physiological Parameter Trends</h4>
            <p className={styles.chartSubtitle}>
              Continuous time-series tracking across consultation intervals. Reference lines highlight physiological thresholds.
            </p>
          </div>

          {/* Chart Category Switcher */}
          <div className={styles.chartTabs}>
            <button
              className={`${styles.chartTabBtn} ${activeChartTab === "temperature" ? styles.chartTabActive : ""}`}
              onClick={() => setActiveChartTab("temperature")}
            >
              <Thermometer size={14} /> Pyrexia &amp; Pulse
            </button>
            <button
              className={`${styles.chartTabBtn} ${activeChartTab === "cardiovascular" ? styles.chartTabActive : ""}`}
              onClick={() => setActiveChartTab("cardiovascular")}
            >
              <Heart size={14} /> Blood Pressure
            </button>
            <button
              className={`${styles.chartTabBtn} ${activeChartTab === "oxygen" ? styles.chartTabActive : ""}`}
              onClick={() => setActiveChartTab("oxygen")}
            >
              <Droplets size={14} /> SpO2 &amp; Glucose
            </button>
            <button
              className={`${styles.chartTabBtn} ${activeChartTab === "platelets" ? styles.chartTabActive : ""}`}
              onClick={() => setActiveChartTab("platelets")}
            >
              <Layers size={14} /> Hematology (Platelets)
            </button>
          </div>
        </div>

        {/* Render Graph based on tab */}
        {timeSeries.length > 0 ? (
          <div className={styles.chartContainer}>
            {activeChartTab === "temperature" && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    yAxisId="left"
                    domain={[97, 104]}
                    tick={{ fontSize: 12, fill: "#ef4444" }}
                    unit="°F"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[50, 130]}
                    tick={{ fontSize: 12, fill: "#3b82f6" }}
                    unit=" bpm"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <Legend />
                  <ReferenceLine
                    yAxisId="left"
                    y={99.5}
                    label={{ value: "Febrile Line (99.5°F)", fill: "#f59e0b", fontSize: 11 }}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={102.0}
                    label={{ value: "High Fever (102°F)", fill: "#dc2626", fontSize: 11 }}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°F)"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#tempGradient)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (bpm)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === "cardiovascular" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[50, 180]} tick={{ fontSize: 12, fill: "#64748b" }} unit=" mmHg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <Legend />
                  <ReferenceLine
                    y={130}
                    label={{ value: "Stage 1 HTN (130)", fill: "#f59e0b", fontSize: 11 }}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    y={140}
                    label={{ value: "Stage 2 HTN (140)", fill: "#ef4444", fontSize: 11 }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="systolicBp"
                    name="Systolic BP (mmHg)"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolicBp"
                    name="Diastolic BP (mmHg)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === "oxygen" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis yAxisId="left" domain={[88, 100]} unit="%" tick={{ fontSize: 12, fill: "#0ea5e9" }} />
                  <YAxis yAxisId="right" orientation="right" domain={[60, 200]} unit=" mg/dL" tick={{ fontSize: 12, fill: "#8b5cf6" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <Legend />
                  <ReferenceLine
                    yAxisId="left"
                    y={95}
                    label={{ value: "Min Optimal SpO2 (95%)", fill: "#f59e0b", fontSize: 11 }}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spo2"
                    name="SpO2 (%)"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    dot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="bloodGlucose"
                    name="Glucose (mg/dL)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === "platelets" && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeSeries} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="plateletGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[50000, 350000]} tick={{ fontSize: 12, fill: "#059669" }} unit=" /mcL" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <Legend />
                  <ReferenceLine
                    y={150000}
                    label={{ value: "Thrombocytopenia Threshold (150,000)", fill: "#ef4444", fontSize: 11 }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="plateletCount"
                    name="Platelets (/mcL)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#plateletGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className={styles.noDataBox}>
            <p>No continuous time-series recorded yet. Use the <strong>Log Vitals</strong> button above to record parameters.</p>
          </div>
        )}
      </div>

      {/* ── 4. COMPARATIVE HEALTH PARAMETERS MATRIX (Current vs Previous vs Baseline) ── */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixHeader}>
          <h4><Sliders size={18} /> Comparative Health Parameters Matrix</h4>
          <span className={styles.matrixSub}>Delta (Δ) &amp; Percentage change vs previous consultation visit</span>
        </div>

        {compMatrix.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Health Parameter</th>
                  <th>Current Visit</th>
                  <th>Previous Visit</th>
                  <th>Baseline</th>
                  <th>Δ Difference</th>
                  <th>Status</th>
                  <th>Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {compMatrix.map((row, idx) => (
                  <tr key={idx} className={row.status === "critical" ? styles.rowCritical : row.status === "deteriorating" ? styles.rowWarning : ""}>
                    <td className={styles.paramNameCell}>
                      <strong>{row.name}</strong>
                      <span className={styles.paramUnit}>({row.unit})</span>
                    </td>
                    <td className={styles.valueCell}>
                      <span className={styles.currentVal}>{row.current}</span>
                    </td>
                    <td className={styles.prevCell}>{row.previous ?? "—"}</td>
                    <td className={styles.baseCell}>{row.baseline ?? "—"}</td>
                    <td className={styles.deltaCell}>
                      {row.delta !== 0 ? (
                        <span className={row.delta > 0 ? styles.deltaPositive : styles.deltaNegative}>
                          {row.delta > 0 ? `+${row.delta}` : row.delta} {row.unit}
                          {row.pct_change ? ` (${row.pct_change > 0 ? "+" : ""}${row.pct_change}%)` : ""}
                        </span>
                      ) : (
                        <span className={styles.deltaNeutral}>0.0 (Stable)</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          row.status === "critical"
                            ? styles.badgeCritical
                            : row.status === "deteriorating"
                            ? styles.badgeWarning
                            : row.status === "elevated"
                            ? styles.badgeElevated
                            : styles.badgeNormal
                        }`}
                      >
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.interpCell}>{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.mutedText}>No comparative vital data available yet.</p>
        )}
      </div>

      {/* ── 5. QUICK VITALS LOGGING MODAL ── */}
      {showLogModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLogModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>Record Patient Health Parameters</h4>
              <button className={styles.closeBtn} onClick={() => setShowLogModal(false)}>×</button>
            </div>
            <form onSubmit={handleVitalSubmit} className={styles.vitalForm}>
              <p className={styles.formNote}>
                Add vital signs to track health progression and immediately update time-series trend analysis.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 101.4"
                    value={vitalForm.temperature}
                    onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Heart Rate (bpm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 88"
                    value={vitalForm.heartRate}
                    onChange={(e) => setVitalForm({ ...vitalForm, heartRate: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 135"
                    value={vitalForm.systolicBp}
                    onChange={(e) => setVitalForm({ ...vitalForm, systolicBp: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 86"
                    value={vitalForm.diastolicBp}
                    onChange={(e) => setVitalForm({ ...vitalForm, diastolicBp: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 96"
                    value={vitalForm.spo2}
                    onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Platelets (/mcL)</label>
                  <input
                    type="number"
                    placeholder="e.g. 140000"
                    value={vitalForm.plateletCount}
                    onChange={(e) => setVitalForm({ ...vitalForm, plateletCount: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    placeholder="e.g. 110"
                    value={vitalForm.bloodGlucose}
                    onChange={(e) => setVitalForm({ ...vitalForm, bloodGlucose: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label>Clinical Notes</label>
                <textarea
                  placeholder="Additional vital signs observations or symptoms..."
                  rows={2}
                  value={vitalForm.notes}
                  onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={vitalSubmitting}
                >
                  {vitalSubmitting ? "Saving…" : "Save Parameters"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

