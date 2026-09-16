// FULL FINAL UPDATED App.jsx
// Only patient profile completion logic updated
// No existing functionality removed
// Professional industry-level fix

import React, { useEffect, useState, Suspense, lazy } from "react";
import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

/*
  Skeleton placeholders — imported eagerly (tiny, no async cost)
  so they're available immediately for Suspense fallbacks.
*/
import {
  HomeSkeleton,
  AuthSkeleton,
  PatientDashboardSkeleton,
  DoctorDashboardSkeleton,
  MyPatientsSkeleton,
  DoctorScheduleSkeleton,
  DoctorAnalyticsSkeleton,
  DoctorProfileEditSkeleton,
  ConsultationsSkeleton,
  ConsultationBookingSkeleton,
  AvailableDoctorsSkeleton,
  ConsultedDoctorsSkeleton,
  ClinicalRecordsSkeleton,
  ProfileCompletionSkeleton,
  DoctorProfileSetupSkeleton,
  VideoCallSkeleton,
  AiTriageSkeleton,
} from "./components/Skeletons";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

/*
  Lazy-load every page so Vite code-splits them into separate chunks.
  Each route's Suspense fallback shows the matching skeleton while the
  chunk downloads — eliminating blank screens on navigation too.
*/
const Home                    = lazy(() => import("./pages/Home/Home"));
const Auth                    = lazy(() => import("./pages/Auth/Auth"));
const PatientDashboard        = lazy(() => import("./pages/PatientDashBoard/PatientDashBoard"));
const DoctorDashboard         = lazy(() => import("./pages/DoctorDashboard/DoctorDashboard"));
const MyPatients              = lazy(() => import("./pages/DoctorDashboard/MyPatients"));
const DoctorSchedule          = lazy(() => import("./pages/DoctorDashboard/DoctorSchedule"));
const DoctorAnalytics         = lazy(() => import("./pages/DoctorDashboard/DoctorAnalytics"));
const DoctorHelp              = lazy(() => import("./pages/DoctorDashboard/DoctorHelp"));
const ProfileCompletion       = lazy(() => import("./pages/ProfileCompletion/ProfileCompletion"));
const Consultations           = lazy(() => import("./pages/Consultations/Consultations"));
const ConsultationBookingForm = lazy(() => import("./pages/ConsultationBookingForm/ConsultationBookingForm"));
const DoctorProfileSetup      = lazy(() => import("./pages/DoctorProfileSetup/DoctorProfileSetup"));
const DoctorProfileEdit       = lazy(() => import("./pages/DoctorProfileEdit/DoctorProfileEdit"));
const VideoCall               = lazy(() => import("./pages/VideoCall/VideoCall"));
const AiTriage                = lazy(() => import("./components/AiTriage/AiTriage"));
const ConsultedDoctors        = lazy(() => import("./pages/ConsultedDoctors/ConsultedDoctors"));
const AvailableDoctors        = lazy(() => import("./pages/AvailableDoctors/AvailableDoctors"));
const ClinicalRecords         = lazy(() => import("./pages/ClinicalRecords/ClinicalRecords"));
const PatientHistory          = lazy(() => import("./pages/PatientHistory/PatientHistory"));



/*
IMPORTANT FIX:
added apiClient import
instead of checking profile using authApi.me()
*/
import { doctorProfileApi, authApi, apiClient } from "./utils/api";

