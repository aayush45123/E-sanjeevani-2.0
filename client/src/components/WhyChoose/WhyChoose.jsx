// WhyChoose.jsx — Technical credibility section
// Replaces Testimonials — highlights real platform strengths
import React from "react";
import styles from "./WhyChoose.module.css";

const strengths = [
  {
    id: "ai-triage",
    label: "AI Triage",
    title: "Clinical AI Symptom Analysis",
    desc: "Powered by a custom-trained ML model and II-Medical-8B. Delivers a structured triage report with urgency classification, specialist recommendation, and clinical guidance in under 2 minutes.",
    badge: "II-Medical-8B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/>
        <path d="M12 8v4l3 3"/>
        <path d="M18 2l4 4-4 4M22 6h-4"/>
      </svg>
    ),
  },
  {
    id: "matching",
    label: "Smart Matching",
    title: "Algorithmic Doctor Matching",
    desc: "Our algorithm pairs patients with the right specialist based on triage outcome, symptom classification, and real-time doctor availability — no manual searching, no guessing.",
    badge: "Real-time",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    id: "video",
    label: "Consultations",
    title: "Secure HD Video Consultations",
    desc: "End-to-end encrypted video sessions built on WebRTC. Patients connect face-to-face with verified doctors from any device, without any downloads or third-party software.",
    badge: "WebRTC · E2E Encrypted",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    title: "Instant Digital Prescriptions",
    desc: "Digitally signed prescriptions are generated immediately after every consultation. Structured, verifiable, and shareable directly with pharmacies — no paper required.",
    badge: "Digitally Signed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: "database",
    label: "Infrastructure",
    title: "Production-Grade Architecture",
    desc: "Built on a PostgreSQL relational database with structured clinical data, full medical history, and ACID-compliant transactions. Designed for reliability at scale, not just prototypes.",
    badge: "PostgreSQL · Node.js",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Real-time",
    title: "Real-time Notification System",
    desc: "Socket.io-powered event system keeps patients and doctors informed at every step. Instant alerts when a consultation starts, a doctor joins, or a prescription is ready.",
    badge: "Socket.io",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

const WhyChoose = () => (
  <section className={styles.section} id="triage">
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Why eSanjeevani</span>
        <h2 className={styles.title}>Built for modern healthcare.</h2>
        <p className={styles.subtitle}>
          Every feature is purpose-built for clinical workflows.
          Production infrastructure, not a prototype.
        </p>
      </div>

      <div className={styles.grid}>
        {strengths.map((item) => (
          <div key={item.id} className={styles.card} id={`why-${item.id}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>{item.icon}</div>
              <span className={styles.label}>{item.label}</span>
            </div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDesc}>{item.desc}</p>
            <div className={styles.badge}>{item.badge}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChoose;
