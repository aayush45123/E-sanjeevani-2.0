import React from "react";
import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <div className={styles.pageWrapper}>
      
      {/* Centered Hero Content */}
      <div className={styles.heroContent}>
        
        {/* Sleek Pill Tag */}
        <div className={styles.topTag}>
          <span className={styles.tagBadge}>NEW</span> 
          E-Sanjeevani 2.0 is now live!
        </div>

        {/* Clean, Bold, Sans-Serif Title */}
        <h1 className={styles.title}>
          Smart Healthcare & Instant<br />
          Consultations. Get Your Care Back.
        </h1>

        {/* Description */}
        <p className={styles.description}>
          Harness the power of AI telemetry and automated triage to deliver seamless, clinical-grade precision at a national scale.
        </p>

        {/* Side-by-Side CTAs */}
        <div className={styles.ctaWrapper}>
          <button className={styles.btnPrimary}>
            Start AI Consultation
          </button>
          
          <button className={styles.btnSecondary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Technical Whitepaper
          </button>
        </div>

        {/* Glowing Dashboard Anchor */}
        <div className={styles.dashboardAnchor}>
          <div className={styles.dashboardGlow}></div>
          <div className={styles.dashboardMockup}>
            {/* Abstract Header */}
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <span></span><span></span><span></span>
              </div>
              <div className={styles.mockupTabs}>
                <div className={`${styles.mockupTab} ${styles.tabActive}`}></div>
                <div className={styles.mockupTab}></div>
                <div className={styles.mockupTab}></div>
              </div>
            </div>
            {/* Abstract Body */}
            <div className={styles.mockupBody}>
              <div className={styles.mockupSidebar}>
                <div className={styles.sidebarItem}></div>
                <div className={styles.sidebarItem}></div>
                <div className={styles.sidebarItem}></div>
                <div className={styles.sidebarItem}></div>
              </div>
              <div className={styles.mockupMain}>
                <div className={styles.mockupCardTop}></div>
                <div className={styles.mockupCardsBottom}>
                  <div className={styles.mockupCardSmall}></div>
                  <div className={styles.mockupCardSmall}></div>
                  <div className={styles.mockupCardSmall}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;