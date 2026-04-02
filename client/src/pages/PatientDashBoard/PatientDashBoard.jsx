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
} from "react-icons/fi";

import styles from "./PatientDashboard.module.css";
import { profileApi, authApi } from "./api.js";

// ─── Feature card definitions ────────────────────────────────
const featureCards = [
  {
    id: "ai-check",
    Icon: FiCpu,
    label: "AI TRIAGE",
    title: "AI Symptom Check",
    desc: "Describe your symptoms and get an instant urgency score.",
    tag: "KNOWLEDGE LAYER",
    tagColor: "tagGreen",
  },
  {
    id: "consult",
    Icon: FiUserCheck,
    label: "CLINICAL LAYER",
    title: "Consult Doctor",
    desc: "Get matched to the right specialist in real-time.",
    tag: "SMART ROUTING",
    tagColor: "tagPurple",
  },
  {
    id: "skin",
    Icon: FiCamera,
    label: "DERMA AI",
    title: "Upload Skin Image",
    desc: "AI-powered dermatology screening in seconds.",
    tag: "VISION MODEL",
    tagColor: "tagOrange",
  },
];

const healthTips = [
  { Icon: FiDroplet, tip: "Drink 8 glasses of water daily" },
  { Icon: FiActivity, tip: "30 minutes of walking improves heart health" },
  { Icon: FiMoon, tip: "7–9 hours of sleep boosts immunity" },
  { Icon: FiHeart, tip: "Include greens in every meal" },
];

const flowSteps = [
  {
    num: "01",
    title: "Profile & Chatbot",
    desc: "Set up your health profile and chat with the AI Symptom Engine.",
  },
  {
    num: "02",
    title: "AI Triage Engine",
    desc: "Get a decision route: Low (Self-Care), Mid (Match), or Emergency (Priority Alert).",
  },
  {
    num: "03",
    title: "Smart Routing",
    desc: "Receive a Match Score and get routed to the correct specialist's queue.",
  },
  {
    num: "04",
    title: "Service Delivery",
    desc: "Doctor reviews your info, conducts video consultation, and generates prescription.",
  },
];

