import React from "react";
// import styles from "./ClinicalIntelligence.module.css";
import styles from "../ClinicalIntelligence.module.css";

const CoreInnovation = () => {
  return (
    <section className={styles.sectionTech}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <span className={styles.tagDot}></span>
            CORE INNOVATION
          </div>
          <h2 className={styles.title}>The Smart Matching Algorithm.</h2>
          <p className={styles.description}>
            We completely engineered away the flawed "First-Come-First-Serve" model. E-Sanjeevani 2.0 dynamically routes patients using a proprietary weighted matching system to ensure emergencies are handled in under 3 minutes.
          </p>
        </div>

        <div className={styles.modelGrid}>
          <div className={styles.modelCard}>
            <div className={`${styles.modelIconWrapper} ${styles.iconPurple}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className={styles.modelTag}>PATH 1</div>
            <h3 className={styles.modelTitle}>AI Health Assistant</h3>
            <p className={styles.modelDesc}>
              Handles simple, non-critical health queries instantly without requiring a doctor. This single feature reduces the overall physician workload by 30%.
            </p>
          </div>

          <div className={styles.modelCard}>
            <div className={`${styles.modelIconWrapper} ${styles.iconOrange}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className={styles.modelTag}>PATH 2</div>
            <h3 className={styles.modelTitle}>Urgency Analysis Engine</h3>
            <p className={styles.modelDesc}>
              For serious cases, the AI extracts symptoms, predicts potential diseases, and assigns a strict 1-10 Urgency Score before routing the patient.
            </p>
          </div>

          <div className={styles.modelCard}>
            <div className={`${styles.modelIconWrapper} ${styles.iconGreen}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
              </svg>
            </div>
            <div className={styles.modelTag}>THE ALGORITHM</div>
            <h3 className={styles.modelTitle}>Weighted Smart Match</h3>
            <p className={styles.modelDesc}>
              Calculates the perfect doctor via: <strong>40%</strong> Urgency, <strong>25%</strong> Specialty, <strong>20%</strong> Availability, <strong>10%</strong> Language, and <strong>5%</strong> History.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreInnovation;