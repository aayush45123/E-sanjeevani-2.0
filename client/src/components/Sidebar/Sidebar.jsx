import React, { useState } from "react";
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

const LogoIcon = () => (
  <div
    style={{
      width: "28px",
      height: "28px",
      background: "#51da4d",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "800",
      color: "#ffffff",
      flexShrink: 0,
    }}
  >
    E
  </div>
);

export default function Sidebar({ user = {}, onLogout = () => {} }) {
  const [expandedGroup, setExpandedGroup] = useState("overview");

  const navGroups = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { icon: FiHome, label: "Dashboard", href: "#" },
        { icon: FiActivity, label: "Consultations", href: "#" },
        { icon: FiFolder, label: "Clinical Records", href: "#" },
      ],
    },
    {
      id: "applications",
      label: "Applications",
      items: [
        { icon: FiCpu, label: "AI Triage Engine", href: "#" },
        { icon: FiUsers, label: "Specialist Directory", href: "#" },
      ],
    },
    {
      id: "support",
      label: "Support",
      items: [
        { icon: FiAlertCircle, label: "Help Center", href: "#" },
        { icon: FiSettings, label: "Settings", href: "#" },
      ],
    },
  ];

  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const avatarChar = firstName[0]?.toUpperCase() || "U";

  return (
    <aside className={styles.sidebar}>
      {/* Top Section */}
      <div className={styles.sidebarTop}>
        {/* Brand */}
        <div className={styles.brand}>
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
                    <a
                      key={idx}
                      href={item.href}
                      className={`${styles.navItem} ${
                        idx === 0 && group.id === "overview"
                          ? styles.active
                          : ""
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section - User Profile */}
      <div className={styles.sidebarBottom}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{avatarChar}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Patient"}</span>
            <span className={styles.userRole}>Standard Tier</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={onLogout} title="Log out">
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
