import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiActivity,
  FiFolder,
  FiCpu,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./Sidebar.module.css";
import TriageHistory from "../TriageHistory/TriageHistory";

const LogoIcon = () => (
  <img
    src="/logo-svg.svg"
    alt="Logo"
    style={{
      width: "28px",
      height: "28px",
      flexShrink: 0,
      objectFit: "contain",
    }}
  />
);

export default function Sidebar({ user = {}, onLogout = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroup, setExpandedGroup] = useState("overview");

  const navGroups = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { icon: FiHome, label: "Dashboard", path: "/dashboard" },
        { icon: FiActivity, label: "Consultations", path: "/consultations" },
        { icon: FiFolder, label: "Clinical Records", path: "/records" },
      ],
    },
    {
      id: "applications",
      label: "Applications",
      items: [
        { icon: FiCpu, label: "AI Triage Engine", path: "/triage" },
        { icon: FiUsers, label: "Specialist Directory", path: "/doctors" },
      ],
    },
    {
      id: "support",
      label: "Support",
      items: [
        { icon: FiAlertCircle, label: "Help Center", path: "/help" },
        { icon: FiSettings, label: "Settings", path: "/settings" },
      ],
    },
  ];

  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const avatarChar = firstName[0]?.toUpperCase() || "U";

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.dispatchEvent(new Event("authChange"));
    onLogout();
    navigate("/auth");
  };

  const handleProfileClick = () => {
    navigate("/profile-setup");
  };

  const isNavItemActive = (path) => location.pathname === path;

  return (
    <aside className={styles.sidebar}>
      {/* Top Section */}
      <div className={styles.sidebarTop}>
        {/* Brand - Clickable to Dashboard */}
        <div
          className={styles.brand}
          onClick={() => handleNavigation("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <LogoIcon />
          <span className={styles.brandName}>E-Sanjeevani</span>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navMenu}>
          {navGroups.map((group) => (
            <div key={group.id} className={styles.navGroup}>
              <button
                className={styles.navGroupLabel}
                onClick={() =>
                  setExpandedGroup(expandedGroup === group.id ? null : group.id)
                }
              >
                <span>{group.label}</span>
                <FiChevronDown
                  size={16}
                  style={{
                    transform:
                      expandedGroup === group.id
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </button>

              {expandedGroup === group.id && (
                <div className={styles.navItems}>
                  {group.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNavigation(item.path)}
                      className={`${styles.navItem} ${
                        isNavItemActive(item.path) ? styles.active : ""
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Triage History - Outside of navGroups map to prevent 3x rendering */}
        </nav>
      </div>

      {/* Bottom Section - User Profile */}
      <div className={styles.sidebarBottom}>
        <div
          className={styles.userProfile}
          onClick={handleProfileClick}
          style={{ cursor: "pointer" }}
          title="Click to edit profile"
        >
          <div className={styles.avatar}>{avatarChar}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Patient"}</span>
            <span className={styles.userRole}>
              {user?.role === "doctor" ? "Doctor" : "Patient"}
            </span>
          </div>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Log out"
        >
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
