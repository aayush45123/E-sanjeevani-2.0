import React from "react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import styles from "./Hero.module.css";
import dashboardMockupImg from "../../assets/dashboard_mockup.png";

const Hero = () => {
  const { checkAuthAndNavigate } = useAuthGuard();

  const handleStartConsultation = () => {
    checkAuthAndNavigate("/ai-triage");
  };

  const handleWhitepaper = () => {
    // Whitepaper is public, so just navigate directly
    // You can change this if whitepaper should also be auth-protected
    window.open("/whitepaper.pdf", "_blank");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Centered Hero Content */}
      <div className={styles.heroContent}>
        {/* Sleek Pill Tag */}
        <div className={styles.topTag}>
          <span className={styles.tagBadge}>NEW</span>
          E-Sanjeevani 2.0 is now live!
        </div>

        {/* Clean, Bold, Sans-Serif Title */}
        <h1 className={styles.title}>
          Smart Healthcare & Instant
          <br />
          Consultations. Get Your Care Back.
        </h1>

        {/* Description */}
        <p className={styles.description}>
          Harness the power of AI telemetry and automated triage to deliver
          seamless, clinical-grade precision at a national scale.
        </p>

        {/* Side-by-Side CTAs */}
        <div className={styles.ctaWrapper}>
          <button
            className={styles.btnPrimary}
            onClick={handleStartConsultation}
          >
            Start AI Consultation
          </button>

          <button className={styles.btnSecondary} onClick={handleWhitepaper}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Technical Whitepaper
          </button>
        </div>

        {/* Glowing Dashboard Anchor - Main container for the mockup section */}
        <div className={styles.dashboardAnchor}>
          {/* Vibrant gradient glow behind the mockup */}
          <div className={styles.dashboardGlow}></div>
          {/* This new container holds the clean border and shadow effect */}
          <div className={styles.dashboardContainer}>
            <img src={dashboardMockupImg} alt="Dashboard Preview" className={styles.dashboardImage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;