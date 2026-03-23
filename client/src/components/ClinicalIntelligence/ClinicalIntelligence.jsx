import React from "react";
import styles from "./ClinicalIntelligence.module.css";

const ClinicalIntelligence = () => {
  return (
    <div className={styles.wrapper}>
      
      {/* ========================================== */}
      {/* TOP SECTION: DARK (Tech Stack) */}
      {/* ========================================== */}
      <section className={styles.sectionDarkTop}>
        <div className={styles.container}>
          
          <div className={styles.header}>
            <div className={styles.tag}>
              <span className={styles.tagDot}></span>
              CLINICAL INTELLIGENCE
            </div>
            <h2 className={styles.title}>Powered by predictive AI.</h2>
            <p className={styles.description}>
              We replaced manual triage with high-fidelity machine learning models, ensuring every patient is evaluated and routed with clinical-grade precision in milliseconds.
            </p>
          </div>

          <div className={styles.modelGrid}>
            <div className={styles.modelCard}>
              <div className={styles.modelIconWrapper} style={{ color: 'var(--brand-purple)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className={styles.modelTag}>NLP ENGINE</div>
              <h3 className={styles.modelTitle}>BioBERT & ClinicalBERT</h3>
              <p className={styles.modelDesc}>
                Conversational symptom extraction with Medical Named Entity Recognition (NER). Understands complex health queries in multiple languages.
              </p>
            </div>

            <div className={styles.modelCard}>
              <div className={styles.modelIconWrapper} style={{ color: 'var(--brand-orange)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div className={styles.modelTag}>PREDICTION MODEL</div>
              <h3 className={styles.modelTitle}>XGBoost / Random Forest</h3>
              <p className={styles.modelDesc}>
                Analyzes extracted symptoms to predict top possible diseases and generate an accurate 1-10 Urgency Score for immediate triage.
              </p>
            </div>

            <div className={styles.modelCard}>
              <div className={styles.modelIconWrapper} style={{ color: 'var(--brand-green-dark)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
                </svg>
              </div>
              <div className={styles.modelTag}>ROUTING ALGORITHM</div>
              <h3 className={styles.modelTitle}>Hungarian Algorithm</h3>
              <p className={styles.modelDesc}>
                A hybrid optimization model weighing Urgency (40%), Specialty (25%), and Availability (20%) to find the mathematically perfect doctor match.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* MIDDLE SECTION: LIGHT (Comparison) */}
      {/* ========================================== */}
      <section className={styles.sectionLightMiddle}>
        <div className={styles.container}>
          
          <div className={styles.comparisonSection}>
            <h3 className={styles.sectionSubtitleLight}>The System Upgrade</h3>
            <div className={styles.comparisonGrid}>
              
              <div className={styles.legacyCard}>
                <div className={styles.compareHeader}>Current E-Sanjeevani</div>
                <ul className={styles.compareList}>
                  <li className={styles.negativeItem}>
                    <span className={styles.cross}>✕</span> First-Come-First-Serve Queueing
                  </li>
                  <li className={styles.negativeItem}>
                    <span className={styles.cross}>✕</span> Critical cases wait behind non-urgent cases
                  </li>
                  <li className={styles.negativeItem}>
                    <span className={styles.cross}>✕</span> No preliminary symptom screening
                  </li>
                  <li className={styles.negativeItem}>
                    <span className={styles.cross}>✕</span> Inefficient doctor specialty allocation
                  </li>
                </ul>
              </div>

              <div className={styles.v2Card}>
                <div className={styles.ambientGlowLight}></div>
                <div className={styles.compareHeaderV2}>E-Sanjeevani 2.0</div>
                <ul className={styles.compareList}>
                  <li className={styles.positiveItem}>
                    <span className={styles.check}>✓</span> Smart Urgency-Based Routing
                  </li>
                  <li className={styles.positiveItem}>
                    <span className={styles.check}>✓</span> Critical cases bypass the standard queue
                  </li>
                  <li className={styles.positiveItem}>
                    <span className={styles.check}>✓</span> AI chatbot pre-collects medical history
                  </li>
                  <li className={styles.positiveItem}>
                    <span className={styles.check}>✓</span> Mathematically optimized specialty matching
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* BOTTOM SECTION: DARK (Journey Flow) */}
      {/* ========================================== */}
      <section className={styles.sectionDarkBottom}>
        <div className={styles.container}>
          
          <div className={styles.journeySection}>
            <h3 className={styles.sectionSubtitleDark}>The Patient Flow</h3>
            
            <div className={styles.timeline}>
              
              {/* Step 1: Mapped to 'Patient Path' in flowchart */}
              <div className={styles.step}>
                <div className={styles.stepNumber}>01</div>
                <h4 className={styles.stepTitle}>Profile & Chatbot</h4>
                <p className={styles.stepDesc}>After login, the patient sets up their health profile and interacts directly with the AI Symptom Chatbot.</p>
              </div>
              
              <div className={styles.stepConnector}></div>

              {/* Step 2: Mapped to 'AI Engine' in flowchart */}
              <div className={styles.step}>
                <div className={styles.stepNumber}>02</div>
                <h4 className={styles.stepTitle}>AI Triage Engine</h4>
                <p className={styles.stepDesc}>The engine calculates a decision route: Low (Self-Care), Mid (Algorithm Match), or Emergency (Priority Alert).</p>
              </div>

              <div className={styles.stepConnector}></div>

              {/* Step 3: Mapped to 'Triage and Routing' in flowchart */}
              <div className={styles.step}>
                <div className={styles.stepNumber}>03</div>
                <h4 className={styles.stepTitle}>Smart Routing</h4>
                <p className={styles.stepDesc}>Patients receive a Match Score or Priority Alert and are routed directly to the correct doctor's Waiting Room.</p>
              </div>

              <div className={styles.stepConnector}></div>

              {/* Step 4: Mapped to 'Service Delivery' in flowchart */}
              <div className={styles.step}>
                <div className={styles.stepNumber}>04</div>
                <h4 className={styles.stepTitle}>Service Delivery</h4>
                <p className={styles.stepDesc}>The doctor reviews the Patient Info Panel, conducts a video consultation, and generates the final prescription.</p>
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default ClinicalIntelligence;