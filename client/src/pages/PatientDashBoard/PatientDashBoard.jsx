import { useState } from "react";
import styles from "./PatientDashboard.module.css";

const mockUser = {
  name: "Aayush Sharma",
  profileComplete: false, // toggle to true to see unlocked state
};

const healthTips = [
  { emoji: "💧", tip: "Drink 8 glasses of water daily" },
  { emoji: "🚶", tip: "30 minutes of walking improves heart health" },
  { emoji: "😴", tip: "7–9 hours of sleep boosts immunity" },
  { emoji: "🥦", tip: "Include greens in every meal" },
];

export default function PatientDashboard() {
  const [profileComplete] = useState(mockUser.profileComplete);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const firstName = mockUser.name.split(" ")[0];

  const featureCards = [
    {
      id: "ai-check",
      icon: "🤖",
      label: "AI TRIAGE",
      title: "AI Symptom Check",
      desc: "Describe your symptoms and get an instant urgency score.",
      tag: "KNOWLEDGE LAYER",
      tagColor: styles.tagGreen,
    },
    {
      id: "consult",
      icon: "👨‍⚕️",
      label: "CLINICAL LAYER",
      title: "Consult Doctor",
      desc: "Get matched to the right specialist in real-time.",
      tag: "SMART ROUTING",
      tagColor: styles.tagPurple,
    },
    {
      id: "skin",
      icon: "📸",
      label: "DERMA AI",
      title: "Upload Skin Image",
      desc: "AI-powered dermatology screening in seconds.",
      tag: "VISION MODEL",
      tagColor: styles.tagOrange,
    },
  ];

  return (
    <div className={styles.page}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>✚</div>
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
          <button className={styles.navProfile}>
            <span>{firstName[0]}</span>
          </button>
          <button className={styles.signOutBtn}>Sign Out</button>
        </div>
      </nav>

      {/* HERO SECTION */}
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

        {/* PROFILE INCOMPLETE BANNER */}
        {!profileComplete && (
          <div className={styles.profileBanner}>
            <div className={styles.bannerLeft}>
              <span className={styles.bannerIcon}>⚠️</span>
              <div>
                <p className={styles.bannerTitle}>Profile Incomplete</p>
                <p className={styles.bannerDesc}>
                  Complete your health profile to unlock AI consultations and
                  doctor matching.
                </p>
              </div>
            </div>
            <a href="/profile-setup" className={styles.bannerBtn}>
              Complete Profile →
            </a>
          </div>
        )}
      </section>

      {/* STATS ROW */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {[
            { label: "CONSULTATIONS", value: "0", sub: "No sessions yet" },
            { label: "URGENCY SCORE", value: "—", sub: "Run AI Triage first" },
            { label: "MATCHED DOCTORS", value: "—", sub: "Profile needed" },
            { label: "HEALTH RECORDS", value: "0", sub: "Upload your first" },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statSub}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EMERGENCY BUTTON */}
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
          >
            {emergencyActive ? "🚨 Connecting..." : "🚨 Start Emergency"}
          </button>
        </div>
      </section>

      {/* FEATURE CARDS */}
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
          {featureCards.map((card) => (
            <div
              key={card.id}
              className={`${styles.featureCard} ${!profileComplete ? styles.featureCardLocked : ""}`}
            >
              {!profileComplete && (
                <div className={styles.lockOverlay}>
                  <span className={styles.lockIcon}>🔒</span>
                  <p className={styles.lockMsg}>Complete profile to access</p>
                </div>
              )}
              <div className={styles.cardInner}>
                <div className={styles.cardTopRow}>
                  <span className={`${styles.cardTag} ${card.tagColor}`}>
                    {card.tag}
                  </span>
                  <span className={styles.cardEmoji}>{card.icon}</span>
                </div>
                <p className={styles.cardLabel}>{card.label}</p>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.desc}</p>
                <button className={styles.cardBtn} disabled={!profileComplete}>
                  {profileComplete ? "Launch →" : "Locked"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HEALTH TIPS */}
      <section className={styles.tipsSection}>
        <div className={styles.tipsSectionInner}>
          <div className={styles.tipsHeader}>
            <span className={styles.sectionBadge}>DAILY HEALTH</span>
            <h2 className={styles.tipsSectionTitle}>
              Stay informed. Stay healthy.
            </h2>
          </div>
          <div className={styles.tipsGrid}>
            {healthTips.map((t, i) => (
              <div key={i} className={styles.tipCard}>
                <span className={styles.tipEmoji}>{t.emoji}</span>
                <p className={styles.tipText}>{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PATIENT FLOW */}
      <section className={styles.flowSection}>
        <span
          className={styles.sectionBadge}
          style={{ marginBottom: "var(--space-4)" }}
        >
          THE PATIENT FLOW
        </span>
        <h2 className={styles.flowTitle}>How it works.</h2>
        <div className={styles.flowGrid}>
          {[
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
              desc: "Doctor reviews your info, conducts video consultation, generates prescription.",
            },
          ].map((step, i) => (
            <div key={i} className={styles.flowStep}>
              <p className={styles.flowNum}>{step.num}</p>
              <h3 className={styles.flowStepTitle}>{step.title}</h3>
              <p className={styles.flowStepDesc}>{step.desc}</p>
              {i < 3 && <span className={styles.flowArrow}>· · · · ·</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <div
            className={styles.navLogo}
            style={{ background: "var(--brand-green-dark)" }}
          >
            ✚
          </div>
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
