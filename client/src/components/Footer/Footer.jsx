// Footer.jsx — Clean light premium footer matching DevStudio layout
import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: "Platform",
      links: [
        { label: "AI Symptom Triage", href: "#triage" },
        { label: "Video Consultations", href: "#platform" },
        { label: "Smart Scheduling", href: "#platform" },
        { label: "Digital Prescriptions", href: "#platform" },
      ],
    },
    {
      title: "For Doctors",
      links: [
        { label: "Doctor Dashboard", href: "#doctors" },
        { label: "Patient Management", href: "#doctors" },
        { label: "Analytics & Reports", href: "#doctors" },
        { label: "Schedule Management", href: "#doctors" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#about" },
        { label: "System Architecture", href: "#architecture" },
        { label: "Technical Whitepaper", href: "/whitepaper.pdf" },
        { label: "GitHub Repository", href: "#github" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "HIPAA Compliance", href: "#hipaa" },
        { label: "Cookie Policy", href: "#cookie" },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Left Side: Brand and Copyright */}
        <div className={styles.brandSection}>
          <div className={styles.brand}>
            <img
              src="/logo-svg.svg"
              alt="eSanjeevani Logo"
              className={styles.logoImg}
              width="24"
              height="24"
            />
            <span className={styles.brandName}>eSanjeevani</span>
          </div>
          <p className={styles.copyright}>
            © copyright eSanjeevani {currentYear}. All rights reserved.
          </p>
        </div>

        {/* Right Side: Links Grid */}
        <div className={styles.linksGrid}>
          {columns.map((col) => (
            <div key={col.title} className={styles.column}>
              <h4 className={styles.columnTitle}>{col.title}</h4>
              <ul className={styles.linkList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={styles.link}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Faint Background Watermark Text */}
      <div className={styles.watermarkContainer}>
        <div className={styles.watermarkText}>eSanjeevani</div>
      </div>
    </footer>
  );
};

export default Footer;
