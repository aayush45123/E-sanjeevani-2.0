import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import styles from "./DoctorSidebar.module.css";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { to: "/doctor-dashboard", icon: FiGrid, label: "Dashboard" },
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

export default function DoctorSidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleProfileClick = () => {
    navigate("/doctor-profile-edit");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DR";

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <span className={styles.logoText}>E-Sanjeevani</span>
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
                      end={item.to === "/doctor-dashboard"}
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
        <div className={styles.userCard} onClick={handleProfileClick}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name || "Doctor"}</p>
            <p className={styles.userRole}>Doctor</p>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={onLogout}>
          <FiLogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
