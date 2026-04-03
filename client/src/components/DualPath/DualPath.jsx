import React from "react";
import styles from "./DualPath.module.css";

const TechCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12.5L11 15.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DualPath = () => {
  return (
    <section className={styles.section}>
      <div className={styles.lightGrid}></div>

      <div className={styles.container}>
        
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.tag}>
            <span className={styles.tagDot}></span>
            ARCHITECTURE OVERVIEW
          </div>
          <h2 className={styles.title}>Two distinct paths.<br/>One intelligent platform.</h2>
          <p className={styles.description}>
            E-Sanjeevani 2.0 separates general inquiries from critical care, dynamically routing patients based on real-time urgency data.
          </p>
        </div>

        {/* NEW: Side-by-Side Bifurcation Layout */}
        <div className={styles.splitGrid}>
          
          {/* ========================================== */}
          {/* PATH A: KNOWLEDGE LAYER */}
          {/* ========================================== */}
          <div className={styles.pathCard}>
            <div className={styles.cardContent}>
              <div className={styles.pathLabelA}>PATH A : KNOWLEDGE</div>
              <h3 className={styles.pathTitle}>AI Triage & Screening</h3>
              <p className={styles.pathDesc}>
                Our clinical NLP model extracts symptoms, severity, and duration in seconds. It assigns a priority score before a doctor is even involved.
              </p>
              
              <ul className={styles.featureBullets}>
                <li><TechCheck /> BioBERT symptom extraction</li>
                <li><TechCheck /> Instant Urgency Scoring (1-10)</li>
              </ul>
            </div>

            {/* Micro-UI A */}
            <div className={styles.microUiWrapper}>
              <div className={styles.microUiA}>
                <div className={styles.uiHeader}>
                  <div className={styles.dots}><span></span><span></span><span></span></div>
                  <div className={styles.uiTitle}>Symptom Engine</div>
                </div>
                <div className={styles.uiBody}>
                  <div className={styles.chatUser}>"Severe chest pain for 10 mins"</div>
                  <div className={styles.chatAi}>
                    <div className={styles.aiAvatar}>AI</div>
                    <div className={styles.aiContentBox}>
                      <div className={styles.aiTags}>
                        <span className={styles.tagCritical}>URGENCY: 10/10</span>
                        <span className={styles.tagSystem}>CARDIOLOGY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* PATH B: CLINICAL LAYER */}
          {/* ========================================== */}
          <div className={styles.pathCard}>
            <div className={styles.cardContent}>
              <div className={styles.pathLabelB}>PATH B : CLINICAL</div>
              <h3 className={styles.pathTitle}>Smart Doctor Match</h3>
              <p className={styles.pathDesc}>
                Moving beyond First-Come-First-Serve. Our bipartite algorithm routes critical patients directly to the front of the correct specialist's queue.
              </p>
              
              <ul className={styles.featureBullets}>
                <li><TechCheck /> Dynamic Real-time Queueing</li>
                <li><TechCheck /> Specialty & Availability Matching</li>
              </ul>
            </div>

            {/* Micro-UI B */}
            <div className={styles.microUiWrapper}>
              <div className={styles.microUiB}>
                <div className={styles.uiHeader}>
                  <div className={styles.dots}><span></span><span></span><span></span></div>
                  <div className={styles.uiTitle}>Live Routing</div>
                </div>
                <div className={styles.uiBody}>
                  <div className={styles.queueItem}>
                    <div className={styles.queueLeft}>
                      <div className={styles.queueNumber}>#1</div>
                      <div>
                        <div className={styles.queueName}>Urgent Cardiac Case</div>
                        <div className={styles.queueDetail}>Dr. S. Mehta • 0m wait</div>
                      </div>
                    </div>
                    <div className={styles.queueArrow}>↑ Bypass</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DualPath;