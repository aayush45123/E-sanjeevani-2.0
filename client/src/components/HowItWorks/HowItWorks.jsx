// HowItWorks.jsx — Minimal numbered steps, bordered row layout
import React from "react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "01",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2l4 4-4 4M22 6h-4"/></svg>,
    title: "Check Your Symptoms",
    desc: "Answer guided questions in our AI triage system. Takes under 2 minutes.",
    detail: "~2 min",
  },
  {
    num: "02",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    title: "Get Matched Instantly",
    desc: "Our algorithm finds the right specialist based on your triage and availability.",
    detail: "Real-time matching",
  },
  {
    num: "03",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    title: "Consult a Doctor",
    desc: "Secure HD video consultation. No waiting rooms, no travel.",
    detail: "End-to-end encrypted",
  },
  {
    num: "04",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
    title: "Get Your Prescription",
    desc: "Receive digitally signed prescriptions and follow-up plan instantly.",
    detail: "Digitally verified",
  },
];

const HowItWorks = () => (
  <section className={styles.section} id="how-it-works">
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>How it works</span>
        <h2 className={styles.title}>From symptom to prescription.</h2>
        <p className={styles.subtitle}>Four simple steps. No paperwork. No waiting.</p>
      </div>
      <div className={styles.steps}>
        {steps.map(s => (
          <div key={s.num} className={styles.step}>
            <div className={styles.stepNum}>{s.num}</div>
            <div className={styles.stepIcon}>{s.icon}</div>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className={styles.stepDesc}>{s.desc}</p>
            <div className={styles.stepDetail}>
              <span className={styles.stepDetailDot} />
              {s.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
