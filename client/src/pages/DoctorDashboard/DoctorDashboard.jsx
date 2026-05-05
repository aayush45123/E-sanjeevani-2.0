import React, { useEffect, useState } from "react";
import {
  FiLoader,
  FiUsers,
  FiCalendar,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiVideo,
  FiPhone,
  FiChevronRight,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import io from "socket.io-client";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import NotificationService from "../../utils/notificationService";
import { useNavigate } from "react-router-dom";
import styles from "./DoctorDashboard.module.css";
import { authApi, consultationApi } from "../../utils/api";

export default function DoctorDashboard({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [weeklyData, setWeeklyData] = useState([10, 10, 10, 10, 10, 10, 10]);
  const [consultationCounts, setConsultationCounts] = useState([
    0, 0, 0, 0, 0, 0, 0,
  ]);

  const [stats, setStats] = useState({
    totalPatients: 0,
    todayConsultations: 0,
    completedToday: 0,
    completedSessions: 0,
    avgRating: 4.8,
  });

  /*
  ==================================================
  FETCH LOGGED IN DOCTOR + CONSULTATIONS
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

        setConsultations(allConsultations);

        calculateStats(allConsultations);
      } catch (err) {
        console.error(err);

        if (err.status === 401 || err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("user");
          localStorage.removeItem("userId");

          window.location.href = "/auth";
        }
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // ── Socket listener for consultation notifications ───────────────────────
  useEffect(() => {
    const SOCKET_URL = "http://localhost:5000";
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on(
      "participant-waiting",
      ({ waitingUserRole, waitingUserName, message }) => {
        console.log(`⏳ ${message}`);
        const roleText = waitingUserRole === "doctor" ? "Dr." : "Patient";
        NotificationService.showToast(
          `⏳ ${roleText} ${waitingUserName} is waiting for you to join the consultation!`,
          "warning",
        );
        // Play alert sound
        NotificationService.playSound("alert");
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
  ==================================================
  CALCULATE DASHBOARD STATS
  ==================================================
  */

  const calculateStats = (data) => {
    const uniquePatients = new Set(
      data.filter((item) => item.patient?._id).map((item) => item.patient._id),
    );

    const today = new Date().toDateString();

    const todayList = data.filter(
      (item) => new Date(item.consultationDate).toDateString() === today,
    );
    const todayConsultations = todayList.length;

    const completedToday = todayList.filter(
      (item) => item.status === "completed",
    ).length;

    const completedSessions = data.filter(
      (item) => item.status === "completed",
    ).length;

    // Calculate weekly overview data (Mon-Sat)
    calculateWeeklyData(data);

    setStats({
      totalPatients: uniquePatients.size,
      todayConsultations,
      completedToday,
      completedSessions,
      avgRating: 4.8,
    });
  };

  const calculateWeeklyData = (data) => {
    // Debug: Log consultations
    console.log("Total consultations:", data.length);
    console.log("Sample consultation:", data[0]);

    // Get last 7 days (including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 7 days including today

    console.log("Date range - From:", sevenDaysAgo, "To:", today);

    // Days to track (last 7 days)
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dayLabels.push(date.toLocaleDateString("en-IN", { weekday: "short" }));
    }

    const consultationCounts = [0, 0, 0, 0, 0, 0, 0];

    // Process each consultation
    data.forEach((consultation, idx) => {
      // Try multiple field names for date
      const dateField =
        consultation.consultationDate ||
        consultation.createdAt ||
        consultation.date ||
        consultation.appointmentDate;

      if (!dateField) {
        console.log(`Consultation ${idx} has no date field:`, consultation);
        return;
      }

      try {
        const consultationDate = new Date(dateField);
        consultationDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor(
          (consultationDate - sevenDaysAgo) / (1000 * 60 * 60 * 24),
        );

        console.log(
          `Consultation ${idx}: Date=${consultationDate.toDateString()}, DayDiff=${dayDiff}`,
        );

        if (dayDiff >= 0 && dayDiff < 7) {
          consultationCounts[dayDiff]++;
        }
      } catch (err) {
        console.error(`Error parsing date for consultation ${idx}:`, err);
      }
    });

    console.log(
      "Consultation counts by day:",
      consultationCounts,
      "Labels:",
      dayLabels,
    );

    // Calculate heights (0-100%) with better scaling
    const maxCount = Math.max(...consultationCounts, 1);
    const heights = consultationCounts.map((count) => {
      const percentage = (count / maxCount) * 100;
      return Math.max(percentage, 10);
    });

    console.log("Heights:", heights);

    setConsultationCounts(consultationCounts);
    setWeeklyData(heights);
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

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const recentPatients = showAllPatients
    ? consultations
    : consultations.slice(0, 5);

  const handleViewAllPatients = () => {
    setShowAllPatients(!showAllPatients);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "#dbeafe",
      "#fce7f3",
      "#fef3c7",
      "#d1fae5",
      "#e0e7ff",
      "#ffedd5",
    ];
    const textColors = [
      "#1e40af",
      "#be185d",
      "#b45309",
      "#047857",
      "#4338ca",
      "#c2410c",
    ];
    let hash = 0;
    const safeName = name || "Patient";
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return { bg: colors[index], text: textColors[index] };
  };

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FiLoader className={styles.spinner} size={24} />
      </div>
    );
  }

  const progressPercent =
    stats.todayConsultations > 0
      ? (stats.completedToday / stats.todayConsultations) * 100
      : 0;

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar
        user={user}
        onLogout={handleLogout}
        isProfileIncomplete={isProfileIncomplete}
      />

      <main className={styles.mainContent}>
        {/* HEADER */}

        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              Good morning, Dr. {firstName} 👋
            </h1>

            <p className={styles.pageSubtitle}>{todayFormatted}</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.progressTextRow}>
              <span className={styles.progressLabel}>Today's Progress</span>
              <span className={styles.progressCount}>
                {stats.completedToday} / {stats.todayConsultations}
              </span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className={styles.contentGrid}>
          {/* STATS */}

          <section className={styles.statsRow}>
            <StatCard
              icon={FiUsers}
              iconColor="#2563eb"
              iconBg="#eff6ff"
              label="Total Patients"
              value={stats.totalPatients}
              trend="Dynamic from database"
            />

            <StatCard
              icon={FiCalendar}
              iconColor="#059669"
              iconBg="#f0fdf4"
              label="Today's Consultations"
              value={stats.todayConsultations}
              trend="Today's bookings"
            />

            <StatCard
              icon={FiStar}
              iconColor="#d97706"
              iconBg="#fffbeb"
              label="Average Rating"
              value={stats.avgRating}
              trend="Professional score"
            />

            <StatCard
              icon={FiCheckCircle}
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              label="Completed Sessions"
              value={stats.completedSessions}
              trend="Completed consultations"
            />
          </section>

          <div className={styles.mainGrid}>
            {/* TODAY SCHEDULE */}

            <section className={styles.scheduleCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <FiClock size={16} className={styles.cardIcon} />
                  <h2 className={styles.cardTitle}>Today's Schedule</h2>
                </div>

                <span className={styles.badge}>
                  {consultations.length} appointments
                </span>
              </div>

              <div className={styles.appointmentList}>
                {consultations.length === 0 ? (
                  <div className={styles.emptyState}>No appointments found</div>
                ) : (
                  [...consultations]
                    .sort((a, b) => {
                      // Scheduled first, then others
                      if (a.status === "scheduled" && b.status !== "scheduled")
                        return -1;
                      if (a.status !== "scheduled" && b.status === "scheduled")
                        return 1;
                      // Within same status, sort by date (newer first)
                      return (
                        new Date(b.consultationDate) -
                        new Date(a.consultationDate)
                      );
                    })
                    .map((appt) => (
                      <AppointmentRow
                        key={appt._id}
                        appt={appt}
                        avatarColor={getAvatarColor(appt.patient?.name)}
                      />
                    ))
                )}
              </div>
            </section>

            {/* RIGHT COLUMN */}

            <div className={styles.rightCol}>
              {/* WEEKLY OVERVIEW */}

              <section className={styles.quickCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleGroup}>
                    <FiTrendingUp size={16} className={styles.cardIcon} />
                    <h2 className={styles.cardTitle}>Weekly Overview</h2>
                  </div>
                </div>

                <div className={styles.weeklyBars}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day, i) => {
                      const hasConsultations = consultationCounts[i] > 0;
                      return (
                        <div
                          key={day + i}
                          className={styles.barGroup}
                          style={{
                            opacity: hasConsultations ? 1 : 0.3,
                            pointerEvents: hasConsultations ? "auto" : "none",
                          }}
                        >
                          {hasConsultations && (
                            <span className={styles.countLabel}>
                              {consultationCounts[i]}
                            </span>
                          )}
                          <div className={styles.barTrack}>
                            <div
                              className={styles.bar}
                              style={{
                                height: `${hasConsultations ? weeklyData[i] : 0}%`,
                              }}
                              title={
                                hasConsultations
                                  ? `${consultationCounts[i]} consultations`
                                  : "No consultations"
                              }
                            />
                          </div>

                          <span className={styles.barLabel}>{day}</span>
                        </div>
                      );
                    },
                  )}
                </div>

                <p className={styles.weeklyNote}>
                  <FiAlertCircle size={12} />
                  Dynamic consultation activity overview
                </p>
              </section>

              {/* RECENT PATIENTS */}

              <section className={styles.recentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleGroup}>
                    <FiUsers size={16} className={styles.cardIcon} />
                    <h2 className={styles.cardTitle}>Recent Patients</h2>
                  </div>

                  <button
                    className={styles.viewAllBtn}
                    onClick={handleViewAllPatients}
                  >
                    {showAllPatients ? "Show Less" : "View all"}{" "}
                    <FiChevronRight size={13} />
                  </button>
                </div>

                <div className={styles.patientList}>
                  {recentPatients.map((p) => {
                    const color = getAvatarColor(p.patient?.name);
                    return (
                      <div key={p._id} className={styles.patientRow}>
                        <div
                          className={styles.patientAvatar}
                          style={{
                            backgroundColor: color.bg,
                            color: color.text,
                          }}
                        >
                          {p.patient?.name?.charAt(0) || "P"}
                        </div>

                        <div className={styles.patientInfo}>
                          <p className={styles.patientName}>
                            {p.patient?.name || "Patient"}
                          </p>

                          <p className={styles.patientMeta}>
                            {p.currentProblem}
                          </p>
                        </div>

                        <div className={styles.patientRight}>
                          <span
                            className={`${styles.statusPill} ${
                              p.status === "completed"
                                ? styles.statusStable
                                : styles.statusReview
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
STAT CARD
==================================================
*/

function StatCard({ icon: Icon, iconColor, iconBg, label, value, trend }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIconWrapper} style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>

      <div className={styles.statBody}>
        <p className={styles.statLabel}>{label}</p>

        <p className={styles.statValue}>{value}</p>

        <p className={styles.statTrend}>{trend}</p>
      </div>
    </div>
  );
}

/*
==================================================
APPOINTMENT ROW
==================================================
*/

function AppointmentRow({ appt, avatarColor }) {
  const handleJoinConsultation = () => {
    if (!appt?._id) {
      console.error("Consultation ID missing");
      return;
    }

    console.log(
      "Joining consultation room:",
      appt._id,
      "| Patient:",
      appt.patient?.name,
      "| Problem:",
      appt.currentProblem,
    );

    /*
    VERY IMPORTANT:
    Must use consultation._id
    NOT doctor._id
    NOT patient._id
    */

    window.location.href = `/video-call/${appt._id}`;
  };

  return (
    <div className={styles.appointmentRow}>
      {/* TIME */}

      <div className={styles.apptTime}>
        <FiClock size={12} />
        {appt.startTime || "N/A"}
      </div>

      {/* AVATAR */}

      <div
        className={styles.apptAvatar}
        style={{ backgroundColor: avatarColor?.bg, color: avatarColor?.text }}
      >
        {appt.patient?.name?.charAt(0) || "P"}
      </div>

      {/* INFO */}

      <div className={styles.apptInfo}>
        <p className={styles.apptName}>{appt.patient?.name || "Patient"}</p>

        <p className={styles.apptReason}>
          {appt.currentProblem || "Consultation"}
        </p>
      </div>

      {/* ACTIONS */}

      <div className={styles.apptActions}>
        <span
          className={`${styles.typePill} ${
            appt.consultationType === "video"
              ? styles.typeVideo
              : styles.typeCall
          }`}
        >
          {appt.consultationType === "video" ? (
            <FiVideo size={11} />
          ) : (
            <FiPhone size={11} />
          )}

          {appt.consultationType || "video"}
        </span>

        {/* JOIN BUTTON - ONLY FOR NON-COMPLETED SESSIONS */}

        {appt.status !== "completed" ? (
          <button className={styles.joinBtn} onClick={handleJoinConsultation}>
            Join
          </button>
        ) : (
          <span className={styles.completedBadge}>
            <FiCheckCircle size={12} /> Completed
          </span>
        )}
      </div>
    </div>
  );
}
