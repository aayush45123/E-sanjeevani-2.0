import { useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBell,
  FiLock,
  FiActivity,
  FiDroplet,
  FiMoon,
  FiHeart,
  FiAlertOctagon,
  FiUsers,
  FiFileText,
  FiLoader,
  FiZap,
  FiCpu,
  FiUserCheck,
  FiCamera,
} from "react-icons/fi";

import styles from "./PatientDashboard.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { profileApi, authApi } from "../../utils/api";

const featureCards = [
  {
    id: "ai-check",
    Icon: FiCpu,
    label: "KNOWLEDGE LAYER",
    title: "AI Symptom Triage",
    desc: "Interact with our clinical NLP model to instantly extract symptoms and receive an accurate 1-10 Urgency Score.",
    tagColor: "tagGreen",
  },
  {
    id: "consult",
    Icon: FiUserCheck,
    label: "CLINICAL LAYER",
    title: "Smart Doctor Match",
    desc: "Get matched to the right specialist based on urgency, specialty, and availability.",
    tagColor: "tagPurple",
  },
  {
    id: "skin",
    Icon: FiCamera,
    label: "VISION MODEL",
    title: "Dermatology Scan",
    desc: "Upload skin condition images for AI-powered preliminary screening.",
    tagColor: "tagOrange",
  },
];

const quickStats = [
  {
    title: "Total Consultations",
    value: "24",
    icon: <FiActivity />,
  },
  {
    title: "Doctors Available",
    value: "128",
    icon: <FiUsers />,
  },
  {
    title: "Medical Records",
    value: "16",
    icon: <FiFileText />,
  },
  {
    title: "Urgency Score",
    value: "Low",
    icon: <FiZap />,
  },
];

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [userRes, statusRes] = await Promise.all([
          authApi.me(),
          profileApi.getStatus(),
        ]);

        setUser(userRes.data);
        setProfileComplete(statusRes.data.isProfileComplete);
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/auth";
        }
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const avatarChar = firstName[0]?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <FiLoader className={styles.spinner} size={28} />
        <p className={styles.loadingText}>Initializing Workspace...</p>
      </div>
    );
  }

  return (
    <div className={styles.appLayout}>
      <Sidebar
        user={user}
        avatarChar={avatarChar}
        handleSignOut={handleSignOut}
      />

      <main className={styles.mainCanvas}>
        <div className={styles.contentWrapper}>
          <div className={styles.headerSection}>
            <div>
              <p className={styles.subTitle}>Patient Dashboard</p>
              <h1 className={styles.pageTitle}>Welcome back, {firstName}</h1>
              <p className={styles.description}>
                Monitor your health journey, consultations, and AI-powered
                healthcare services from one place.
              </p>
            </div>

            <button
              className={`${styles.emergencyBtn} ${
                emergencyActive ? styles.emergencyActive : ""
              }`}
              onClick={() => setEmergencyActive(true)}
              disabled={emergencyActive}
            >
              {emergencyActive ? (
                <>
                  <FiLoader className={styles.spinner} />
                  Routing...
                </>
              ) : (
                <>
                  <FiAlertOctagon />
                  Declare Emergency
                </>
              )}
            </button>
          </div>

          {!profileComplete && (
            <div className={styles.alertBox}>
              <div className={styles.alertLeft}>
                <FiAlertTriangle />
                <div>
                  <h3>Profile Incomplete</h3>
                  <p>
                    Complete your profile to unlock smart doctor matching and
                    emergency priority routing.
                  </p>
                </div>
              </div>

              <button
                className={styles.completeBtn}
                onClick={() => (window.location.href = "/profile-setup")}
              >
                Complete Profile
                <FiArrowRight />
              </button>
            </div>
          )}

          <div className={styles.statsGrid}>
            {quickStats.map((item, index) => (
              <div className={styles.statCard} key={index}>
                <div className={styles.statIcon}>{item.icon}</div>
                <h3>{item.value}</h3>
                <p>{item.title}</p>
              </div>
            ))}
          </div>

          <div className={styles.sectionTitle}>
            <h2>Platform Modules</h2>
          </div>

          <div className={styles.cardGrid}>
            {featureCards.map((card) => (
              <div
                key={card.id}
                className={`${styles.card} ${
                  !profileComplete ? styles.lockedCard : ""
                }`}
              >
                {!profileComplete && (
                  <div className={styles.lockOverlay}>
                    <FiLock />
                    Profile Required
                  </div>
                )}

                <div className={styles.cardIcon}>
                  <card.Icon />
                </div>

                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardText}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
