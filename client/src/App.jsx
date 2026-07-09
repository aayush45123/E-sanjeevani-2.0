// FULL FINAL UPDATED App.jsx
// Only patient profile completion logic updated
// No existing functionality removed
// Professional industry-level fix

import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Auth from "./pages/Auth/Auth";

import PatientDashboard from "./pages/PatientDashBoard/PatientDashBoard";
import DoctorDashboard from "./pages/DoctorDashboard/DoctorDashboard";
import MyPatients from "./pages/DoctorDashboard/MyPatients";
import ProfileCompletion from "./pages/ProfileCompletion/ProfileCompletion";
import Consultations from "./pages/Consultations/Consultations";
import ConsultationBookingForm from "./pages/ConsultationBookingForm/ConsultationBookingForm";
import DoctorProfileSetup from "./pages/DoctorProfileSetup/DoctorProfileSetup";
import DoctorProfileEdit from "./pages/DoctorProfileEdit/DoctorProfileEdit";
import DoctorSchedule from "./pages/DoctorDashboard/DoctorSchedule";
import DoctorAnalytics from "./pages/DoctorDashboard/DoctorAnalytics";
import VideoCall from "./pages/VideoCall/VideoCall";
import AiTriage from "./components/AiTriage/AiTriage";

/*
IMPORTANT FIX:
added apiClient import
instead of checking profile using authApi.me()
*/
import { doctorProfileApi, authApi, apiClient } from "./utils/api";

const App = () => {
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const [doctorProfileCompleted, setDoctorProfileCompleted] = useState(true);

  const [patientProfileCompleted, setPatientProfileCompleted] = useState(true);

  const [isChecking, setIsChecking] = useState(true);

  /*
  ==================================================
  CHECK AUTH + ROLE + PROFILE STATUS
  ==================================================
  */

  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      setIsLoggedIn(!!token);
      setUserRole(role);

      /*
      ================================================
      DOCTOR PROFILE CHECK
      ================================================
      */

      if (token && role === "doctor") {
        try {
          const response = await doctorProfileApi.checkProfileStatus();

          setDoctorProfileCompleted(response.data.profileCompleted || false);
        } catch (error) {
          console.error("Doctor profile check failed:", error);

          setDoctorProfileCompleted(false);
        }
      }

      /*
      ================================================
      PATIENT PROFILE CHECK
      FIXED:
      use /api/patient/profile/status
      instead of authApi.me()
      ================================================
      */

      if (token && role === "patient") {
        try {
          const response = await apiClient.get("/patient/profile/status");

          setPatientProfileCompleted(
            response.data?.data?.isProfileComplete || false,
          );
        } catch (error) {
          console.error("Patient profile check failed:", error);

          setPatientProfileCompleted(false);
        }
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [location.pathname]);

  /*
  ==================================================
  AUTH + PROFILE UPDATE LISTENER
  ==================================================
  */

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole"));
    };

    /*
    FIXED:
    refresh patient profile using
    /api/patient/profile/status
    */

    const handleProfileUpdated = async () => {
      try {
        const response = await apiClient.get("/patient/profile/status");

        setPatientProfileCompleted(
          response.data?.data?.isProfileComplete || false,
        );
      } catch (error) {
        console.error("Error refreshing profile status:", error);
      }
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
    return null;
  }

  /*
  ==================================================
  DASHBOARD LOGIC
  ==================================================
  */

  const getDashboardComponent = () => {
    /*
    Doctor incomplete
    */

    if (userRole === "doctor" && !doctorProfileCompleted) {
      return <Navigate to="/doctor-profile-setup" replace />;
    }

    /*
    Patient incomplete
    */

    if (userRole === "patient" && !patientProfileCompleted) {
      return <Navigate to="/profile-setup" replace />;
    }

    if (userRole === "doctor") {
      return <DoctorDashboard isProfileIncomplete={!doctorProfileCompleted} />;
    }

    return <PatientDashboard />;
  };

  return (
    <>
      {/* Navbar only on landing page */}

      {showNavbar && <Navbar />}

      <Routes>
        {/* HOME */}

        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />}
        />

        {/* AUTH */}

        <Route
          path="/auth"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Auth />}
        />

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              getDashboardComponent()
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* PATIENT PROFILE */}

        <Route
          path="/profile-setup"
          element={
            isLoggedIn ? <ProfileCompletion /> : <Navigate to="/auth" replace />
          }
        />

        {/* DOCTOR PROFILE SETUP */}

        <Route
          path="/doctor-profile-setup"
          element={
            isLoggedIn ? (
              <DoctorProfileSetup
                isProfileIncomplete={!doctorProfileCompleted}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* DOCTOR PROFILE EDIT */}

        <Route
          path="/doctor-profile-edit"
          element={
            isLoggedIn ? (
              <DoctorProfileEdit
                isProfileIncomplete={!doctorProfileCompleted}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* CONSULTATIONS */}

        <Route
          path="/consultations"
          element={
            isLoggedIn ? <Consultations /> : <Navigate to="/auth" replace />
          }
        />

        {/* CONSULTATION BOOKING */}

        <Route
          path="/consultation-booking"
          element={
            isLoggedIn ? (
              <ConsultationBookingForm />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* VIDEO CALL */}

        <Route
          path="/video-call/:consultationId"
          element={isLoggedIn ? <VideoCall /> : <Navigate to="/auth" replace />}
        />

        {/* AI TRIAGE */}

        <Route path="/ai-triage" element={<AiTriage />} />

        {/* DOCTOR PATIENTS */}

        <Route
          path="/doctor-dashboard/patients"
          element={
            isLoggedIn && userRole === "doctor" ? (
              <MyPatients />
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
              <DoctorSchedule isProfileIncomplete={!doctorProfileCompleted} />
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
              <DoctorAnalytics isProfileIncomplete={!doctorProfileCompleted} />
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
