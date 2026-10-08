import React, { useEffect, useState } from "react";
import { DoctorAnalyticsSkeleton } from "../../components/Skeletons";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiAlertTriangle,
  FiFileText,
  FiActivity,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import { authApi, analyticsApi } from "../../utils/api";
import styles from "./DoctorAnalytics.module.css";
import { performLogout } from "../../utils/auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function DoctorAnalytics({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // 7 or 30 days

  const [analyticsData, setAnalyticsData] = useState({
    stats: {
      total: 0,
      completed: 0,
      cancelled: 0,
      ongoing: 0,
      scheduled: 0,
      todayConsultations: 0,
      thisWeekConsultations: 0,
      thisMonthConsultations: 0,
    },
    trend: [],
    modalities: [],
    peakHours: [],
    demographics: { gender: [], age: [] },
    retention: { new: 0, returning: 0, firstTime: 0 },
    followUps: [],
    triage: { distribution: [], urgentPatients: [] },
    diseases: { diagnosedConditions: [], predictedConditions: [] },
    prescriptions: {
      prescriptions: { total: 0, active: 0, amended: 0, draft: 0 },
      medications: { active: 0, completed: 0, discontinued: 0 },
    },
    summaryCards: {},
  });

  const MODALITY_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
  const GENDER_COLORS = ["#2563eb", "#ec4899", "#8b5cf6"];
  const TRIAGE_COLORS = ["#ef4444", "#f59e0b", "#10b981"]; // Critical, Moderate, Low

  const handleLogout = () => performLogout();

  const fetchAnalytics = async (rangeDays = timeRange) => {
    try {
      setLoading(true);

      const [userRes, analyticsRes] = await Promise.all([
        authApi.me().catch((err) => {
          if (err.status === 401 || err.response?.status === 401) {
            performLogout();
          }
          return null;
        }),
        analyticsApi.getDoctorAnalytics({ range: rangeDays }).catch((err) => {
          console.error("Failed to fetch analytics:", err);
          return { data: { data: null } };
        }),
      ]);

      if (userRes?.data) {
        const userData = userRes.data.user || userRes.data;
        setUser(userData);
      }

      if (analyticsRes?.data?.data) {
        setAnalyticsData((prev) => ({
          ...prev,
          ...analyticsRes.data.data,
        }));
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label, unit = "consultations" }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <div className={styles.tooltipData}>
            {payload.map((entry, index) => {
              let entryName = entry.name;
              if (entryName === "total") entryName = "Total Booked";
              if (entryName === "completed") entryName = "Completed";
              if (entryName === "consultations") entryName = "Consultations";
              if (entryName === "value") entryName = "Count";

              return (
                <div key={index} className={styles.tooltipItem}>
                  <div
                    className={styles.tooltipDot}
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span>
                    <strong>{entryName}:</strong> {entry.value} {unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && !analyticsData.trend.length) {
    return <DoctorAnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.analyticsLayout}>
        <DoctorSidebar
          user={user}
          isProfileIncomplete={isProfileIncomplete}
          onLogout={handleLogout}
        />
        <div className={styles.mainContent}>
          <div className={styles.emptyState}>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    stats,
    trend,
    modalities,
    peakHours,
    demographics,
    retention,
    triage,
    diseases,
    prescriptions: rxStats,
    followUps,
  } = analyticsData;

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className={styles.analyticsLayout}>
      <DoctorSidebar
        user={user}
        isProfileIncomplete={isProfileIncomplete}
        onLogout={handleLogout}
      />

      <main className={styles.mainContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Clinical & Practice Analytics</h1>
            <p className={styles.pageSubtitle}>
              Actionable clinical workload, triage, disease patterns, and patient follow-up metrics.
            </p>
          </div>

          {/* Time Range Switcher */}
          <div className={styles.rangeToggle}>
            <button
              type="button"
              className={`${styles.rangeBtn} ${
                timeRange === 7 ? styles.rangeBtnActive : ""
              }`}
              onClick={() => setTimeRange(7)}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`${styles.rangeBtn} ${
                timeRange === 30 ? styles.rangeBtnActive : ""
              }`}
              onClick={() => setTimeRange(30)}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Top Summary Cards */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Total Consultations</h3>
                <FiCalendar className={styles.statIcon} size={20} />
              </div>
              <p className={styles.statValue}>{stats.total}</p>
              <p className={styles.statSubtitle}>All time recorded</p>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Completed Visits</h3>
                <FiCheckCircle className={styles.statIcon} size={20} />
              </div>
              <p className={styles.statValue}>{stats.completed}</p>
              <p className={styles.statSubtitle}>{completionRate}% completion rate</p>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>First-Time Patients</h3>
                <FiUsers className={styles.statIcon} size={20} />
              </div>
              <p className={styles.statValue}>{retention?.firstTime || retention?.new || 0}</p>
              <p className={styles.statSubtitle}>Single-visit consultations</p>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3 className={styles.statTitle}>Returning Patients</h3>
                <FiTrendingUp className={styles.statIcon} size={20} />
              </div>
              <p className={styles.statValue}>{retention?.returning || 0}</p>
              <p className={styles.statSubtitle}>Multi-visit consultations</p>
            </div>
          </div>

          {/* Chart Section 1: Consultation Volume Over Time */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>
                  Consultations Over Time ({timeRange} Days)
                </div>
                <div className={styles.cardSubtitle}>
                  Daily volume of scheduled vs completed consultations
                </div>
              </div>
            </div>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={trend}
                  margin={{ top: 20, right: 25, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="displayDate"
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={8}
                    label={{
                      value: "Date",
                      position: "insideBottom",
                      offset: -12,
                      fill: "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    allowDecimals={false}
                    label={{
                      value: "Consultations",
                      angle: -90,
                      position: "insideLeft",
                      offset: 0,
                      fill: "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip unit="consultations" />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: "10px", fontSize: "13px" }}
                  />
                  <Area
                    type="monotone"
                    name="Total Scheduled"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    name="Completed"
                    dataKey="completed"
                    stroke="#0ea5a4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className={styles.chartAxisNotes}>
                <span>X-axis: Timeline (Day/Month)</span>
                <span>Y-axis: Number of Consultations</span>
              </div>
            </div>
          </div>

          {/* Chart Section 2: Clinical Urgency & Disease Conditions */}
          <div className={styles.chartsGrid}>
            {/* Triage Urgency Distribution */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Patient Triage Distribution</div>
                  <div className={styles.cardSubtitle}>
                    Clinical urgency severity scored across patient cohort
                  </div>
                </div>
              </div>
              <div className={styles.chartBody}>
                {triage?.distribution && triage.distribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={triage.distribution}
                      margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={6}
                        label={{
                          value: "Urgency Category",
                          position: "insideBottom",
                          offset: -12,
                          fill: "#475569",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                      <YAxis
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        allowDecimals={false}
                        label={{
                          value: "Patients",
                          angle: -90,
                          position: "insideLeft",
                          offset: 0,
                          fill: "#475569",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                      <Tooltip content={<CustomTooltip unit="patients" />} />
                      <Bar
                        dataKey="count"
                        name="Patients"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                      >
                        {triage.distribution.map((entry, index) => (
                          <Cell
                            key={`triage-cell-${index}`}
                            fill={TRIAGE_COLORS[index % TRIAGE_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No triage assessment records recorded yet.</p>
                  </div>
                )}
                <div className={styles.chartAxisNotes}>
                  <span>X-axis: Urgency Level</span>
                  <span>Y-axis: Number of Patients</span>
                </div>
              </div>
            </div>

            {/* Consultation Modality Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Consultation Modality Breakdown</div>
                  <div className={styles.cardSubtitle}>
                    Distribution of Video vs Audio vs In-person sessions
                  </div>
                </div>
              </div>
              <div className={styles.chartBody}>
                {modalities && modalities.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={modalities}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {modalities.map((entry, index) => (
                          <Cell
                            key={`modality-${index}`}
                            fill={MODALITY_COLORS[index % MODALITY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip unit="consultations" />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No modality data available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Disease / Condition Distribution Section */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>
                  Patient Disease & Condition Distribution
                </div>
                <div className={styles.cardSubtitle}>
                  Confirmed clinical diagnoses compared with AI-assisted triage predictions
                </div>
              </div>
            </div>

            <div className={styles.diseaseSectionGrid}>
              {/* Confirmed Diagnoses */}
              <div className={styles.diseaseSubCard}>
                <h4 className={styles.diseaseSubTitle}>
                  <FiFileText color="#059669" /> Confirmed Clinical Diagnoses
                </h4>
                <p className={styles.diseaseSubNote}>
                  Verified by doctor through issued medical prescriptions
                </p>

                {diseases?.diagnosedConditions &&
                diseases.diagnosedConditions.length > 0 ? (
                  <div className={styles.diseaseList}>
                    {diseases.diagnosedConditions.map((d, idx) => (
                      <div key={idx} className={styles.diseaseItem}>
                        <span>{d.name}</span>
                        <span className={styles.diseaseCountBadge}>
                          {d.count} {d.count === 1 ? "case" : "cases"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    No confirmed prescription diagnoses recorded yet.
                  </p>
                )}
              </div>

              {/* AI-Predicted Conditions */}
              <div className={styles.diseaseSubCard}>
                <h4 className={styles.diseaseSubTitle}>
                  <FiActivity color="#2563eb" /> AI-Predicted Conditions
                </h4>
                <p className={styles.diseaseSubNote}>
                  Screened during pre-consultation patient triage assessment
                </p>

                {diseases?.predictedConditions &&
                diseases.predictedConditions.length > 0 ? (
                  <div className={styles.diseaseList}>
                    {diseases.predictedConditions.map((p, idx) => (
                      <div key={idx} className={styles.diseaseItem}>
                        <span>{p.name}</span>
                        <span className={styles.diseaseCountBadge}>
                          {p.count} {p.count === 1 ? "patient" : "patients"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    No AI triage predictions recorded for your patients yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Prescription & Medication Status */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>
                  Prescription & Medication Management
                </div>
                <div className={styles.cardSubtitle}>
                  Prescription issuance status and medication treatment courses
                </div>
              </div>
            </div>

            <div className={styles.rxStatsGrid}>
              <div className={styles.rxMiniCard}>
                <div className={styles.rxMiniVal}>
                  {rxStats?.prescriptions?.active || 0}
                </div>
                <div className={styles.rxMiniLabel}>Finalized Prescriptions</div>
              </div>

              <div className={styles.rxMiniCard}>
                <div className={styles.rxMiniVal}>
                  {rxStats?.prescriptions?.amended || 0}
                </div>
                <div className={styles.rxMiniLabel}>Amended Prescriptions</div>
              </div>

              <div className={styles.rxMiniCard}>
                <div className={styles.rxMiniVal} style={{ color: "#059669" }}>
                  {rxStats?.medications?.active || 0}
                </div>
                <div className={styles.rxMiniLabel}>Active Medications</div>
              </div>

              <div className={styles.rxMiniCard}>
                <div className={styles.rxMiniVal} style={{ color: "#dc2626" }}>
                  {rxStats?.medications?.discontinued || 0}
                </div>
                <div className={styles.rxMiniLabel}>Discontinued Medications</div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Peak Hours & Demographics */}
          <div
            className={styles.chartsGrid}
            style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
          >
            {/* Peak Hours Chart */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Peak Consultation Hours</div>
                <div className={styles.cardSubtitle}>Busiest hours of the day</div>
              </div>
              <div className={styles.chartBody}>
                {peakHours && peakHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={peakHours}
                      margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        dy={6}
                        label={{
                          value: "Hour (24h)",
                          position: "insideBottom",
                          offset: -12,
                          fill: "#475569",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                      <YAxis
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip unit="consultations" />} />
                      <Bar
                        dataKey="consultations"
                        name="Consultations"
                        fill="#0ea5a4"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No activity recorded yet</p>
                  </div>
                )}
                <div className={styles.chartAxisNotes}>
                  <span>X-axis: Hour of Day</span>
                  <span>Y-axis: Consultations</span>
                </div>
              </div>
            </div>

            {/* Age Distribution Chart */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Patient Age Brackets</div>
                <div className={styles.cardSubtitle}>Demographic age cohorts</div>
              </div>
              <div className={styles.chartBody}>
                {demographics?.age && demographics.age.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={demographics.age}
                      margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        dy={6}
                        label={{
                          value: "Age Group",
                          position: "insideBottom",
                          offset: -12,
                          fill: "#475569",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                      <YAxis
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip unit="patients" />} />
                      <Bar
                        dataKey="value"
                        name="Patients"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No demographic data available</p>
                  </div>
                )}
                <div className={styles.chartAxisNotes}>
                  <span>X-axis: Age Group (Years)</span>
                  <span>Y-axis: Patients</span>
                </div>
              </div>
            </div>

            {/* Gender Demographics Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Gender Demographics</div>
                <div className={styles.cardSubtitle}>Patient gender representation</div>
              </div>
              <div className={styles.chartBody}>
                {demographics?.gender && demographics.gender.some((g) => g.value > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={demographics.gender}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {demographics.gender.map((entry, index) => (
                          <Cell
                            key={`gender-cell-${index}`}
                            fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip unit="patients" />} />
                      <Legend verticalAlign="bottom" height={32} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No gender data recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
