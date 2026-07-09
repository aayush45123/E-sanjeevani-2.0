import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import dashboardMockupImg from "../../assets/dashboard_mockup.png";
import styles from "./Hero.module.css";

const Hero = () => {
  const navigate = useNavigate();
  const { checkAuthAndNavigate } = useAuthGuard();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleBook = () => checkAuthAndNavigate("/consultation-booking");

  return (
    <section className={styles.hero}>
      {/* Subtle dot grid */}
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.container}>
        {/* ── Text Content ── */}
        <div className={styles.content}>
          {/* Announcement pill */}
          <a href="#platform" className={styles.pill} id="hero-announce-pill">
            <span className={styles.pillDot} aria-hidden="true" />
            <span>AI-powered triage now available</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>

          {/* Main headline */}
          <h1 className={styles.headline}>
            AI-Powered Healthcare,
            <br />
            <span className={styles.highlight}>Delivered Anywhere</span>
          </h1>

          {/* Subheadline */}
          <p className={styles.sub}>
            Instant AI symptom triage and secure video consultations with verified doctors. 
            Manage your clinical care journey in one streamlined platform.
          </p>

          {/* CTA buttons */}
          <div className={styles.ctas}>
            <button
              className={styles.btnPrimary}
              onClick={handleBook}
              id="hero-book-btn"
            >
              Book a Consultation
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate("/auth")}
              id="hero-doctors-btn"
            >
              Explore for Doctors
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Dashboard Mockup ── */}
        <div className={styles.dashboardAnchor}>
          <div className={styles.dashboardContainer}>
            <figure className={styles.mockupContent}>
              <img
                src={dashboardMockupImg}
                alt="eSanjeevani patient dashboard showing AI-powered triage interface, symptom input, clinical records, and consultation history"
                className={styles.dashboardImage}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                width="1080"
                height="600"
              />
              {!imageLoaded && (
                <div className={styles.mockupSkeleton} aria-hidden="true" />
              )}
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;