import React, { useState, useEffect } from "react";
import {
  FiHelpCircle,
  FiVideo,
  FiCalendar,
  FiFileText,
  FiShield,
  FiChevronDown,
  FiChevronUp,
  FiMail,
  FiPhoneCall,
  FiZap,
} from "react-icons/fi";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./DoctorHelp.module.css";
import { authApi } from "../../utils/api";
import { performLogout } from "../../utils/auth";

export default function DoctorHelp({ isProfileIncomplete = false }) {
  const [user, setUser] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const handleLogout = () => performLogout();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await authApi.me();
        setUser(res.data.user || res.data);
      } catch (err) {
        console.error("Failed to fetch user in Help Center:", err);
      }
    }
    fetchUser();
  }, []);

  const faqs = [
    {
      id: 1,
      question: "How do I manage and set up my weekly availability hours?",
      answer:
        "Go to Settings (or click your profile card in the sidebar), select the Availability Engine tab. You can configure Custom Date slots, Weekly recurring schedules, or Monthly batch availability slots.",
    },
    {
      id: 2,
      question: "How do Video Consultations work with patients?",
      answer:
        "When an appointment starts, navigate to Today's Schedule on your Dashboard or My Patients. Click 'Join Call' to enter the WebRTC HD video consultation room. You can chat, view medical history, and issue digital prescriptions during the call.",
    },
    {
      id: 3,
      question: "How do I issue an official eSanjeevani Digital Prescription?",
      answer:
        "During or after a consultation session, open the Prescription drawer in the Video Call interface. Enter diagnosis, add medicines (dosage, frequency, duration), advice, and click 'Issue Prescription'. A verified PDF prescription is generated automatically.",
    },
    {
      id: 4,
      question: "How does the AI Triage System assist doctor decision-making?",
      answer:
        "eSanjeevani 2.0 uses AI triage models to pre-screen patient symptom descriptions prior to your appointment. It highlights urgency flags (Low, Medium, High, Critical) in your schedule view so you can prioritize critical patients.",
    },
    {
      id: 5,
      question: "What should I do if a patient doesn't show up for a video call?",
      answer:
        "If a patient does not join within 10 minutes of the scheduled start time, the system will send an automated reminder. You can mark the appointment as expired or reschedule if necessary.",
    },
  ];

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className={styles.helpLayout}>
      <DoctorSidebar
        user={user}
        isProfileIncomplete={isProfileIncomplete}
        onLogout={handleLogout}
      />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Doctor Help Center & Guide</h1>
          <p className={styles.pageSubtitle}>
            Find guides, FAQs, and assistance for managing your practice on eSanjeevani 2.0.
          </p>
        </div>

        {/* Quick Feature Cards */}
        <div className={styles.quickCardsGrid}>
          <div className={styles.card}>
            <div
              className={styles.iconWrapper}
              style={{ background: "#eff6ff", color: "#2563eb" }}
            >
              <FiCalendar size={22} />
            </div>
            <h3 className={styles.cardTitle}>Schedule Management</h3>
            <p className={styles.cardDescription}>
              Easily configure working days, set slot durations, and manage recurring weekly availability.
            </p>
          </div>

          <div className={styles.card}>
            <div
              className={styles.iconWrapper}
              style={{ background: "#f0fdf4", color: "#059669" }}
            >
              <FiVideo size={22} />
            </div>
            <h3 className={styles.cardTitle}>Tele-Consultations</h3>
            <p className={styles.cardDescription}>
              High-definition video & audio consultations equipped with real-time symptom triage notes.
            </p>
          </div>

          <div className={styles.card}>
            <div
              className={styles.iconWrapper}
              style={{ background: "#f5f3ff", color: "#7c3aed" }}
            >
              <FiFileText size={22} />
            </div>
            <h3 className={styles.cardTitle}>Digital Prescriptions</h3>
            <p className={styles.cardDescription}>
              Generate signed PDF prescriptions with auto-filled medicine dosages and clinical advice.
            </p>
          </div>

          <div className={styles.card}>
            <div
              className={styles.iconWrapper}
              style={{ background: "#fffbeb", color: "#d97706" }}
            >
              <FiZap size={22} />
            </div>
            <h3 className={styles.cardTitle}>AI Triage Assistance</h3>
            <p className={styles.cardDescription}>
              Intelligent patient symptom analysis to categorize cases into urgency levels.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}
                >
                  <button
                    className={styles.faqHeader}
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </button>
                  {isOpen && <div className={styles.faqBody}>{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Contact Banner */}
        <div className={styles.supportBanner}>
          <div className={styles.supportInfo}>
            <h3>Need technical or medical support?</h3>
            <p>
              Our dedicated eSanjeevani support team is available 24/7 to assist with platform operations.
            </p>
          </div>
          <button
            className={styles.contactBtn}
            onClick={() => window.open("mailto:support@esanjeevani.gov.in")}
          >
            Contact Support
          </button>
        </div>
      </main>
    </div>
  );
}
