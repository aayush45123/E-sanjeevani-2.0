import React, { useEffect, useState } from "react";
import {
  FiLoader,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import { authApi, analyticsApi } from "../../utils/api";
import styles from "./DoctorAnalytics.module.css";
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
} from "recharts";

export default function DoctorAnalytics({ isProfileIncomplete = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analyticsData, setAnalyticsData] = useState({
    stats: { total: 0, completed: 0, cancelled: 0, ongoing: 0 },
    trend: [],
    modalities: [],
    peakHours: [],
    demographics: { gender: [], age: [] },
    retention: { new: 0, returning: 0 }
  });

  const MODALITY_COLORS = ["#3b82f6", "#10b981", "#8b5cf6"]; // Blue, Green, Purple
  const GENDER_COLORS = ["#2563eb", "#ec4899", "#8b5cf6"];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch user
        const userRes = await authApi.me();
        const userData = userRes.data.user || userRes.data;
        setUser(userData);

        // Fetch advanced analytics from new backend endpoint
        const analyticsRes = await analyticsApi.getDoctorAnalytics();
        setAnalyticsData(analyticsRes.data.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Custom Tooltip for Area/Bar Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <div className={styles.tooltipData}>
            {payload.map((entry, index) => (
              <div key={index} className={styles.tooltipItem}>
                <div
                  className={styles.tooltipDot}
                  style={{ backgroundColor: entry.color }}
                />
                <span>
                  {entry.name === "total" || entry.name === "consultations"
                    ? "Consultations"
                    : entry.name === "completed"
                      ? "Completed"
                      : entry.name}
                  : {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.analyticsLayout}>
        <DoctorSidebar user={user} isProfileIncomplete={isProfileIncomplete} />
        <div className={styles.loadingContainer}>
          <FiLoader className={styles.spinner} size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analyticsLayout}>
        <DoctorSidebar user={user} isProfileIncomplete={isProfileIncomplete} />
        <div className={styles.mainContent}>
          <div className={styles.emptyState}>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { stats, trend, modalities, peakHours, demographics, retention } = analyticsData;

  // Calculate completion rate safely
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className={styles.analyticsLayout}>
      <DoctorSidebar user={user} isProfileIncomplete={isProfileIncomplete} />

      <main className={styles.mainContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Analytics Overview</h1>
            <p className={styles.pageSubtitle}>Advanced insights and performance metrics.</p>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Total Consultations</h3>
              <FiCalendar className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{stats.total}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Completed</h3>
              <FiCheckCircle className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{stats.completed}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Completion Rate</h3>
              <FiTrendingUp className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{completionRate}%</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Ongoing / Active</h3>
              <FiClock className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{stats.ongoing}</p>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>New Patients</h3>
              <FiClock className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{retention?.new || 0}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <h3 className={styles.statTitle}>Returning Patients</h3>
              <FiCheckCircle className={styles.statIcon} size={20} />
            </div>
            <p className={styles.statValue}>{retention?.returning || 0}</p>
          </div>
        </div>

        {/* Main Charts Area */}
        <div className={styles.chartsGrid}>
          {/* Trend Chart (Area) */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Consultation Volume (30 Days)</div>
              <div className={styles.cardSubtitle}>
                Total vs Completed consultations over time.
              </div>
            </div>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <CartesianGrid
                    vertical={false}
                    stroke="#f3f4f6"
                    strokeDasharray="3 3"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#111827"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Modality Pie Chart */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Consultation Modality</div>
              <div className={styles.cardSubtitle}>Video vs Audio vs Chat</div>
            </div>
            <div className={styles.chartBody}>
              {modalities.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modalities}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {modalities.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MODALITY_COLORS[index % MODALITY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.chartsGrid} style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: "22px" }}>
          {/* Peak Hours Chart */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Peak Consultation Hours</div>
              <div className={styles.cardSubtitle}>Busiest times of day.</div>
            </div>
            <div className={styles.chartBody}>
              {peakHours && peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={peakHours}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#f3f4f6"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="consultations"
                      fill="#111827"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Age Distribution Chart */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Age Distribution</div>
              <div className={styles.cardSubtitle}>Patient age brackets</div>
            </div>
            <div className={styles.chartBody}>
              {demographics && demographics.age && demographics.age.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demographics.age}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#f3f4f6"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Gender Demographics Chart */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Gender Demographics</div>
              <div className={styles.cardSubtitle}>Patient gender breakdown</div>
            </div>
            <div className={styles.chartBody}>
              {demographics && demographics.gender && demographics.gender.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographics.gender}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {demographics.gender.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