const App = () => {
  const location = useLocation();

  // Auth lives in httpOnly cookies. Use the cached user object as a UI hint.
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));

  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const [doctorProfileCompleted, setDoctorProfileCompleted] = useState(true);

  const [patientProfileCompleted, setPatientProfileCompleted] = useState(true);

  const [isChecking, setIsChecking] = useState(true);

  /*
  ==================================================
  CHECK AUTH + ROLE + PROFILE STATUS
  Runs on initial mount or when auth/profile events fire,
  NOT on every route change (location.pathname).
  ==================================================
  */

  const checkAccess = async () => {
    const userJson = localStorage.getItem("user");
    const role = localStorage.getItem("userRole");

    setIsLoggedIn(!!userJson);
    setUserRole(role);

    if (!userJson) {
      setIsChecking(false);
      return;
    }

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(userJson);
    } catch (e) {}

    // Synchronously populate cached profile completion hint from localStorage
    if (parsedUser && typeof parsedUser.profileCompleted === "boolean") {
      if (role === "doctor") setDoctorProfileCompleted(parsedUser.profileCompleted);
      if (role === "patient") setPatientProfileCompleted(parsedUser.profileCompleted);
    }

    /*
    DOCTOR PROFILE CHECK
    */
    if (role === "doctor") {
      try {
        const response = await doctorProfileApi.checkProfileStatus();
        if (response.data && typeof response.data.profileCompleted === "boolean") {
          const isComplete = response.data.profileCompleted;
          setDoctorProfileCompleted(isComplete);
          if (parsedUser) {
            parsedUser.profileCompleted = isComplete;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }
      } catch (error) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error("Doctor profile check failed:", error);
        }
      }
    }

    /*
    PATIENT PROFILE CHECK
    */
    if (role === "patient") {
      try {
        const response = await apiClient.get("/patient/profile/status");
        if (
          response.data?.data &&
          typeof response.data.data.isProfileComplete === "boolean"
        ) {
          const isComplete = response.data.data.isProfileComplete;
          setPatientProfileCompleted(isComplete);
          if (parsedUser) {
            parsedUser.profileCompleted = isComplete;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }
      } catch (error) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error("Patient profile check failed:", error);
        }
      }
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkAccess();
  }, []);

  /*
  ==================================================
  AUTH + PROFILE UPDATE LISTENER
  ==================================================
  */

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("user"));
      setUserRole(localStorage.getItem("userRole"));
      checkAccess();
    };

    const handleProfileUpdated = () => {
      checkAccess();
    };

    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("profileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, []);

  /*
  ==================================================
  APP ROUTES CHECK
  ==================================================
  */

  const isAppRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/doctor-dashboard") ||
    location.pathname.startsWith("/profile-setup") ||
    location.pathname.startsWith("/doctor-profile-setup") ||
    location.pathname.startsWith("/doctor-profile-edit") ||
    location.pathname.startsWith("/consultations") ||
    location.pathname.startsWith("/consultation-booking") ||
    location.pathname.startsWith("/video-call") ||
    location.pathname.startsWith("/clinical-records") ||
    location.pathname.startsWith("/auth");

  /*
  Navbar only on landing page
  */

  const showNavbar =
    location.pathname === "/" ||
    location.pathname === "" ||
    location.pathname === "/auth";

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (isChecking) {
    const role = localStorage.getItem("userRole");
    const path = location.pathname;

    // Show the contextually-correct skeleton while auth/profile API resolves
    if (path.startsWith("/doctor-dashboard/patients")) return <MyPatientsSkeleton />;
    if (path.startsWith("/doctor-dashboard/schedule")) return <DoctorScheduleSkeleton />;
    if (path.startsWith("/doctor-dashboard/analytics")) return <DoctorAnalyticsSkeleton />;
    if (path.startsWith("/doctor-dashboard")) return <DoctorDashboardSkeleton />;
    if (path.startsWith("/consultations")) return <ConsultationsSkeleton />;
    if (path.startsWith("/consultation-booking")) return <ConsultationBookingSkeleton />;
    if (path.startsWith("/available-doctors")) return <AvailableDoctorsSkeleton />;
    if (path.startsWith("/consulted-doctors")) return <ConsultedDoctorsSkeleton />;
    if (path.startsWith("/clinical-records") || path.startsWith("/doctor-dashboard/records")) return <ClinicalRecordsSkeleton />;
    if (path.startsWith("/profile-setup")) return <ProfileCompletionSkeleton />;
    if (path.startsWith("/doctor-profile-setup")) return <DoctorProfileSetupSkeleton />;
    if (path.startsWith("/doctor-profile-edit") || path.startsWith("/doctor-dashboard/settings")) return <DoctorProfileEditSkeleton />;
    if (path.startsWith("/video-call")) return <VideoCallSkeleton />;
    if (path.startsWith("/ai-triage")) return <AiTriageSkeleton />;
    if (path.startsWith("/auth")) return <AuthSkeleton />;
    if (path === "/" || path === "") return <HomeSkeleton />;
    if (path.startsWith("/dashboard")) {
      return role === "doctor" ? <DoctorDashboardSkeleton /> : <PatientDashboardSkeleton />;
    }
    return role === "doctor" ? <DoctorDashboardSkeleton /> : <PatientDashboardSkeleton />;
  }

  /*
  ==================================================
  DASHBOARD LOGIC
  ==================================================
  */

  const getDashboardComponent = () => {
    /*
    Doctor incomplete — only redirect if we're sure profile is incomplete
    */
    if (userRole === "doctor" && doctorProfileCompleted === false) {
      return <Navigate to="/doctor-profile-setup" replace />;
    }

    /*
    Patient incomplete
    */
    if (userRole === "patient" && patientProfileCompleted === false) {
      return <Navigate to="/profile-setup" replace />;
    }

    if (userRole === "doctor") {
      return <DoctorDashboard isProfileIncomplete={!doctorProfileCompleted} />;
    }

    return <PatientDashboard />;
  };

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "13.5px",
            fontWeight: 500,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: "10px",
            padding: "11px 16px",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
            border: "1px solid #e2e8f0",
            maxWidth: "380px",
          },
          success: {
            duration: 3200,
            iconTheme: {
              primary: "#0ea5a4",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 4500,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {/* Navbar only on landing page */}

      {showNavbar && <Navbar />}

      <Routes>
        {/* HOME */}

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<HomeSkeleton />}>
                <Home />
              </Suspense>
            )
          }
        />

        {/* AUTH */}

        <Route
          path="/auth"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<AuthSkeleton />}>
                <Auth />
              </Suspense>
            )
          }
        />

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <Suspense
                fallback={
                  userRole === "doctor" ? (
                    <DoctorDashboardSkeleton />
                  ) : (
                    <PatientDashboardSkeleton />
                  )
                }
              >
                {getDashboardComponent()}
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* PATIENT PROFILE */}

        <Route
          path="/profile-setup"
          element={
            isLoggedIn && userRole === "patient" ? (
              <Suspense fallback={<ProfileCompletionSkeleton />}>
                <ProfileCompletion />
              </Suspense>
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
            )
          }
        />


        {/* DOCTOR PROFILE SETUP */}

        <Route
          path="/doctor-profile-setup"
          element={
            isLoggedIn && userRole === "doctor" ? (
              doctorProfileCompleted ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Suspense fallback={<DoctorProfileSetupSkeleton />}>
                  <DoctorProfileSetup
                    isProfileIncomplete={!doctorProfileCompleted}
                  />
                </Suspense>
              )
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
            )
          }
        />

        {/* DOCTOR PROFILE EDIT */}

        <Route
          path="/doctor-profile-edit"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<DoctorProfileEditSkeleton />}>
                <DoctorProfileEdit
                  isProfileIncomplete={!doctorProfileCompleted}
                />
              </Suspense>
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
            )
          }
        />

        {/* CONSULTATIONS */}

        <Route
          path="/consultations"
          element={
            isLoggedIn ? (
              <Suspense fallback={<ConsultationsSkeleton />}>
                <Consultations />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* AVAILABLE DOCTORS */}

        <Route
          path="/available-doctors"
          element={
            isLoggedIn ? (
              <Suspense fallback={<AvailableDoctorsSkeleton />}>
                <AvailableDoctors />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* CONSULTED DOCTORS */}

        <Route
          path="/consulted-doctors"
          element={
            isLoggedIn ? (
              <Suspense fallback={<ConsultedDoctorsSkeleton />}>
                <ConsultedDoctors />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* CLINICAL RECORDS */}

        <Route
          path="/clinical-records"
          element={
            isLoggedIn ? (
              <Suspense fallback={<ClinicalRecordsSkeleton />}>
                <ClinicalRecords />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* PATIENT LONGITUDINAL HISTORY */}

        <Route
          path="/patient-history"
          element={
            isLoggedIn ? (
              <Suspense fallback={<PatientDashboardSkeleton />}>
                <PatientHistory />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />


        {/* CONSULTATION BOOKING */}

        <Route
          path="/consultation-booking"
          element={
            isLoggedIn && userRole === "patient" ? (
              <Suspense fallback={<ConsultationBookingSkeleton />}>
                <ConsultationBookingForm />
              </Suspense>
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
            )
          }
        />

        {/* VIDEO CALL */}

        <Route
          path="/video-call/:consultationId"
          element={
            isLoggedIn ? (
              <Suspense fallback={<VideoCallSkeleton />}>
                <VideoCall />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* AI TRIAGE */}

        <Route
          path="/ai-triage"
          element={
            <Suspense fallback={<AiTriageSkeleton />}>
              <AiTriage />
            </Suspense>
          }
        />

        {/* DOCTOR PATIENTS */}

        <Route
          path="/doctor-dashboard/patients"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<MyPatientsSkeleton />}>
                <MyPatients />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR SCHEDULE */}

        <Route
          path="/doctor-dashboard/schedule"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<DoctorScheduleSkeleton />}>
                <DoctorSchedule isProfileIncomplete={!doctorProfileCompleted} />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR ANALYTICS */}

        <Route
          path="/doctor-dashboard/analytics"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<DoctorAnalyticsSkeleton />}>
                <DoctorAnalytics isProfileIncomplete={!doctorProfileCompleted} />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR CLINICAL RECORDS */}

        <Route
          path="/doctor-dashboard/records"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<ClinicalRecordsSkeleton />}>
                <ClinicalRecords />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR SETTINGS */}

        <Route
          path="/doctor-dashboard/settings"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<DoctorProfileEditSkeleton />}>
                <DoctorProfileEdit isProfileIncomplete={!doctorProfileCompleted} />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR HELP CENTER */}

        <Route
          path="/doctor-dashboard/help"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <Suspense fallback={<DoctorDashboardSkeleton />}>
                <DoctorHelp isProfileIncomplete={!doctorProfileCompleted} />
              </Suspense>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      {/* Footer */}

      {!isAppRoute && <Footer />}
    </>
  );
};

export default App;
