import React from "react";
import styles from "../ClinicalIntelligence.module.css";

const PatientFlow = () => {
  return (
    <section className={styles.sectionFlow}>
      <div className={styles.container}>
        <div className={styles.journeySection}>
          <h3 className={styles.sectionSubtitle}>Optimized Patient Flow</h3>
          
          <div className={styles.timeline}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h4 className={styles.stepTitle}>AI Intake</h4>
              <p className={styles.stepDesc}>Patient interacts with AI. Simple issues are resolved instantly; complex issues trigger symptom collection.</p>
            </div>
            
            <div className={styles.stepConnector}></div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h4 className={styles.stepTitle}>Urgency Scoring</h4>
              <p className={styles.stepDesc}>The engine assigns a 1-10 severity score based on the extracted symptoms and predicts the required specialty.</p>
            </div>

            <div className={styles.stepConnector}></div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h4 className={styles.stepTitle}>Dynamic Match</h4>
              <p className={styles.stepDesc}>The weighted algorithm cross-references Urgency, Specialty, and Availability to bypass the standard queue.</p>
            </div>

            <div className={styles.stepConnector}></div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>04</div>
              <h4 className={styles.stepTitle}>Instant Connection</h4>
              <p className={styles.stepDesc}>Emergency patients are connected to the optimal doctor in &lt;3 minutes for secure video consultation.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientFlow;