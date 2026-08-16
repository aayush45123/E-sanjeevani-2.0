import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import logoImage from "../../assets/logo-svg.svg";
import styles from "./DoctorSidebar.module.css";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
      { to: "/doctor-dashboard/schedule", icon: FiCalendar, label: "Schedule" },
      { to: "/doctor-dashboard/patients", icon: FiUsers, label: "My Patients" },
    ],
  },
  {
    label: "PRACTICE",
    items: [
      {
        to: "/doctor-dashboard/records",
        icon: FiFileText,
        label: "Clinical Records",
      },
      {
        to: "/doctor-dashboard/analytics",
        icon: FiBarChart2,
        label: "Analytics",
      },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { to: "/doctor-dashboard/settings", icon: FiSettings, label: "Settings" },
      {
        to: "/doctor-dashboard/help",
        icon: FiHelpCircle,
        label: "Help Center",
      },
    ],
  },
];

export default function DoctorSidebar({
  user,
  onLogout,
  isProfileIncomplete = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleSection = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleProfileClick = () => {
    navigate("/doctor-profile-edit");
  };

  const getCachedName = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user"));
      return userObj?.name || "Doctor";
    } catch (e) {
      return "Doctor";
    }
  };

  const displayName = user?.name || getCachedName();

  const initials = displayName !== "Doctor"
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DR";

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FiX size={18} /> : <FiMenu size={18} />}
      </button>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.visible : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      >
      {/* Profile Incomplete Banner */}
      {isProfileIncomplete && (
        <div className={styles.lockBanner}>
          <div className={styles.lockIcon}>ℹ️</div>
          <p>Complete your profile details in Settings</p>
        </div>
      )}

      {/* Logo */}
      <div className={styles.logo}>
        <img
          src={logoImage}
          alt="eSanjeevani"
          className={styles.logoImage}
        />
        <span className={styles.logoText}>eSanjeevani</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navSections.map((section) => (
          <div key={section.label} className={styles.navSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection(section.label)}
            >
              <span className={styles.sectionLabel}>{section.label}</span>
              {collapsed[section.label] ? (
                <FiChevronDown size={12} />
              ) : (
                <FiChevronUp size={12} />
              )}
            </button>

            {!collapsed[section.label] && (
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/dashboard"}
                      className={({ isActive }) =>
                        `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                      }
                    >
                      <item.icon size={16} className={styles.navIcon} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom: User Info + Logout */}
      <div className={styles.bottomSection}>
        <div
          className={styles.userCard}
          onClick={handleProfileClick}
          title="Click to edit profile & workspace settings"
        >
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userRole}>Doctor</p>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={onLogout}>
          <FiLogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  );
}
