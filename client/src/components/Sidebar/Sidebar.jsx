import {
  FiHome,
  FiActivity,
  FiFolder,
  FiCpu,
  FiUsers,
  FiSettings,
  FiLogOut,
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

export default function Sidebar({ user, avatarChar, handleSignOut }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.brand}>
          <LogoIcon />
          <span className={styles.brandName}>E-Sanjeevani</span>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            <span className={styles.navLabel}>Overview</span>

            <a href="#" className={`${styles.navItem} ${styles.active}`}>
              <FiHome size={18} />
              Dashboard
            </a>

            <a href="#" className={styles.navItem}>
              <FiActivity size={18} />
              Consultations
            </a>

            <a href="#" className={styles.navItem}>
              <FiFolder size={18} />
              Clinical Records
            </a>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.navLabel}>Applications</span>

            <a href="#" className={styles.navItem}>
              <FiCpu size={18} />
              AI Triage Engine
            </a>

            <a href="#" className={styles.navItem}>
              <FiUsers size={18} />
              Specialist Directory
            </a>
          </div>
        </nav>
      </div>

      <div className={styles.sidebarBottom}>
        <a href="#" className={styles.navItem}>
          <FiSettings size={18} />
          Settings
        </a>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>{avatarChar}</div>

          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Patient"}</span>
            <span className={styles.userRole}>Standard Tier</span>
          </div>

          <button
            className={styles.logoutBtn}
            onClick={handleSignOut}
            title="Log out"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
