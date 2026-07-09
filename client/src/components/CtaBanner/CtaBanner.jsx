// CtaBanner.jsx — Minimal dark CTA section
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CtaBanner.module.css";

const CtaBanner = () => {
  const navigate = useNavigate();
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          Get started today
        </span>
        <h2 className={styles.title}>Start your digital healthcare journey.</h2>
        <p className={styles.sub}>
          Join 50,000+ patients and 2,800+ verified doctors already on eSanjeevani.
        </p>
        <div className={styles.buttons}>
          <button className={styles.btnPrimary} onClick={() => navigate("/auth")} id="cta-patient">
            I'm a Patient
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate("/auth")} id="cta-doctor">
            I'm a Doctor
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <p className={styles.trust}>Free to sign up · No credit card required · HIPAA aligned</p>
      </div>
    </section>
  );
};

export default CtaBanner;
