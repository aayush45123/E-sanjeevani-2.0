// FeaturesGrid.jsx — Clean 3-column card grid
import React from "react";
import styles from "./FeaturesGrid.module.css";

const features = [
  {
    tag: "Core",
    title: "HD Video Consultations",
    desc: "Consult with board-certified doctors face-to-face from anywhere. Fully encrypted, zero waiting rooms.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
  {
    tag: "AI-Powered",
    title: "GPT-4 Symptom Checker",
    desc: "Describe your symptoms and receive an AI triage report in under 2 minutes, backed by clinical logic.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><path d="M18 2l4 4-4 4M22 6h-4"/>
      </svg>
    ),
  },
  {
    tag: "Automation",
    title: "Smart Scheduling",
    desc: "Book available slots with the right specialist in under 60 seconds. Real-time calendar, no conflicts.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    tag: "Records",
    title: "Digital Prescriptions",
    desc: "Receive digitally signed prescriptions instantly after every consultation. Share directly with pharmacies.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    tag: "Privacy",
    title: "Lifetime Medical Records",
    desc: "Your complete history — tests, diagnoses, prescriptions — securely stored and accessible anytime.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    tag: "For Doctors",
    title: "Doctor Analytics",
    desc: "Patient trends, revenue tracking, consultation metrics and ratings — all in one clean dashboard.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

const FeaturesGrid = () => (
  <section className={styles.section} id="platform">
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Platform</span>
        <h2 className={styles.title}>Packed with everything you need.</h2>
        <p className={styles.subtitle}>
          From AI triage to video consultations — eSanjeevani handles the full care journey
          so you can focus on what matters.
        </p>
      </div>
      <div className={styles.grid}>
        {features.map((f) => (
          <div key={f.title} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconBox}>{f.icon}</div>
              <span className={styles.tag}>{f.tag}</span>
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesGrid;
