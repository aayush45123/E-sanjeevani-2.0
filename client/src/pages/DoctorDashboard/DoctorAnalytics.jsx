import React, { useEffect, useState } from "react";
import {
  FiLoader,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiVideo,
  FiPhone,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorAnalytics.module.css";
import { authApi, consultationApi } from "../../utils/api";

export default function DoctorAnalytics({ isProfileIncomplete = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Analytics State
  const [stats, setStats] = useState({
    totalConsultations: 0,
    uniquePatients: 0,
    completedSessions: 0,
    totalHours: 0,
    videoCount: 0,
    audioCount: 0,
  });

  const [monthlyTrend, setMonthlyTrend] = useState([]);

  /*
  ==================================================
  FETCH DATA
  ==================================================
  */

  useEffect(() => {
    async function init() {
      try {
        const userRes = await authApi.me();
        const doctorData = userRes.data.user || userRes.data;
        setUser(doctorData);

        const consultationRes = await consultationApi.getDoctorConsultations();
        const allConsultations = consultationRes.data.consultations || [];

        calculateAnalytics(allConsultations);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /*
  ==================================================
  CALCULATIONS
  ==================================================
  */

  const calculateAnalytics = (data) => {
    // 1. Basic Counts
    const totalConsultations = data.length;
    
    const uniquePatients = new Set(
      data.filter((item) => item.patient?._id).map((item) => item.patient._id),
    ).size;

    const completedSessions = data.filter((item) => item.status === "completed").length;
    
    // Assuming 30 mins per session
    const totalHours = (completedSessions * 30) / 60;

    // 2. Modality Breakdown
    const videoCount = data.filter((item) => item.consultationType === "video").length;
    const audioCount = data.filter((item) => item.consultationType === "call").length;

    // 3. Monthly Trend (Last 6 Months)
    const trend = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      trend.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
      });
    }

    data.forEach((c) => {
      const dateField = c.consultationDate || c.createdAt || c.date;
      if (!dateField) return;

      const d = new Date(dateField);
      if (isNaN(d)) return;

      const bucket = trend.find((t) => t.month === d.getMonth() && t.year === d.getFullYear());
      if (bucket) {
        bucket.count++;
      }
    });

    setStats({
      totalConsultations,
      uniquePatients,
      completedSessions,
      totalHours,
      videoCount,
      audioCount,
    });

    setMonthlyTrend(trend);
  };

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.href = "/auth";
  };

  /*
  ==================================================
  HELPERS
  ==================================================
  */

  const firstName = user?.name?.split(" ")[0] || "Doctor";
  
  // Calculate completion rate
  const completionRate = stats.totalConsultations > 0 
    ? Math.round((stats.completedSessions / stats.totalConsultations) * 100) 
    : 0;

  // Modality percentages
  const totalModality = stats.videoCount + stats.audioCount || 1; // prevent divide by zero
  const videoPercent = Math.round((stats.videoCount / totalModality) * 100);
  const audioPercent = Math.round((stats.audioCount / totalModality) * 100);

  // Get max height for trend chart to calculate percentages
  const maxTrend = Math.max(...monthlyTrend.map(t => t.count), 1);

  /*
  ==================================================
  LOADING STATE
  ==================================================
  */

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} size={24} />
      </div>
    );
  }

  return (
    <div className={styles.analyticsLayout}>
      <DoctorSidebar
        user={user}
        onLogout={handleLogout}
        isProfileIncomplete={isProfileIncomplete}
      />

      <main className={styles.mainContent}>
        {/* HEADER */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Analytics Overview</h1>
            <p className={styles.pageSubtitle}>
              Performance and consultation metrics for Dr. {firstName}
            </p>
          </div>
        </header>

        <div className={styles.contentGrid}>
          {/* STATS ROW */}
          <section className={styles.statsRow}>
            <StatCard
              icon={FiFileText}
              label="Total Consultations"
              value={stats.totalConsultations}
              trend="all-time"
            />
            <StatCard
              icon={FiUsers}
              label="Unique Patients"
              value={stats.uniquePatients}
              trend="all-time"
            />
            <StatCard
              icon={FiCheckCircle}
              label="Completion Rate"
              value={`${completionRate}%`}
              trend={completionRate > 50 ? "up" : completionRate > 0 ? "down" : "neutral"}
            />
            <StatCard
              icon={FiClock}
              label="Consultation Hours"
              value={`${stats.totalHours}h`}
              trend="completed only"
            />
          </section>

          {/* CHARTS GRID */}
          <div className={styles.chartsGrid}>
            
            {/* MONTHLY TREND CHART */}
            <section className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <FiBarChart2 className={styles.cardIcon} />
                    Consultation Volume
                  </h2>
                  <p className={styles.cardSubtitle}>Last 6 months activity</p>
                </div>
              </div>

              <div className={styles.chartBody}>
                {monthlyTrend.length > 0 ? (
                  monthlyTrend.map((month, idx) => {
                    const heightPercent = Math.max((month.count / maxTrend) * 100, 5); // min 5% for visibility
                    return (
                      <div key={idx} className={styles.monthBarGroup}>
                        <div className={styles.monthBarTrack}>
                          <div 
                            className={styles.monthBarFill} 
                            style={{ height: `${month.count === 0 ? 0 : heightPercent}%` }}
                          />
                          <span className={styles.monthValue}>{month.count}</span>
                        </div>
                        <span className={styles.monthLabel}>{month.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>
                    <FiBarChart2 size={32} className={styles.emptyIcon} />
                    <p>No consultation data available</p>
                  </div>
                )}
              </div>
            </section>

            {/* MODALITY & SUMMARY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              <section className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Consultation Type</h2>
                </div>

                <div className={styles.modalityBody}>
                  {/* Video */}
                  <div className={styles.modalityItem}>
                    <div className={styles.modalityHeader}>
                      <span className={`${styles.modalityType} ${styles.video}`}>
                        <FiVideo /> Video Calls
                      </span>
                      <span className={styles.modalityCount}>{videoPercent}%</span>
                    </div>
                    <div className={styles.modalityTrack}>
                      <div 
                        className={`${styles.modalityFill} ${styles.video}`} 
                        style={{ width: `${videoPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Audio */}
                  <div className={styles.modalityItem}>
                    <div className={styles.modalityHeader}>
                      <span className={`${styles.modalityType} ${styles.audio}`}>
                        <FiPhone /> Audio Calls
                      </span>
                      <span className={styles.modalityCount}>{audioPercent}%</span>
                    </div>
                    <div className={styles.modalityTrack}>
                      <div 
                        className={`${styles.modalityFill} ${styles.audio}`} 
                        style={{ width: `${audioPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Performance Summary</h2>
                </div>
                <div className={styles.performanceGrid}>
                   <div className={styles.perfMetric}>
                     <span className={styles.perfLabel}>Total Bookings</span>
                     <span className={styles.perfValue}>{stats.totalConsultations}</span>
                   </div>
                   <div className={styles.perfMetric}>
                     <span className={styles.perfLabel}>Successful</span>
                     <span className={styles.perfValue} style={{ color: '#059669' }}>
                       {stats.completedSessions}
                     </span>
                   </div>
                   <div className={styles.perfMetric}>
                     <span className={styles.perfLabel}>Cancelled/No-show</span>
                     <span className={styles.perfValue} style={{ color: '#dc2626' }}>
                       {stats.totalConsultations - stats.completedSessions}
                     </span>
                   </div>
                   <div className={styles.perfMetric}>
                     <span className={styles.perfLabel}>Patient Retention</span>
                     <span className={styles.perfValue}>
                       {stats.totalConsultations > 0 && stats.uniquePatients > 0 
                         ? ((stats.totalConsultations / stats.uniquePatients)).toFixed(1) 
                         : 0}x
                     </span>
                   </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/*
==================================================
STAT CARD COMPONENT
==================================================
*/

function StatCard({ icon: Icon, label, value, trend }) {
  const getTrendIcon = () => {
    if (trend === "up") return <FiTrendingUp className={styles.trendUp} />;
    if (trend === "down") return <FiTrendingDown className={styles.trendDown} />;
    return <FiMinus className={styles.trendNeutral} />;
  };

  const isLiteral = ["all-time", "completed only"].includes(trend);

  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIconWrapper}>
          <Icon size={16} />
        </div>
        {!isLiteral && (
          <div className={styles.statTrend}>
            {getTrendIcon()}
          </div>
        )}
      </div>

      <div>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
        {isLiteral && (
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', marginBottom: 0 }}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