// ─────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);

  // Fetch current user info + profile completion status on mount
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
          window.location.href = "/login";
        }
        console.error("Dashboard init failed:", err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Name comes from the User document fetched via /api/auth/me
  // Falls back to the part before @ in email if name isn't set
  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const avatarChar = firstName[0]?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <FiLoader className={styles.spinner} size={28} />
        <p className={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>+</div>
          <span className={styles.navName}>E-Sanjeevani 2.0</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#" className={styles.navLinkActive}>
            Platform
          </a>
          <a href="#" className={styles.navLink}>
            AI Triage
          </a>
          <a href="#" className={styles.navLink}>
            Specialties
          </a>
          <a href="#" className={styles.navLink}>
            History
          </a>
        </div>
        <div className={styles.navActions}>
          <button className={styles.navIconBtn} aria-label="Notifications">
            <FiBell size={18} />
          </button>
          <div className={styles.navProfile}>{avatarChar}</div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <FiLogOut size={14} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          PATIENT DASHBOARD
        </div>
        <h1 className={styles.heroTitle}>
          Welcome back,
          <br />
          <em className={styles.heroName}>{firstName}.</em>
        </h1>
        <p className={styles.heroSubtitle}>
          Your health command center — smart care, instant access.
        </p>

        {!profileComplete && (
          <div className={styles.profileBanner}>
            <div className={styles.bannerLeft}>
              <FiAlertTriangle size={22} className={styles.bannerIconSvg} />
              <div>
                <p className={styles.bannerTitle}>Profile Incomplete</p>
                <p className={styles.bannerDesc}>
                  Complete your health profile to unlock AI consultations and
                  doctor matching.
                </p>
              </div>
            </div>
            <a href="/profile-setup" className={styles.bannerBtn}>
              Complete Profile
              <FiArrowRight size={14} />
            </a>
          </div>
        )}
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {[
            {
              Icon: FiActivity,
              label: "CONSULTATIONS",
              value: "0",
              sub: "No sessions yet",
            },
            {
              Icon: FiBarChart2,
              label: "URGENCY SCORE",
              value: "—",
              sub: "Run AI Triage first",
            },
            {
              Icon: FiUsers,
              label: "MATCHED DOCTORS",
              value: "—",
              sub: "Profile needed",
            },
            {
              Icon: FiFileText,
              label: "HEALTH RECORDS",
              value: "0",
              sub: "Upload your first",
            },
          ].map(({ Icon, label, value, sub }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statIconRow}>
                <Icon size={15} className={styles.statIcon} />
                <p className={styles.statLabel}>{label}</p>
              </div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statSub}>{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EMERGENCY ──────────────────────────────────────── */}
      <section className={styles.emergencySection}>
        <div className={styles.emergencyInner}>
          <div className={styles.emergencyText}>
            <span className={styles.emergencyLabel}>ALWAYS AVAILABLE</span>
            <h2 className={styles.emergencyTitle}>Emergency Consultation</h2>
            <p className={styles.emergencyDesc}>
              Critical cases bypass all queues. Instantly routed to an available
              specialist.
            </p>
          </div>
          <button
            className={`${styles.emergencyBtn} ${emergencyActive ? styles.emergencyBtnActive : ""}`}
            onClick={() => setEmergencyActive(true)}
            disabled={emergencyActive}
          >
            <FiAlertOctagon size={18} />
            {emergencyActive ? "Connecting..." : "Start Emergency"}
          </button>
        </div>
      </section>

      {/* ── FEATURE CARDS ──────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>CORE FEATURES</span>
          <h2 className={styles.sectionTitle}>
            Two distinct paths.
            <br />
            One intelligent platform.
          </h2>
          <p className={styles.sectionDesc}>
            E-Sanjeevani 2.0 routes patients based on real-time urgency data —
            instantly.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {featureCards.map(
            ({ id, Icon, label, title, desc, tag, tagColor }) => (
              <div
                key={id}
                className={`${styles.featureCard} ${!profileComplete ? styles.featureCardLocked : ""}`}
              >
                {!profileComplete && (
                  <div className={styles.lockOverlay}>
                    <FiLock size={24} className={styles.lockIconSvg} />
                    <p className={styles.lockMsg}>Complete profile to access</p>
                  </div>
                )}
                <div className={styles.cardInner}>
                  <div className={styles.cardTopRow}>
                    <span className={`${styles.cardTag} ${styles[tagColor]}`}>
                      {tag}
                    </span>
                    <Icon size={26} className={styles.cardIconSvg} />
                  </div>
                  <p className={styles.cardLabel}>{label}</p>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardDesc}>{desc}</p>
                  <button
                    className={styles.cardBtn}
                    disabled={!profileComplete}
                  >
                    {profileComplete ? (
                      <>
                        <span>Launch</span>
                        <FiArrowRight size={13} />
                      </>
                    ) : (
                      <>
                        <FiLock size={12} />
                        <span>Locked</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── HEALTH TIPS ────────────────────────────────────── */}
      <section className={styles.tipsSection}>
        <div className={styles.tipsSectionInner}>
          <div className={styles.tipsHeader}>
            <span
              className={`${styles.sectionBadge} ${styles.sectionBadgeDark}`}
            >
              DAILY HEALTH
            </span>
            <h2 className={styles.tipsSectionTitle}>
              Stay informed. Stay healthy.
            </h2>
          </div>
          <div className={styles.tipsGrid}>
            {healthTips.map(({ Icon, tip }, i) => (
              <div key={i} className={styles.tipCard}>
                <Icon size={22} className={styles.tipIconSvg} />
                <p className={styles.tipText}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PATIENT FLOW ───────────────────────────────────── */}
      <section className={styles.flowSection}>
        <span className={`${styles.sectionBadge} ${styles.sectionBadgeDark}`}>
          THE PATIENT FLOW
        </span>
        <h2 className={styles.flowTitle}>How it works.</h2>
        <div className={styles.flowGrid}>
          {flowSteps.map((step, i) => (
            <div key={i} className={styles.flowStep}>
              <p className={styles.flowNum}>{step.num}</p>
              <h3 className={styles.flowStepTitle}>{step.title}</h3>
              <p className={styles.flowStepDesc}>{step.desc}</p>
              {i < 3 && <span className={styles.flowArrow}>· · · · ·</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <div className={styles.navLogo}>+</div>
          <span className={styles.navName}>E-Sanjeevani 2.0</span>
        </div>
        <p className={styles.footerDesc}>
          AI-powered telemedicine delivering smart healthcare consultations with
          instant specialist matching and 24/7 availability.
        </p>
        <p className={styles.footerCopy}>
          © 2026 E-Sanjeevani 2.0 · National Infrastructure V2.0
        </p>
      </footer>
    </div>
  );
}
