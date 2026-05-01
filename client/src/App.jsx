// FULL UPDATED App.jsx
// Added Doctor Profile Setup Navigation + Redirect Logic

import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Auth from "./pages/Auth/Auth";

import PatientDashboard from "./pages/PatientDashBoard/PatientDashBoard";
import DoctorDashboard from "./pages/DoctorDashboard/DoctorDashboard";
import ProfileCompletion from "./pages/ProfileCompletion/ProfileCompletion";
import Consultations from "./pages/Consultations/Consultations";
import ConsultationBookingForm from "./pages/ConsultationBookingForm/ConsultationBookingForm";
import DoctorProfileSetup from "./pages/DoctorProfileSetup/DoctorProfileSetup";
import DoctorProfileEdit from "./pages/DoctorProfileEdit/DoctorProfileEdit";
import VideoCall from "./pages/VideoCall/VideoCall";

import { doctorProfileApi, authApi } from "./utils/api";

const App = () => {
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const [doctorProfileCompleted, setDoctorProfileCompleted] = useState(true);

  const [patientProfileCompleted, setPatientProfileCompleted] = useState(true);

  const [isChecking, setIsChecking] = useState(true);

  /*
  ==================================================
  CHECK AUTH + ROLE + DOCTOR PROFILE STATUS
  ==================================================
  */

  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      setIsLoggedIn(!!token);
      setUserRole(role);

      /*
      Check doctor profile completion only for doctors
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
      Check patient profile completion only for patients
      */

      if (token && role === "patient") {
        try {
          const userRes = await authApi.me();
          const userData = userRes.data.user || userRes.data;
          // Check if user has basic profile info
          setPatientProfileCompleted(
            userData?.phone &&
              userData?.age &&
              userData?.gender &&
              userData?.bloodType
              ? true
              : false,
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
  AUTH CHANGE LISTENER
  ==================================================
  */

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole"));
    };

    const handleProfileUpdated = async () => {
      // Refresh patient profile completion status immediately
      try {
        const userRes = await authApi.me();
        const userData = userRes.data.user || userRes.data;
        setPatientProfileCompleted(
          userData?.phone &&
            userData?.age &&
            userData?.gender &&
            userData?.bloodType
            ? true
            : false,
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
  APP ROUTES CHECK - SHOW SIDEBAR, HIDE NAVBAR
  ==================================================
  */

  const isAppRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/profile-setup") ||
    location.pathname.startsWith("/doctor-profile-setup") ||
    location.pathname.startsWith("/doctor-profile-edit") ||
    location.pathname.startsWith("/consultations") ||
    location.pathname.startsWith("/consultation-booking") ||
    location.pathname.startsWith("/video-call") ||
    location.pathname.startsWith("/auth");

  /*
  Show navbar only on landing page
  */
  const showNavbar = location.pathname === "/" || location.pathname === "";

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
    If doctor profile incomplete → force setup page
    */

    if (userRole === "doctor" && !doctorProfileCompleted) {
      return <Navigate to="/doctor-profile-setup" replace />;
    }

    /*
    If patient profile incomplete → force setup page
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

      {/* Global Footer */}

      {!isAppRoute && <Footer />}
    </>
  );
};

export default App;
