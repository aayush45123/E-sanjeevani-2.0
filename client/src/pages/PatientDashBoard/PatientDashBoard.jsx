import { useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiLogOut,
  FiBell,
  FiCpu,
  FiUserCheck,
  FiCamera,
  FiLock,
  FiActivity,
  FiDroplet,
  FiMoon,
  FiHeart,
  FiAlertOctagon,
  FiBarChart2,
  FiUsers,
  FiFileText,
  FiLoader,
  FiHome,
  FiGrid,
  FiFolder,
  FiSettings,
  FiZap,
} from "react-icons/fi";

import styles from "./PatientDashBoard.module.css";
import { profileApi, authApi } from "../../utils/api";

// Simple Text Logo Instead of SVG
const LogoIcon = () => (
  <div
    style={{
      width: "28px",
      height: "28px",
      background: "#51da4d",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "800",
      color: "#ffffff",
      flexShrink: 0,
    }}
  >
    E
  </div>
);

// Feature card definitions
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
    desc: "Bypass the standard queue. Get matched to the right specialist based on urgency, specialty, and availability.",
    tagColor: "tagPurple",
  },
  {
    id: "skin",
    Icon: FiCamera,
    label: "VISION MODEL",
    title: "Dermatology Scan",
    desc: "Upload clinical-grade images of skin conditions for immediate AI-powered preliminary screening.",
    tagColor: "tagOrange",
  },
];

const healthTips = [
  { Icon: FiDroplet, tip: "Hydration telemetry: 8 glasses daily" },
  { Icon: FiActivity, tip: "Cardiovascular baseline: 30m daily activity" },
  { Icon: FiMoon, tip: "Recovery cycle: 7–9 hours required" },
  { Icon: FiHeart, tip: "Nutritional input: Optimize green intake" },
];

const flowSteps = [
  {
    num: "01",
    title: "AI Intake",
    desc: "Patient interacts with AI. Complex issues trigger symptom collection.",
  },
  {
    num: "02",
    title: "Urgency Scoring",
    desc: "Engine assigns a 1-10 severity score and predicts required specialty.",
  },
  {
    num: "03",
    title: "Dynamic Match",
    desc: "Weighted algorithm cross-references parameters to bypass standard queues.",
  },
  {
    num: "04",
    title: "Instant Connection",
    desc: "Emergency patients connected to optimal doctor in <3 minutes.",
  },
];

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    async function init() {
      if (!localStorage.getItem("token")) {
        window.location.href = "/auth";
        return;
      }

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
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          {/* Brand Logo */}
          <div className={styles.brand}>
            <LogoIcon />
            <span className={styles.brandName}>E-Sanjeevani</span>
          </div>

          {/* Navigation Menu */}
          <nav className={styles.navMenu}>
            <div className={styles.navGroup}>
              <span className={styles.navLabel}>Overview</span>
              <a href="#" className={`${styles.navItem} ${styles.active}`}>
                <FiHome size={18} /> Dashboard
              </a>
              <a href="#" className={styles.navItem}>
                <FiActivity size={18} /> Consultations
              </a>
              <a href="#" className={styles.navItem}>
                <FiFolder size={18} /> Clinical Records
              </a>
            </div>

            <div className={styles.navGroup}>
              <span className={styles.navLabel}>Applications</span>
              <a href="#" className={styles.navItem}>
                <FiCpu size={18} /> AI Triage Engine
              </a>
              <a href="#" className={styles.navItem}>
                <FiUsers size={18} /> Specialist Directory
              </a>
            </div>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className={styles.sidebarBottom}>
          <a href="#" className={styles.navItem}>
            <FiSettings size={18} /> Settings
          </a>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>{avatarChar}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || "Patient"}</span>
              <span className={styles.userRole}>Standard Tier</span>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={handleSignOut}
              title="Log out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CANVAS */}
      <main className={styles.mainCanvas}>
        <div className={styles.contentWrapper}>
          {/* Canvas Header */}
          <header className={styles.canvasHeader}>
            <div className={styles.headerTitles}>
              <p className={styles.dateText}>{currentDate}</p>
              <h1 className={styles.greetingTitle}>Welcome, {firstName}</h1>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.notificationBtn}>
                <FiBell size={18} />
                <span className={styles.dot}></span>
              </button>
              <button
                className={`${styles.emergencyBtn} ${emergencyActive ? styles.emergencyActive : ""}`}
                onClick={() => setEmergencyActive(true)}
                disabled={emergencyActive}
              >
                {emergencyActive ? (
                  <>
                    <FiLoader className={styles.spinIcon} size={16} />{" "}
                    Routing...
                  </>
                ) : (
                  <>
                    <FiAlertOctagon size={16} /> Declare Emergency
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Alert Banner */}
          {!profileComplete && (
            <div className={styles.alertBanner}>
              <div className={styles.alertContent}>
                <div className={styles.alertIconBox}>
                  <FiAlertTriangle size={20} />
                </div>
                <div className={styles.alertTexts}>
                  <h3 className={styles.alertTitle}>Profile Incomplete</h3>
                  <p className={styles.alertDesc}>
                    Complete your clinical profile to enable Smart Routing and
                    AI Match algorithms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => (window.location.href = "/profile-setup")}
                className={styles.alertBtn}
              >
                Complete Profile <FiArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            {[
              { id: 1, label: "Total Consults", value: "0", Icon: FiActivity },
              { id: 2, label: "Urgency Score", value: "—", Icon: FiZap },
              { id: 3, label: "Network Doctors", value: "842", Icon: FiUsers },
              { id: 4, label: "Vault Records", value: "0", Icon: FiFileText },
            ].map((stat) => (
              <div key={stat.id} className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statIconBox}>
                    <stat.Icon size={16} />
                  </div>
                </div>
                <div className={styles.statValue}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Module Cards */}
          <section className={styles.moduleSection}>
            <h2 className={styles.sectionTitle}>Platform Modules</h2>
            <div className={styles.moduleGrid}>
              {featureCards.map((card) => (
                <div
                  key={card.id}
                  className={`${styles.moduleCard} ${!profileComplete ? styles.lockedCard : ""}`}
                >
                  {!profileComplete && (
                    <div className={styles.lockOverlay}>
                      <div className={styles.lockBadge}>
                        <FiLock size={14} /> Profile Required
                      </div>
                    </div>
                  )}

                  <div className={styles.moduleHeader}>
                    <div
                      className={`${styles.moduleIconBox} ${styles[card.tagColor]}`}
                    >
                      <card.Icon size={20} />
                    </div>
                    <span className={styles.moduleTag}>{card.label}</span>
                  </div>
                  <h3 className={styles.moduleTitle}>{card.title}</h3>
                  <p className={styles.moduleDesc}>{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Split Grid */}
          <div className={styles.bottomGrid}>
            {/* Algorithm Pipeline */}
            <div className={styles.dataCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Algorithm Pipeline</h3>
              </div>
              <div className={styles.timeline}>
                {flowSteps.map((step, i) => (
                  <div key={i} className={styles.timelineStep}>
                    <div className={styles.stepDot}></div>
                    <div className={styles.stepContent}>
                      <h4 className={styles.stepTitle}>
                        {step.num}. {step.title}
                      </h4>
                      <p className={styles.stepDesc}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Telemetry */}
            <div className={styles.dataCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>System Telemetry</h3>
              </div>
              <div className={styles.tipsList}>
                {healthTips.map((tip, i) => (
                  <div key={i} className={styles.tipItem}>
                    <div className={styles.tipIconWrap}>
                      <tip.Icon size={16} />
                    </div>
                    <span className={styles.tipText}>{tip.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
