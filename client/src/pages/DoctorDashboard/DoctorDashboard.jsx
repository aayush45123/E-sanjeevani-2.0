import React, { useState, useEffect } from "react";
import {
  FiLoader,
  FiUsers,
  FiCalendar,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiVideo,
  FiPhone,
  FiMoreHorizontal,
  FiChevronRight,
  FiTrendingUp,
  FiAlertCircle,
  FiPlus,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorDashboard.module.css";
import { authApi, consultationApi } from "../../utils/api";

/* ─── mock data (replace with real API calls) ─── */
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    patientName: "Aayush Bharda",
    initials: "AB",
    time: "10:00 AM",
    type: "Video",
    reason: "Follow-up on blood pressure",
    status: "upcoming",
  },
  {
    id: 2,
    patientName: "Priya Sharma",
    initials: "PS",
    time: "11:30 AM",
    type: "Call",
    reason: "Chest pain & breathlessness",
    status: "upcoming",
  },
  {
    id: 3,
    patientName: "Rahul Mehra",
    initials: "RM",
    time: "02:00 PM",
    type: "Video",
    reason: "Post-surgery check",
    status: "upcoming",
  },
  {
    id: 4,
    patientName: "Sneha Kapoor",
    initials: "SK",
    time: "03:15 PM",
    type: "Call",
    reason: "Medication review",
    status: "upcoming",
  },
];

const MOCK_RECENT_PATIENTS = [
  {
    id: 1,
    name: "Vikram Patel",
    initials: "VP",
    age: 45,
    condition: "Hypertension",
    lastVisit: "Yesterday",
    status: "Stable",
  },
  {
    id: 2,
    name: "Anita Singh",
    initials: "AS",
    age: 32,
    condition: "Diabetes Type 2",
    lastVisit: "2 days ago",
    status: "Review",
  },
  {
    id: 3,
    name: "Mohan Das",
    initials: "MD",
    age: 58,
    condition: "Arthritis",
    lastVisit: "3 days ago",
    status: "Stable",
  },
];

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 124,
    todayConsultations: 6,
    avgRating: 4.8,
    completedSessions: 312,
  });

  /* fetch logged-in doctor */
  useEffect(() => {
    async function init() {
      try {
        const response = await authApi.me();
        setUser(response.data.user || response.data);
      } catch (err) {
        if (err.status === 401 || err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/auth";
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/auth";
  };

  const firstName = user?.name?.split(" ")[0] || "Doctor";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
        {/* ── Header ── */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Good morning, Dr. {firstName} 👋
            </h1>
            <p className={styles.pageSubtitle}>{today}</p>
          </div>
          <button className={styles.newConsultationBtn}>
            <FiPlus size={15} />
            <span>New Consultation</span>
          </button>
        </header>

        <div className={styles.contentGrid}>
          {/* ── Stats Row ── */}
          <section className={styles.statsRow}>
            <StatCard
              icon={FiUsers}
              iconColor="#2563eb"
              iconBg="#eff6ff"
              label="Total Patients"
              value={stats.totalPatients}
              trend="+4 this week"
            />
            <StatCard
              icon={FiCalendar}
              iconColor="#059669"
              iconBg="#f0fdf4"
              label="Today's Consultations"
              value={stats.todayConsultations}
              trend="4 remaining"
            />
            <StatCard
              icon={FiStar}
              iconColor="#d97706"
              iconBg="#fffbeb"
              label="Average Rating"
              value={stats.avgRating}
              trend="Based on 89 reviews"
            />
            <StatCard
              icon={FiCheckCircle}
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              label="Completed Sessions"
              value={stats.completedSessions}
              trend="+12 this month"
            />
          </section>

          <div className={styles.mainGrid}>
            {/* ── Today's Schedule ── */}
            <section className={styles.scheduleCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <FiClock size={16} className={styles.cardIcon} />
                  <h2 className={styles.cardTitle}>Today's Schedule</h2>
                </div>
                <span className={styles.badge}>
                  {MOCK_APPOINTMENTS.length} appointments
                </span>
              </div>

              <div className={styles.appointmentList}>
                {MOCK_APPOINTMENTS.map((appt, i) => (
                  <AppointmentRow key={appt.id} appt={appt} isFirst={i === 0} />
                ))}
              </div>
            </section>

            {/* ── Right column ── */}
            <div className={styles.rightCol}>
              {/* Quick Stats */}
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
                            style={{ height: `${heights[i]}%` }}
                          />
                        </div>
                        <span className={styles.barLabel}>{day}</span>
                      </div>
                    );
                  })}
                </div>
                <p className={styles.weeklyNote}>
                  <FiAlertCircle size={12} /> 3 consultations pending report
                </p>
              </section>

              {/* Recent Patients */}
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
                  {MOCK_RECENT_PATIENTS.map((p) => (
                    <div key={p.id} className={styles.patientRow}>
                      <div className={styles.patientAvatar}>{p.initials}</div>
                      <div className={styles.patientInfo}>
                        <p className={styles.patientName}>{p.name}</p>
                        <p className={styles.patientMeta}>
                          {p.age}y · {p.condition}
                        </p>
                      </div>
                      <div className={styles.patientRight}>
                        <span
                          className={`${styles.statusPill} ${
                            p.status === "Stable"
                              ? styles.statusStable
                              : styles.statusReview
                          }`}
                        >
                          {p.status}
                        </span>
                        <p className={styles.lastVisit}>{p.lastVisit}</p>
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

/* ─── Sub-components ─── */

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

function AppointmentRow({ appt, isFirst }) {
  return (
    <div
      className={`${styles.appointmentRow} ${isFirst ? styles.appointmentNext : ""}`}
    >
      <div className={styles.apptTime}>
        <FiClock size={12} />
        {appt.time}
      </div>

      <div className={styles.apptAvatar}>{appt.initials}</div>

      <div className={styles.apptInfo}>
        <p className={styles.apptName}>{appt.patientName}</p>
        <p className={styles.apptReason}>{appt.reason}</p>
      </div>

      <div className={styles.apptActions}>
        <span
          className={`${styles.typePill} ${
            appt.type === "Video" ? styles.typeVideo : styles.typeCall
          }`}
        >
          {appt.type === "Video" ? (
            <FiVideo size={11} />
          ) : (
            <FiPhone size={11} />
          )}
          {appt.type}
        </span>
        {isFirst && <button className={styles.joinBtn}>Join</button>}
      </div>
    </div>
  );
}
