// Navbar.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import logoSvg from "../../assets/logo-svg.svg";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");

  // Re-check token on every route change (covers logout → re-login flow)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location.pathname]);

  // Re-check token when authChange fires (same-tab login/signup)
  useEffect(() => {
    const onAuthChange = () => setIsLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Same logout logic as Sidebar
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderAuthButton = () => {
    if (isAuthPage) return null;
    if (isLoggedIn) {
      return (
        <button className={styles.btnLogout} onClick={logout}>
          Logout
        </button>
      );
    }
    return (
      <button
        className={styles.btnSignIn}
        onClick={() => (window.location.href = "/auth")}
      >
        Sign In
      </button>
    );
  };

  const renderMobileAuthButton = () => {
    if (isAuthPage) return null;
    if (isLoggedIn) {
      return (
        <button className={styles.btnLogoutMobile} onClick={logout}>
          Logout
        </button>
      );
    }
    return (
      <button
        className={styles.btnSignInMobile}
        onClick={() => (window.location.href = "/auth")}
      >
        Sign In
      </button>
    );
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        {/* Logo */}
        <a href="/" className={styles.logo}>
          <img
            src={logoSvg}
            alt="E-Sanjeevani Logo"
            className={styles.logoIcon}
          />
          <span className={styles.logoText}>E-Sanjeevani 2.0</span>
        </a>

        {/* Desktop Navigation */}
        <div className={styles.navLinks}>
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

        {/* Desktop Actions */}
        <div className={styles.navActions}>
          <button className={styles.iconBtn} aria-label="Notifications">
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
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button className={styles.iconBtn} aria-label="Profile">
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          {renderAuthButton()}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={styles.mobileMenuBtn}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span
            className={`${styles.menuLine} ${
              isMobileMenuOpen ? styles.menuLineOpen : ""
            }`}
          ></span>
          <span
            className={`${styles.menuLine} ${
              isMobileMenuOpen ? styles.menuLineOpen : ""
            }`}
          ></span>
          <span
            className={`${styles.menuLine} ${
              isMobileMenuOpen ? styles.menuLineOpen : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${
          isMobileMenuOpen ? styles.mobileMenuOpen : ""
        }`}
      >
        <div className={styles.mobileMenuContent}>
          <a
            href="#platform"
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            Platform
          </a>
          <a
            href="#triage"
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            AI Triage
          </a>
          <a
            href="#specialties"
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            Specialties
          </a>
          <a
            href="#intelligence"
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            Clinical Intelligence
          </a>
          <a
            href="#archives"
            className={styles.mobileNavLink}
            onClick={closeMobileMenu}
          >
            Archives
          </a>
          <div className={styles.mobileActions}>{renderMobileAuthButton()}</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
