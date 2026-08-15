import React from "react";
import styles from "./Skeleton.module.css";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonPill,
  SkeletonRect,
  SidebarSkeleton,
} from "./SkeletonPrimitives";

/* 1. Home / Landing Page Skeleton */
export function HomeSkeleton() {
  return (
    <div style={{ width: "100%", background: "#fcfcfd", minHeight: "100vh" }}>
      {/* Hero Section */}
      <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
        <SkeletonPill width="160px" height="30px" />
        <SkeletonText width="60%" height="2.5rem" />
        <SkeletonText width="80%" height="2.5rem" />
        <SkeletonText width="50%" height="1.1rem" />
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <SkeletonButton width="160px" height="48px" />
          <SkeletonButton width="160px" height="48px" />
        </div>
        <SkeletonRect width="100%" height="340px" style={{ marginTop: "2rem", borderRadius: "20px" }} />
      </div>

      {/* Features Grid */}
      <div style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <SkeletonAvatar size="48px" />
              <SkeletonText width="70%" height="1.2rem" />
              <SkeletonText width="90%" height="0.85rem" />
              <SkeletonText width="60%" height="0.85rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 2. Auth Page Skeleton */
export function AuthSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "1.5rem" }}>
      <div className={styles.formCardSkeleton} style={{ maxWidth: "460px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textTransform: "center" }}>
          <SkeletonAvatar size="54px" />
          <SkeletonText width="60%" height="1.5rem" />
          <SkeletonText width="80%" height="0.85rem" />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          <SkeletonPill width="50%" height="36px" />
          <SkeletonPill width="50%" height="36px" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SkeletonText width="30%" height="0.85rem" />
          <SkeletonRect width="100%" height="42px" />
          <SkeletonText width="30%" height="0.85rem" />
          <SkeletonRect width="100%" height="42px" />
        </div>

        <SkeletonButton width="100%" height="44px" style={{ marginTop: "0.5rem" }} />
        <SkeletonText width="60%" height="0.85rem" style={{ alignSelf: "center" }} />
      </div>
    </div>
  );
}

/* 3. Patient Dashboard Skeleton */
export function PatientDashboardSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        {/* Header Greeting & Prompt */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <SkeletonText width="40%" height="2rem" />
          <SkeletonText width="60%" height="1rem" />
        </div>

        {/* Large Prompt Search Box */}
        <SkeletonRect width="100%" height="140px" style={{ borderRadius: "16px" }} />

        {/* Action Pills */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <SkeletonPill width="140px" height="34px" />
          <SkeletonPill width="160px" height="34px" />
          <SkeletonPill width="130px" height="34px" />
        </div>

        {/* Stat Cards Grid */}
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.statCardSkeleton}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonText width="50%" height="0.85rem" />
                <SkeletonAvatar size="32px" />
              </div>
              <SkeletonText width="40%" height="1.8rem" />
              <SkeletonText width="60%" height="0.75rem" />
            </div>
          ))}
        </div>

        {/* Quick Triage / Recent Activity */}
        <div className={styles.cardsGrid}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <SkeletonAvatar size="44px" />
                <div style={{ flex: 1 }}>
                  <SkeletonText width="70%" height="1rem" />
                  <SkeletonText width="40%" height="0.8rem" />
                </div>
              </div>
              <SkeletonRect width="100%" height="60px" />
              <SkeletonButton width="100%" height="36px" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 4. Doctor Dashboard Skeleton */
