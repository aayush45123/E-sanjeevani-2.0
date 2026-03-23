// Footer.jsx
import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Section */}
        <div className={styles.top}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect
                    x="5"
                    y="5"
                    width="30"
                    height="30"
                    fill="currentColor"
                  />
                  <path
                    d="M20 12V28M12 20H28"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
              <span className={styles.logoText}>E-Sanjeevani 2.0</span>
            </div>
            <p className={styles.brandDescription}>
              AI-powered telemedicine platform delivering smart healthcare
              consultations with instant specialist matching and 24/7
              availability.
            </p>
            <div className={styles.social}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 2L14 18M14 2L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="14"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 9V13M13 9V13M13 11H7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 3V10M10 10L6 14M10 10L14 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className={styles.linksGrid}>
            {/* Product */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Product</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#features" className={styles.link}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className={styles.link}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#specialties" className={styles.link}>
                    Specialties
                  </a>
                </li>
                <li>
                  <a href="#pricing" className={styles.link}>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#security" className={styles.link}>
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Company</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#about" className={styles.link}>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#team" className={styles.link}>
                    Our Team
                  </a>
                </li>
                <li>
                  <a href="#careers" className={styles.link}>
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#blog" className={styles.link}>
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#press" className={styles.link}>
                    Press Kit
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Resources</h3>
              <ul className={styles.linkList}>
                <li>
                  <a href="#help" className={styles.link}>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#docs" className={styles.link}>
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#api" className={styles.link}>
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#community" className={styles.link}>
                    Community
                  </a>
                </li>
                <li>
                  <a href="#support" className={styles.link}>
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Legal</h3>
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
                  <a href="#cookies" className={styles.link}>
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#disclaimer" className={styles.link}>
                    Medical Disclaimer
                  </a>
                </li>
                <li>
                  <a href="#compliance" className={styles.link}>
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <p className={styles.copyright}>
              © {currentYear} E-Sanjeevani 2.0. All rights reserved.
            </p>
            <div className={styles.badge}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={styles.badgeIcon}
              >
                <rect
                  x="2"
                  y="2"
                  width="12"
                  height="12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
              <span>B.Tech Major Project - Group 15</span>
            </div>
          </div>
          <div className={styles.bottomRight}>
            <div className={styles.lang}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M2 8H14M8 2C9.5 4 9.5 12 8 14M8 2C6.5 4 6.5 12 8 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span>English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
