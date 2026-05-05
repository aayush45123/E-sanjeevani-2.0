// Footer.jsx
import React from "react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import styles from "./Footer.module.css";

const Footer = () => {
  const { checkAuthAndNavigate } = useAuthGuard();
  const currentYear = new Date().getFullYear();

  const handleStartConsultation = () => {
    checkAuthAndNavigate("/ai-triage");
  };

  const handleReadWhitepaper = () => {
    window.open("/whitepaper.pdf", "_blank");
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* ========================================== */}
        {/* PRE-FOOTER CTA (Very common in premium SaaS) */}
        {/* ========================================== */}
        <div className={styles.preFooter}>
          <h2 className={styles.ctaTitle}>
            Ready to experience the future of healthcare?
          </h2>
          <p className={styles.ctaDesc}>
            Join the platform that is reducing emergency wait times by 67%.
          </p>
          <div className={styles.ctaButtons}>
            <button className={styles.btnPrimary}>Start AI Consultation</button>
            <button className={styles.btnSecondary}>Read Whitepaper</button>
          </div>
        </div>

        {/* ========================================== */}
        {/* MAIN FOOTER CONTENT */}
        {/* ========================================== */}
        <div className={styles.mainFooter}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <div className={styles.logoIconWrapper}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <span className={styles.logoText}>E-Sanjeevani 2.0</span>
            </div>
            <p className={styles.brandDescription}>
              An advanced, AI-powered telemedicine infrastructure designed to
              eliminate wait times and dynamically route critical patients.
            </p>
            <div className={styles.social}>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a
                href="#"
                className={styles.socialLink}
                aria-label="Documentation"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Platform</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#triage" className={styles.link}>
                    AI Symptom Triage
                  </a>
                </li>
                <li>
                  <a href="#routing" className={styles.link}>
                    Smart Routing Engine
                  </a>
                </li>
                <li>
                  <a href="#telemetry" className={styles.link}>
                    Clinical Telemetry
                  </a>
                </li>
                <li>
                  <a href="#security" className={styles.link}>
                    Data Security
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Project Info</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#architecture" className={styles.link}>
                    System Architecture
                  </a>
                </li>
                <li>
                  <a href="#algorithms" className={styles.link}>
                    Matching Algorithm
                  </a>
                </li>
                <li>
                  <a href="#whitepaper" className={styles.link}>
                    Technical Whitepaper
                  </a>
                </li>
                <li>
                  <a href="#github" className={styles.link}>
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Legal & Support</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#privacy" className={styles.link}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className={styles.link}>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#compliance" className={styles.link}>
                    HIPAA Compliance
                  </a>
                </li>
                <li>
                  <a href="#contact" className={styles.link}>
                    Contact Team
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BOTTOM SECTION */}
        {/* ========================================== */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} E-Sanjeevani 2.0. All rights reserved.
          </p>

          <div className={styles.projectBadge}>
            <span className={styles.pulseDot}></span>
            B.Tech Final Year Major Project
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
