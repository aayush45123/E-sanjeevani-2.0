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
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorDashboard.module.css";
import { authApi, consultationApi } from "../../utils/api";

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPatients: 0,
    todayConsultations: 0,
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
          window.location.href = "/auth";
        }
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /*
  ==================================================
  CALCULATE DASHBOARD STATS
  ==================================================
  */

  const calculateStats = (data) => {
    const uniquePatients = new Set(data.map((item) => item.patient?._id));

    const today = new Date().toDateString();

    const todayConsultations = data.filter(
      (item) => new Date(item.consultationDate).toDateString() === today,
    ).length;

    const completedSessions = data.filter(
      (item) => item.status === "completed",
    ).length;

    setStats({
      totalPatients: uniquePatients.size,
      todayConsultations,
      completedSessions,
      avgRating: 4.8,
    });
  };

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
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

  const recentPatients = consultations.slice(0, 5);

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

  return (
    <div className={styles.dashboardLayout}>
      <DoctorSidebar user={user} onLogout={handleLogout} />

      <main className={styles.mainContent}>
        {/* HEADER */}

        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Good morning, Dr. {firstName} 👋
            </h1>

            <p className={styles.pageSubtitle}>{todayFormatted}</p>
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
                  consultations.map((appt, index) => (
                    <AppointmentRow
                      key={appt._id}
                      appt={appt}
                      isFirst={index === 0}
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
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
                    const heights = [60, 80, 45, 90, 70, 30];

                    return (
                      <div key={day} className={styles.barGroup}>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.bar}
                            style={{
                              height: `${heights[i]}%`,
                            }}
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

                  <button className={styles.viewAllBtn}>
                    View all <FiChevronRight size={13} />
                  </button>
                </div>

                <div className={styles.patientList}>
                  {recentPatients.map((p) => (
                    <div key={p._id} className={styles.patientRow}>
                      <div className={styles.patientAvatar}>
                        {p.patient?.name?.charAt(0) || "P"}
                      </div>

                      <div className={styles.patientInfo}>
                        <p className={styles.patientName}>
                          {p.patient?.name || "Patient"}
                        </p>

                        <p className={styles.patientMeta}>{p.currentProblem}</p>
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
                  ))}
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

function AppointmentRow({ appt, isFirst }) {
  return (
    <div
      className={`${styles.appointmentRow} ${
        isFirst ? styles.appointmentNext : ""
      }`}
    >
      <div className={styles.apptTime}>
        <FiClock size={12} />
        {appt.startTime}
      </div>

      <div className={styles.apptAvatar}>
        {appt.patient?.name?.charAt(0) || "P"}
      </div>

      <div className={styles.apptInfo}>
        <p className={styles.apptName}>{appt.patient?.name || "Patient"}</p>

        <p className={styles.apptReason}>{appt.currentProblem}</p>
      </div>

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

          {appt.consultationType}
        </span>

        {isFirst && <button className={styles.joinBtn}>Join</button>}
      </div>
    </div>
  );
}
