import React, { useEffect, useState } from "react";
import { DoctorDashboardSkeleton } from "../../components/Skeletons";

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
  FiZap,
} from "react-icons/fi";
import io from "socket.io-client";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import NotificationService from "../../utils/notificationService";
import { useNavigate } from "react-router-dom";
import styles from "./DoctorDashboard.module.css";
import { authApi, consultationApi, apiClient } from "../../utils/api";
import { performLogout } from "../../utils/auth";

export default function DoctorDashboard({ isProfileIncomplete = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [urgencyMap, setUrgencyMap] = useState({}); // Map consultation ID to urgency data
  const [loading, setLoading] = useState(true);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [weeklyData, setWeeklyData] = useState([10, 10, 10, 10, 10, 10, 10]);
  const [consultationCounts, setConsultationCounts] = useState([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [dayLabels, setDayLabels] = useState([
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  const [profileStatus, setProfileStatus] = useState({
    clinicAddressComplete: false,
    missingItems: [],
  });

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
        const [userRes, consultationRes, statusRes] = await Promise.all([
          authApi.me().catch((err) => {
            if (err.status === 401 || err.response?.status === 401) {
              performLogout();
            }
            return null;
          }),
          consultationApi.getDoctorConsultations().catch((err) => {
            console.error("Failed to fetch doctor consultations:", err);
            return { data: { consultations: [] } };
          }),
          consultationApi.checkDoctorProfileStatus?.().catch(() => null),
        ]);

        if (userRes?.data) {
          const doctorData = userRes.data.user || userRes.data;
          setUser(doctorData);
        }

        const allConsultations = consultationRes?.data?.consultations || [];
        setConsultations(allConsultations);
        calculateStats(allConsultations);

        if (statusRes?.data) {
          setProfileStatus({
            clinicAddressComplete: statusRes.data.clinicAddressComplete || false,
            hasClinic: statusRes.data.hasClinic || false,
            missingItems: statusRes.data.missingItems || [],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // ─── Refetch profile status (called after doctor saves clinic address) ────
  const refreshProfileStatus = async () => {
    try {
      const statusRes = await consultationApi.checkDoctorProfileStatus?.();
      if (statusRes?.data) {
        setProfileStatus({
          clinicAddressComplete: statusRes.data.clinicAddressComplete || false,
          hasClinic: statusRes.data.hasClinic || false,
          missingItems: statusRes.data.missingItems || [],
        });
      }
    } catch (err) {
      console.log("Profile status check not available (backward compatible)");
    }
  };

  // ── Socket listener for consultation notifications ───────────────────────
  useEffect(() => {
const SOCKET_URL =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
        const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on(
      "participant-waiting",
      ({ waitingUserRole, waitingUserName, message }) => {
        console.log(`⏳ ${message}`);
        const roleText = waitingUserRole === "doctor" ? "Dr." : "Patient";
        NotificationService.showToast(
          `${roleText} ${waitingUserName} is waiting for you to join the consultation!`,
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

  // ── Refetch profile status when window regains focus ───────────────────────
  useEffect(() => {
    const handleFocus = () => {
      refreshProfileStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
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

    // Sort today's consultations and set to state
    const sortedTodayList = [...todayList].sort((a, b) => {
      // Scheduled first, then others
      if (a.status === "scheduled" && b.status !== "scheduled") return -1;
      if (a.status !== "scheduled" && b.status === "scheduled") return 1;
      // Within same status, sort by time
      return new Date(b.consultationDate) - new Date(a.consultationDate);
    });
    setTodaySchedule(sortedTodayList);

    // Fetch urgency levels for today's consultations
    fetchUrgencyForConsultations(sortedTodayList);

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

  /*
  ==================================================
  FETCH URGENCY LEVELS FOR CONSULTATIONS USING AI
  ==================================================
  */
  const fetchUrgencyForConsultations = async (consultationList) => {
    try {
      const newUrgencyMap = {};

      console.log(
        "🔄 Fetching urgency for",
        consultationList.length,
        "consultations",
      );

      for (const consultation of consultationList) {
        try {
          // Combine symptoms and current problem for AI analysis
          const symptomsText =
            `${consultation.symptoms || ""} ${consultation.currentProblem || ""}`.trim();

          if (!symptomsText) {
            console.warn(
              `⚠️ No symptoms text for consultation ${consultation._id}`,
            );
            newUrgencyMap[consultation._id] = { urgency: "medium" };
            continue;
          }

          console.log(
            `📤 Sending request for ${consultation.patient?.name}: "${symptomsText.substring(0, 50)}..."`,
          );

          const response = await apiClient.post(
            "/ai-triage/predict",
            {
              userId: consultation.patient?._id,
              message: symptomsText,
            }
          );

          const data = response.data;
          console.log(
            `✅ Received urgency for ${consultation.patient?.name}:`,
            data.data?.urgency,
          );
          newUrgencyMap[consultation._id] = {
            urgency: data.data?.urgency || "medium",
            predictedDisease: data.data?.predictedDisease,
            doctorType: data.data?.doctorType,
          };
        } catch (err) {
          if (err?.response?.status !== 503) {
            console.warn(
              `⚠️ AI triage service unavailable for consultation ${consultation._id}, using default urgency.`,
            );
          }
          // Fallback to medium urgency if API fails or is unavailable (503)
          newUrgencyMap[consultation._id] = { urgency: "medium" };
        }
      }

      console.log("📊 Final urgency map:", newUrgencyMap);
      setUrgencyMap(newUrgencyMap);
    } catch (err) {
      console.error("❌ Error fetching urgencies:", err);
    }
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

    // Days to track (last 7 days) - in order from 6 days ago to today
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

    setDayLabels(dayLabels);
    setConsultationCounts(consultationCounts);
    setWeeklyData(heights);
  };

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => performLogout();

  /*
  ==================================================
  HELPERS
  ==================================================
  */

  const firstName = user?.name?.split(" ")[1] || "Doctor";

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
    return <DoctorDashboardSkeleton />;
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
              Good morning, Dr.{firstName}
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

        {/* Profile Incompleteness Banner - Only show if doctor HAS clinic but address incomplete */}
        {profileStatus.hasClinic && !profileStatus.clinicAddressComplete && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
              border: "1px solid #fbbf24",
              padding: "16px 24px",
              margin: "24px 0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontWeight: "600",
                  color: "#78350f",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiAlertCircle size={16} /> Complete Your Profile
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "13px",
                  color: "#92400e",
                  lineHeight: "1.4",
                }}
              >
                Add your clinic address to appear in location-based searches and
                make it easier for patients to find you.
              </p>
            </div>
            <button
              onClick={() => navigate("/doctor-profile-edit")}
              style={{
                whiteSpace: "nowrap",
                padding: "8px 16px",
                background: "white",
                border: "1px solid #fbbf24",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#78350f",
                marginLeft: "16px",
              }}
            >
              Add Address
            </button>
          </div>
        )}

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
                  {todaySchedule.length} appointments
                </span>
              </div>

              <div className={styles.appointmentList}>
                {todaySchedule.length === 0 ? (
                  <div className={styles.emptyState}>No appointments today</div>
                ) : (
                  todaySchedule.map((appt) => (
                    <AppointmentRow
                      key={appt._id}
                      appt={appt}
                      avatarColor={getAvatarColor(appt.patient?.name)}
                      urgency={urgencyMap[appt._id]}
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
                  {dayLabels.map((day, i) => {
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
                  })}
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

function AppointmentRow({ appt, avatarColor, urgency }) {
  const navigate = useNavigate();
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

    navigate(`/video-call/${appt._id}`);
  };

  // Get urgency color and icon based on level
  const getUrgencyStyles = () => {
    const level = urgency?.urgency?.toLowerCase() || "medium";

    const urgencyConfig = {
      critical: {
        bg: "#fee2e2",
        border: "#fecaca",
        text: "#991b1b",
        icon: <AlertCircle size={14} color="#dc2626" />,
        label: "Critical",
      },
      high: {
        bg: "#fed7aa",
        border: "#fdba74",
        text: "#92400e",
        icon: <AlertTriangle size={14} color="#d97706" />,
        label: "High",
      },
      medium: {
        bg: "#fef3c7",
        border: "#fcd34d",
        text: "#92400e",
        icon: <Info size={14} color="#b45309" />,
        label: "Medium",
      },
      low: {
        bg: "#dcfce7",
        border: "#86efac",
        text: "#166534",
        icon: <CheckCircle size={14} color="#16a34a" />,
        label: "Low",
      },
    };

    return urgencyConfig[level] || urgencyConfig.medium;
  };

  const urgencyStyle = getUrgencyStyles();

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

        {/* URGENCY BADGE */}
        {urgency && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "6px",
              padding: "4px 8px",
              backgroundColor: urgencyStyle.bg,
              border: `1.5px solid ${urgencyStyle.border}`,
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              color: urgencyStyle.text,
            }}
            title={`Urgency: ${urgencyStyle.label} | Disease: ${urgency.predictedDisease || "N/A"} | Specialist: ${urgency.doctorType || "General"}`}
          >
            <span>{urgencyStyle.icon}</span>
            <span>{urgencyStyle.label}</span>
            {urgency.predictedDisease && (
              <span style={{ opacity: 0.7, fontSize: "10px" }}>
                • {urgency.predictedDisease}
              </span>
            )}
          </div>
        )}
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
