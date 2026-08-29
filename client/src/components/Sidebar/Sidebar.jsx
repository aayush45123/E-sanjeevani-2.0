// Sidebar.jsx — Patient sidebar with mobile hamburger drawer
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { performLogout } from "../../utils/auth";
import { Menu, X } from "lucide-react";

import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  Stethoscope,
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
  const [isOpen, setIsOpen] = useState(false);

  const [user, setUser] = useState({
    name: "User",
    role: localStorage.getItem("userRole") || "patient",
  });

  useEffect(() => {
    const updateUserData = () => {
      let name = "User";
      try {
        const userObj = JSON.parse(localStorage.getItem("user"));
        if (userObj && userObj.name) name = userObj.name;
      } catch (e) {}
      const role = localStorage.getItem("userRole") || "patient";
      setUser({ name, role });
    };

    updateUserData();
    window.addEventListener("storage", updateUserData);
    window.addEventListener("profileUpdated", updateUserData);
    window.addEventListener("authChange", updateUserData);
    return () => {
      window.removeEventListener("storage", updateUserData);
      window.removeEventListener("profileUpdated", updateUserData);
      window.removeEventListener("authChange", updateUserData);
    };
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = () => performLogout();

  const handleProfileClick = () => {
    if (user.role === "doctor") navigate("/doctor-profile-edit");
    else navigate("/profile-setup");
  };

  const patientMenu = [
    { label: "Dashboard",         icon: <LayoutDashboard size={15} />, path: "/dashboard" },
    { label: "Find Doctors",      icon: <Stethoscope size={15} />,     path: "/available-doctors" },
    { label: "Consultations",     icon: <Calendar size={15} />,        path: "/consultations" },
    { label: "Clinical Records",  icon: <FileText size={15} />,        path: "/clinical-records" },
    { label: "AI Symptom Triage", icon: <ClipboardList size={15} />,   path: "/ai-triage" },
  ];

  const doctorMenu = [
    { label: "Dashboard",        icon: <LayoutDashboard size={15} />, path: "/dashboard" },
    { label: "My Patients",      icon: <Users size={15} />,           path: "/doctor-dashboard/patients" },
    { label: "Schedule",         icon: <Calendar size={15} />,        path: "/doctor-dashboard/schedule" },
    { label: "Clinical Records", icon: <ClipboardList size={15} />,   path: "/clinical-records" },
    { label: "Analytics",        icon: <BarChart3 size={15} />,       path: "/doctor-dashboard/analytics" },
  ];

  const supportMenu = [
    { label: "Health Profile", icon: <User size={15} />, path: user.role === "doctor" ? "/doctor-profile-edit" : "/profile-setup" },
    { label: "Help Center",    icon: <HelpCircle size={15} />, path: user.role === "doctor" ? "/doctor-dashboard/help" : "/dashboard" },
  ];

  const activeMenu = user.role === "doctor" ? doctorMenu : patientMenu;
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ item }) => (
    <button
      className={`${styles.item} ${item.path && isActive(item.path) ? styles.itemActive : ""}`}
      onClick={() => { item.onClick ? item.onClick() : navigate(item.path); }}
    >
      <span className={styles.itemIcon}>{item.icon}</span>
      {item.label}
    </button>
  );

  return (
    <>
      {/* Hamburger — visible only on mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.visible : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar drawer */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.logoBtn} onClick={() => navigate("/dashboard")}>
            <img
              src="/logo-svg.svg"
              alt="eSanjeevani"
              className={styles.logoImg}
              width="22"
              height="22"
            />
            <span className={styles.logoText}>eSanjeevani</span>
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <p className={styles.sectionLabel}>Overview</p>
          {activeMenu.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          <p className={styles.sectionLabel}>Support</p>
          {supportMenu.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </nav>

        {/* Footer profile */}
        <div className={styles.footer}>
          <div className={styles.profile} onClick={handleProfileClick}>
            <div className={styles.avatar}>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user.name || "User"}</div>
              <div className={styles.profileRole}>{user.role === "doctor" ? "Doctor" : "Patient"}</div>
            </div>
            <svg className={styles.profileChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
