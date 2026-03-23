// Navbar.jsx
import React, { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        
        {/* Editorial Logo (No Icon, purely Serif Text) */}
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>E-Sanjeevani 2.0</span>
        </a>

        {/* Desktop Navigation (Inter Font) */}
        <div className={styles.navLinks}>
          {/* Note the active class on the first link to create the green underline */}
          <a href="#platform" className={`${styles.navLink} ${styles.active}`}>
            Platform
          </a>
          <a href="#triage" className={styles.navLink}>
            AI Triage
          </a>
          <a href="#specialties" className={styles.navLink}>
            Specialties
          </a>
          <a href="#intelligence" className={styles.navLink}>
            Clinical Intelligence
          </a>
          <a href="#archives" className={styles.navLink}>
            Archives
          </a>
        </div>

        {/* Desktop Actions (Icons & Pill Button) */}
        <div className={styles.navActions}>
          
          {/* Notification Bell Icon */}
          <button className={styles.iconBtn} aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>

          {/* User Profile Icon */}
          <button className={styles.iconBtn} aria-label="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          {/* Sign In Pill Button */}
          <button className={styles.btnSignIn}>Sign In</button>
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span className={`${styles.menuLine} ${isMobileMenuOpen ? styles.menuLineOpen : ""}`}></span>
          <span className={`${styles.menuLine} ${isMobileMenuOpen ? styles.menuLineOpen : ""}`}></span>
          <span className={`${styles.menuLine} ${isMobileMenuOpen ? styles.menuLineOpen : ""}`}></span>
        </button>
      </div>

      {/* Mobile Menu (Hidden on Desktop) */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileMenuContent}>
          <a href="#platform" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Platform</a>
          <a href="#triage" className={styles.mobileNavLink} onClick={toggleMobileMenu}>AI Triage</a>
          <a href="#specialties" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Specialties</a>
          <a href="#intelligence" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Clinical Intelligence</a>
          <a href="#archives" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Archives</a>
          
          <div className={styles.mobileActions}>
            <button className={styles.btnSignInMobile}>Sign In</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;