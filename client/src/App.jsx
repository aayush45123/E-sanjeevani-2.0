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
import ConsultedDoctors from "./pages/ConsultedDoctors/ConsultedDoctors";
import AvailableDoctors from "./pages/AvailableDoctors/AvailableDoctors";
import ClinicalRecords from "./pages/ClinicalRecords/ClinicalRecords";

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
            isLoggedIn && userRole === "patient" ? (
              <ProfileCompletion />
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
                <DoctorProfileSetup
                  isProfileIncomplete={!doctorProfileCompleted}
                />
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
              <DoctorProfileEdit
                isProfileIncomplete={!doctorProfileCompleted}
              />
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
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

        {/* AVAILABLE DOCTORS */}

        <Route
          path="/available-doctors"
          element={
            isLoggedIn ? <AvailableDoctors /> : <Navigate to="/auth" replace />
          }
        />

        {/* CONSULTED DOCTORS */}

        <Route
          path="/consulted-doctors"
          element={
            isLoggedIn ? <ConsultedDoctors /> : <Navigate to="/auth" replace />
          }
        />

        {/* CLINICAL RECORDS */}

        <Route
          path="/clinical-records"
          element={
            isLoggedIn ? <ClinicalRecords /> : <Navigate to="/auth" replace />
          }
        />

        {/* CONSULTATION BOOKING */}

        <Route
          path="/consultation-booking"
          element={
            isLoggedIn && userRole === "patient" ? (
              <ConsultationBookingForm />
            ) : (
              <Navigate to={isLoggedIn ? "/dashboard" : "/auth"} replace />
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
