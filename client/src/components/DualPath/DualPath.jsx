import React from "react";
import styles from "./DualPath.module.css";

// Reusable Tech Checkmark Component
const TechCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12.5L11 15.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DualPath = () => {
  return (
    <section className={styles.section}>
      {/* Faint background grid overlay */}
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
            E-Sanjeevani 2.0 eliminates bottlenecks by separating general inquiries from critical care, dynamically routing patients based on real-time urgency data.
          </p>
        </div>

        <div className={styles.featureList}>
          
          {/* ========================================== */}
          {/* PATH A (Text Left, UI Right) */}
          {/* ========================================== */}
          <div className={styles.featureRow}>
            <div className={styles.textContent}>
              <div className={styles.pathLabel}>PATH A : KNOWLEDGE LAYER</div>
              <h3 className={styles.pathTitle}>AI Triage & Screening</h3>
              <p className={styles.pathDesc}>
                Our clinical NLP model extracts symptoms, severity, and duration in seconds. It assigns a priority score and flags potential specialties before a doctor is even involved, saving critical administrative time.
              </p>
              
              <ul className={styles.featureBullets}>
                <li><TechCheck /> Multilingual NLP (Hindi & English)</li>
                <li><TechCheck /> BioBERT-powered symptom extraction</li>
                <li><TechCheck /> Instant Urgency Scoring (1-10)</li>
              </ul>
            </div>
            
            <div className={styles.uiContent}>
              <div className={styles.ambientGlowA}></div> {/* Green Glow */}
              <div className={styles.uiWindow}>
                <div className={styles.uiHeader}>
                  <div className={styles.dots}>
                    <span></span><span></span><span></span>
                  </div>
                  <div className={styles.uiTitle}>Symptom Engine Active</div>
                </div>
                
                <div className={styles.uiBody}>
                  <div className={styles.chatUser}>
                    "Severe chest pain and shortness of breath for 10 mins."
                  </div>
                  
                  <div className={styles.chatAi}>
                    <div className={styles.aiAvatar}>AI</div>
                    <div className={styles.aiContentBox}>
                      <div className={styles.processingBar}>
                        <div className={styles.processingFill}></div>
                      </div>
                      <div className={styles.aiTags}>
                        <span className={styles.tagCritical}>URGENCY: 10/10</span>
                        <span className={styles.tagSystem}>FLAG: CARDIOLOGY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* PATH B (UI Left, Text Right) */}
          {/* ========================================== */}
          <div className={`${styles.featureRow} ${styles.featureRowReverse}`}>
            <div className={styles.textContent}>
              <div className={styles.pathLabel} style={{ color: 'var(--brand-purple)', backgroundColor: 'rgba(237, 158, 243, 0.1)', borderColor: 'rgba(237, 158, 243, 0.3)' }}>
                PATH B : CLINICAL LAYER
              </div>
              <h3 className={styles.pathTitle}>Smart Doctor Match</h3>
              <p className={styles.pathDesc}>
                Moving beyond the outdated First-Come-First-Serve model. Our bipartite matching algorithm routes critical patients directly to the front of the correct specialist's queue in real-time.
              </p>
              
              <ul className={styles.featureBullets}>
                <li><TechCheck /> Dynamic Real-time Queueing</li>
                <li><TechCheck /> Specialty & Availability Matching</li>
                <li><TechCheck /> 30% Faster Critical Response Time</li>
              </ul>
            </div>
            
            <div className={styles.uiContent}>
              <div className={styles.ambientGlowB}></div> {/* Purple Glow */}
              <div className={styles.uiWindow}>
                <div className={styles.uiHeader}>
                  <div className={styles.dots}>
                    <span></span><span></span><span></span>
                  </div>
                  <div className={styles.uiTitle}>Live Routing Matrix</div>
                </div>
                
                <div className={styles.uiBody}>
                  <div className={styles.queueItem}>
                    <div className={styles.queueLeft}>
                      <div className={styles.queueNumber}>#1</div>
                      <div>
                        <div className={styles.queueName}>Urgent Cardiac Case</div>
                        <div className={styles.queueDetail}>Matched: Dr. S. Mehta • 0m wait</div>
                      </div>
                    </div>
                    <div className={styles.queueArrow}>↑ Bypassed</div>
                  </div>
                  
                  <div className={`${styles.queueItem} ${styles.queueItemDimmed}`}>
                    <div className={styles.queueLeft}>
                      <div className={styles.queueNumber}>#2</div>
                      <div>
                        <div className={styles.queueName}>General Consultation</div>
                        <div className={styles.queueDetail}>Urgency: 3/10 • 12m wait</div>
                      </div>
                    </div>
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