export function DoctorDashboardSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        {/* Top Header */}
        <div className={styles.headerSkeleton}>
          <div className={styles.headerTitleBox}>
            <SkeletonText width="220px" height="1.8rem" />
            <SkeletonText width="320px" height="0.9rem" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <SkeletonButton width="140px" height="38px" />
            <SkeletonAvatar size="40px" />
          </div>
        </div>

        {/* Doctor Stats (Total Patients, Today Consultations, Earnings, Rating) */}
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.statCardSkeleton}>
              <SkeletonText width="60%" height="0.85rem" />
              <SkeletonText width="45%" height="2rem" />
              <SkeletonText width="80%" height="0.75rem" />
            </div>
          ))}
        </div>

        {/* Activity Chart & Upcoming Appointments */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          <div className={styles.chartSkeleton}>
            <SkeletonText width="40%" height="1.2rem" />
            <SkeletonRect width="100%" height="200px" />
          </div>
          <div className={styles.cardSkeleton}>
            <SkeletonText width="60%" height="1.2rem" />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <SkeletonAvatar size="36px" />
                <div style={{ flex: 1 }}>
                  <SkeletonText width="70%" height="0.85rem" />
                  <SkeletonText width="40%" height="0.7rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* 5. My Patients Skeleton */
export function MyPatientsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <div>
            <SkeletonText width="200px" height="1.8rem" />
            <SkeletonText width="280px" height="0.9rem" />
          </div>
          <SkeletonButton width="140px" height="40px" />
        </div>

        {/* Filter controls bar */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <SkeletonRect width="240px" height="40px" />
          <SkeletonRect width="160px" height="40px" />
          <SkeletonRect width="160px" height="40px" />
        </div>

        {/* Patients Grid Cards */}
        <div className={styles.cardsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <SkeletonAvatar size="52px" />
                <div style={{ flex: 1 }}>
                  <SkeletonText width="70%" height="1.1rem" />
                  <SkeletonText width="40%" height="0.8rem" />
                </div>
                <SkeletonPill width="60px" height="24px" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
                <SkeletonText width="40%" height="0.8rem" />
                <SkeletonText width="30%" height="0.8rem" />
              </div>
              <SkeletonButton width="100%" height="36px" style={{ marginTop: "0.5rem" }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 6. Doctor Schedule Skeleton */
export function DoctorScheduleSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <SkeletonText width="220px" height="1.8rem" />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <SkeletonPill width="120px" height="36px" />
            <SkeletonButton width="140px" height="36px" />
          </div>
        </div>

        {/* Date Navigator Bar */}
        <SkeletonRect width="100%" height="56px" style={{ borderRadius: "12px" }} />

        {/* Time Slot Sections */}
        {[1, 2, 3].map((section) => (
          <div key={section} className={styles.cardSkeleton}>
            <SkeletonText width="180px" height="1.2rem" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem" }}>
              {[1, 2, 3, 4].map((slot) => (
                <SkeletonPill key={slot} width="100%" height="42px" />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

/* 7. Doctor Analytics Skeleton */
export function DoctorAnalyticsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <SkeletonText width="220px" height="1.8rem" />
          <SkeletonPill width="140px" height="36px" />
        </div>

        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.statCardSkeleton}>
              <SkeletonText width="50%" height="0.85rem" />
              <SkeletonText width="60%" height="1.8rem" />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className={styles.chartSkeleton}>
            <SkeletonText width="40%" height="1.2rem" />
            <SkeletonRect width="100%" height="220px" />
          </div>
          <div className={styles.chartSkeleton}>
            <SkeletonText width="40%" height="1.2rem" />
            <SkeletonRect width="100%" height="220px" />
          </div>
        </div>
      </main>
    </div>
  );
}

/* 8. Consultations Skeleton */
export function ConsultationsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <div>
            <SkeletonText width="220px" height="1.8rem" />
            <SkeletonText width="320px" height="0.9rem" />
          </div>
          <SkeletonButton width="160px" height="40px" />
        </div>

        {/* Tab switcher & search */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <SkeletonPill width="100px" height="36px" />
            <SkeletonPill width="110px" height="36px" />
            <SkeletonPill width="110px" height="36px" />
          </div>
          <SkeletonRect width="220px" height="36px" />
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <SkeletonPill width="90px" height="24px" />
                <SkeletonText width="80px" height="0.8rem" />
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <SkeletonAvatar size="48px" />
                <div style={{ flex: 1 }}>
                  <SkeletonText width="70%" height="1rem" />
                  <SkeletonText width="50%" height="0.8rem" />
                </div>
              </div>
              <SkeletonRect width="100%" height="45px" />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <SkeletonButton width="50%" height="36px" />
                <SkeletonButton width="50%" height="36px" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 9. Available Doctors Skeleton */
export function AvailableDoctorsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <div>
            <SkeletonText width="240px" height="1.8rem" />
            <SkeletonText width="340px" height="0.9rem" />
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <SkeletonRect width="300px" height="42px" />
          <SkeletonRect width="200px" height="42px" />
          <SkeletonButton width="160px" height="42px" />
        </div>

        {/* Doctors Grid */}
        <div className={styles.cardsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.doctorCardSkeleton}>
              <SkeletonAvatar size="80px" />
              <SkeletonText width="60%" height="1.2rem" />
              <SkeletonPill width="100px" height="26px" />
              <SkeletonText width="80%" height="0.85rem" />
              <SkeletonText width="50%" height="0.85rem" />
              <SkeletonButton width="100%" height="40px" style={{ marginTop: "0.5rem" }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 10. Consulted Doctors Skeleton */
export function ConsultedDoctorsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <div>
            <SkeletonText width="220px" height="1.8rem" />
            <SkeletonText width="340px" height="0.9rem" />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <SkeletonRect width="280px" height="40px" />
          <SkeletonRect width="180px" height="40px" />
        </div>

        <div className={styles.cardsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <SkeletonAvatar size="56px" />
                <div style={{ flex: 1 }}>
                  <SkeletonText width="70%" height="1.1rem" />
                  <SkeletonText width="45%" height="0.85rem" />
                </div>
              </div>
              <SkeletonRect width="100%" height="50px" />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <SkeletonButton width="50%" height="36px" />
                <SkeletonButton width="50%" height="36px" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 11. Clinical Records Skeleton */
export function ClinicalRecordsSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <div>
            <SkeletonText width="260px" height="1.8rem" />
            <SkeletonText width="360px" height="0.9rem" />
          </div>
          <SkeletonButton width="180px" height="42px" />
        </div>

        {/* Tab & Search controls */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <SkeletonPill width="100px" height="34px" />
            <SkeletonPill width="140px" height="34px" />
            <SkeletonPill width="120px" height="34px" />
          </div>
          <SkeletonRect width="220px" height="34px" />
        </div>

        {/* Records Grid */}
        <div className={styles.cardsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonAvatar size="36px" />
                <SkeletonPill width="80px" height="22px" />
              </div>
              <SkeletonText width="80%" height="1.1rem" />
              <SkeletonText width="50%" height="0.8rem" />
              <SkeletonText width="60%" height="0.8rem" />
              <SkeletonButton width="100%" height="36px" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* 12. Consultation Booking Form Skeleton */
export function ConsultationBookingSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        {/* Doctor Summary Header Card */}
        <div className={styles.cardSkeleton} style={{ flexDirection: "row", alignItems: "center" }}>
          <SkeletonAvatar size="72px" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <SkeletonText width="220px" height="1.3rem" />
            <SkeletonText width="160px" height="0.9rem" />
            <SkeletonText width="180px" height="0.8rem" />
          </div>
        </div>

        {/* Booking Form Card */}
        <div className={styles.formCardSkeleton}>
          <SkeletonText width="200px" height="1.3rem" />
          
          <SkeletonText width="120px" height="0.9rem" />
          <SkeletonRect width="100%" height="90px" />

          <SkeletonText width="140px" height="0.9rem" />
          <SkeletonRect width="240px" height="42px" />

          <SkeletonText width="160px" height="0.9rem" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonPill key={i} width="100%" height="40px" />
            ))}
          </div>

          <SkeletonButton width="100%" height="46px" style={{ marginTop: "1rem" }} />
        </div>
      </main>
    </div>
  );
}

/* 13. Profile Completion (Patient) Skeleton */
export function ProfileCompletionSkeleton() {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "2.5rem 1rem", display: "flex", justifyContent: "center" }}>
      <div className={styles.formCardSkeleton}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <SkeletonText width="240px" height="1.8rem" />
          <SkeletonText width="340px" height="0.9rem" />
          <SkeletonRect width="100%" height="8px" style={{ borderRadius: "4px", marginTop: "0.5rem" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
        </div>

        <SkeletonRect width="100%" height="80px" />
        <SkeletonButton width="100%" height="46px" />
      </div>
    </div>
  );
}

/* 14. Doctor Profile Setup Skeleton */
export function DoctorProfileSetupSkeleton() {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "2.5rem 1rem", display: "flex", justifyContent: "center" }}>
      <div className={styles.formCardSkeleton}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <SkeletonText width="260px" height="1.8rem" />
          <SkeletonAvatar size="80px" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
          <SkeletonRect width="100%" height="42px" />
        </div>

        <SkeletonButton width="100%" height="46px" />
      </div>
    </div>
  );
}

/* 15. Doctor Profile Edit Skeleton */
export function DoctorProfileEditSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <SidebarSkeleton />
      <main className={styles.mainContentSkeleton}>
        <div className={styles.headerSkeleton}>
          <SkeletonText width="240px" height="1.8rem" />
          <SkeletonButton width="140px" height="40px" />
        </div>

        <div className={styles.formCardSkeleton}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <SkeletonAvatar size="90px" />
            <SkeletonButton width="140px" height="38px" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <SkeletonRect width="100%" height="42px" />
            <SkeletonRect width="100%" height="42px" />
          </div>
          <SkeletonRect width="100%" height="90px" />
        </div>
      </main>
    </div>
  );
}

/* 16. Video Call Skeleton */
export function VideoCallSkeleton() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#090d16", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ height: "60px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", borderBottom: "1px solid #1e293b" }}>
        <SkeletonPill width="140px" height="28px" />
        <SkeletonPill width="180px" height="28px" />
      </div>

      {/* Main Video Body */}
      <div style={{ flex: 1, display: "flex", padding: "1rem", gap: "1rem" }}>
        <div className={styles.videoStageSkeleton}>
          <SkeletonAvatar size="96px" />
          <div className={styles.controlBarSkeleton}>
            <SkeletonAvatar size="44px" />
            <SkeletonAvatar size="44px" />
            <SkeletonAvatar size="44px" />
            <SkeletonButton width="100px" height="44px" style={{ borderRadius: "9999px" }} />
          </div>
        </div>

        {/* Right Chat/Clinical Panel */}
        <div style={{ width: "340px", background: "#0f172a", borderRadius: "16px", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SkeletonPill width="100%" height="36px" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SkeletonRect width="70%" height="40px" style={{ borderRadius: "12px" }} />
            <SkeletonRect width="60%" height="40px" style={{ alignSelf: "flex-end", borderRadius: "12px" }} />
            <SkeletonRect width="80%" height="40px" style={{ borderRadius: "12px" }} />
          </div>
          <SkeletonRect width="100%" height="42px" style={{ borderRadius: "8px" }} />
        </div>
      </div>
    </div>
  );
}

/* 17. AI Triage Skeleton */
export function AiTriageSkeleton() {
  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "1rem" }}>
      <div className={styles.formCardSkeleton}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <SkeletonText width="220px" height="1.8rem" />
          <SkeletonText width="320px" height="0.9rem" />
        </div>

        <SkeletonText width="160px" height="1.1rem" />
        <SkeletonRect width="100%" height="100px" />

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <SkeletonPill width="90px" height="30px" />
          <SkeletonPill width="100px" height="30px" />
          <SkeletonPill width="80px" height="30px" />
        </div>

        <SkeletonButton width="100%" height="44px" />
      </div>
    </div>
  );
}
