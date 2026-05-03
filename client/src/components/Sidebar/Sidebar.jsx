// FULL UPDATED Sidebar.jsx
// Industry-level fixed profile navigation + stable sidebar behavior

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ClipboardList,
  Users,
  BarChart3,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState({
    name: "",
    role: "",
  });

  /*
  ==================================================
  LOAD USER INFO
  ==================================================
  */

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User";

    const role = localStorage.getItem("userRole") || "patient";

    setUser({
      name,
      role,
    });
  }, []);

  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");

    window.dispatchEvent(new Event("authChange"));

    navigate("/auth");
  };

  /*
  ==================================================
  PROFILE CLICK
  FIX:
  Patient → /profile
  Doctor → /doctor-profile-edit
  ==================================================
  */

  const handleProfileClick = () => {
    if (user.role === "doctor") {
      navigate("/doctor-profile-edit");
    } else {
      navigate("/profile");
    }
  };

  /*
  ==================================================
  MENU ITEMS
  ==================================================
  */

  const patientMenu = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      label: "Consultations",
      icon: <Calendar size={18} />,
      path: "/consultations",
    },
    {
      label: "Clinical Records",
      icon: <FileText size={18} />,
      path: "/clinical-records",
    },
  ];

  const doctorMenu = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      label: "Schedule",
      icon: <Calendar size={18} />,
      path: "/doctor-schedule",
    },
    {
      label: "My Patients",
      icon: <Users size={18} />,
      path: "/my-patients",
    },
    {
      label: "Clinical Records",
      icon: <ClipboardList size={18} />,
      path: "/clinical-records",
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={18} />,
      path: "/analytics",
    },
  ];

  const supportMenu = [
    {
      label: "Settings",
      icon: <Settings size={18} />,
      path: "/settings",
    },
    {
      label: "Help Center",
      icon: <HelpCircle size={18} />,
      path: "/help-center",
    },
  ];

  const activeMenu = user.role === "doctor" ? doctorMenu : patientMenu;

  /*
  ==================================================
  ACTIVE PATH CHECK
  ==================================================
  */

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={styles.sidebar}>
      {/* LOGO */}

      <div
        className={styles.logoSection}
        onClick={() => navigate("/dashboard")}
      >
        <img src="./logo-svg.svg " alt="E-Sanjeevani" className={styles.logo} />

        <h2>E-Sanjeevani</h2>
      </div>

      {/* OVERVIEW */}

      <div className={styles.section}>
        <p className={styles.sectionTitle}>OVERVIEW</p>

        {activeMenu.map((item, index) => (
          <button
            key={index}
            className={`${styles.menuItem} ${
              isActive(item.path) ? styles.active : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>

            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* SUPPORT */}

      <div className={styles.section}>
        <p className={styles.sectionTitle}>SUPPORT</p>

        {supportMenu.map((item, index) => (
          <button
            key={index}
            className={`${styles.menuItem} ${
              isActive(item.path) ? styles.active : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>

            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* PROFILE FOOTER */}

      <div className={styles.profileFooter}>
        <div className={styles.profileCard} onClick={handleProfileClick}>
          <div className={styles.avatar}>
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className={styles.profileInfo}>
            <h4>{user.name || "User"}</h4>
            <p>{user.role === "doctor" ? "Doctor" : "Patient"}</p>
          </div>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
