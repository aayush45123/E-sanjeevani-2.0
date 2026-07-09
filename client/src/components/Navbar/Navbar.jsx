// Navbar.jsx — Minimal SaaS nav (Every AI / Linear style)
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { performLogout } from "../../utils/auth";

// Public folder assets are served at root path, no import needed
const logo = "/logo-svg.svg";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname.startsWith("/auth");

  useEffect(() => {
    const onAuthChange = () => {
      // Cookies are httpOnly; rely on presence of user object for UI state.
      setIsLoggedIn(!!localStorage.getItem("user"));
    };
    onAuthChange();
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const logout = () => performLogout();

  return (
    <>
      <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <a href="/" className={styles.logo} id="nav-logo">
            <img src={logo} alt="eSanjeevani Logo" className={styles.logoImg} />
            <span className={styles.logoText}>eSanjeevani</span>
          </a>

          {/* Center links */}
          <div className={styles.links}>
            <a href="#platform" className={styles.link}>
              Platform
            </a>
            <a href="#triage" className={styles.link}>
              AI Triage
            </a>
            <a href="#how-it-works" className={styles.link}>
              How it works
            </a>
            <a href="#doctors" className={styles.link}>
              For Doctors
            </a>
          </div>

          {/* Right actions */}
          {!isAuthPage && (
            <div className={styles.actions}>
              {isLoggedIn ? (
                <>
                  <button
                    className={styles.btnGhost}
                    onClick={() => navigate("/dashboard")}
                  >
                    Dashboard
                  </button>
                  <button className={styles.btnGhost} onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.btnGhost}
                    onClick={() => navigate("/auth")}
                    id="nav-login"
                  >
                    Login
                  </button>
                  <button
                    className={styles.btnDark}
                    onClick={() => navigate("/auth")}
                    id="nav-signup"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className={styles.toggle}
            onClick={() => setIsMobileMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a
              href="#platform"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Platform
            </a>
            <a
              href="#triage"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              AI Triage
            </a>
            <a
              href="#how-it-works"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#doctors"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              For Doctors
            </a>
            <div className={styles.mobileDivider} />
            {isLoggedIn ? (
              <button
                className={styles.mobileDark}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  className={styles.mobileGhost}
                  onClick={() => navigate("/auth")}
                >
                  Login
                </button>
                <button
                  className={styles.mobileDark}
                  onClick={() => navigate("/auth")}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
