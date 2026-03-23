// Hero.jsx
import React from "react";
import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <div className={styles.pageWrapper}>
      
      {/* Absolute Right-Side Telemetry Grid */}
      <div className={styles.sideGrid}></div>

      {/* Centered Hero Content */}
      <div className={styles.heroContent}>
        
        {/* Top Technical Tag (Geist Mono) */}
        <div className={styles.topTag}>
          NATIONAL INFRASTRUCTURE V2.0
        </div>

        {/* Massive Editorial Title (Montagu Slab) */}
        <h1 className={styles.title}>
          Smart Healthcare, <span className={styles.titleAccent}>instant</span>
          <br />
          <span className={styles.titleAccent}>consultations.</span>
          <br />
          Get your care back.
        </h1>

        {/* Narrow Subtitle */}
        <p className={styles.description}>
          E-Sanjeevani 2.0 leverages high-fidelity AI telemetry and automated triage to deliver seamless, clinical-grade precision at a national scale.
        </p>

        {/* Glowing CTA Area */}
        <div className={styles.ctaWrapper}>
          <button className={styles.btnPrimary}>
            Start AI Consultation Now
          </button>
          
          {/* Bottom Document Link (Geist Mono) */}
          <div className={styles.bottomLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {/* TECHNICAL WHITEPAPER */}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;