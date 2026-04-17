import React from "react";
import styles from "../ClinicalIntelligence.module.css";

// Premium SVG Icons with Soft Circular Backgrounds
const CrossIcon = () => (
  <div className={styles.iconWrapperNegative}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </div>
);

const CheckIcon = () => (
  <div className={styles.iconWrapperPositive}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </div>
);

const SystemComparison = () => {
  return (
    <section className={styles.sectionComparison}>
      <div className={styles.container}>
        <div className={styles.comparisonHeader}>
          <h3 className={styles.sectionSubtitle}>The System Upgrade</h3>
          <p className={styles.sectionSubDesc}>How our architecture directly solves the critical failures of the current national platform.</p>
        </div>

        <div className={styles.comparisonGrid}>
          
          {/* Legacy System - Muted, Faded, Outdated look */}
          <div className={styles.legacyCard}>
            <div className={styles.compareHeader}>Current E-Sanjeevani</div>
            <ul className={styles.compareList}>
              <li className={styles.negativeItem}>
                <CrossIcon /> 
                <span>20-30 minute wait times for all patients</span>
              </li>
              <li className={styles.negativeItem}>
                <CrossIcon /> 
                <span>First-Come-First-Serve (No emergency priority)</span>
              </li>
              <li className={styles.negativeItem}>
                <CrossIcon /> 
                <span>Every single query requires human doctor time</span>
              </li>
              <li className={styles.negativeItem}>
                <CrossIcon /> 
                <span>Doctors are severely overwhelmed and fatigued</span>
              </li>
            </ul>
          </div>

          {/* V2.0 System - Premium, Glowing, Elevated look */}
          <div className={styles.v2Card}>
            {/* The beautiful soft inner glow */}
            <div className={styles.ambientGlowLight}></div>
            
            <div className={styles.compareHeaderV2}>
              E-Sanjeevani 2.0
              <span className={styles.liveTag}>50-67% FASTER</span>
            </div>
            <ul className={styles.compareList}>
              <li className={styles.positiveItem}>
                <CheckIcon /> 
                <span>Emergency cases seen in under 3 minutes</span>
              </li>
              <li className={styles.positiveItem}>
                <CheckIcon /> 
                <span>Smart Urgency Routing pushes critical cases to the front</span>
              </li>
              <li className={styles.positiveItem}>
                <CheckIcon /> 
                <span>AI chatbot autonomously resolves simple queries</span>
              </li>
              <li className={styles.positiveItem}>
                <CheckIcon /> 
                <span>30% reduction in unnecessary doctor consultations</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SystemComparison;