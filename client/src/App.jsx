// FULL UPDATED App.jsx
// Industry-level fixed profile completion + sidebar-safe routing

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
import VideoCall from "./pages/VideoCall/VideoCall";
import AiTriage from "./components/AiTriage/AiTriage";

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
  CHECK ACCESS
  ==================================================
  */

  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      setIsLoggedIn(!!token);
      setUserRole(role);

      /*
      DOCTOR PROFILE CHECK
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
      PATIENT PROFILE CHECK
      */

      if (token && role === "patient") {
        try {
          const response = await apiClient.get("/patient/profile/status");

          setPatientProfileCompleted(
            response.data?.data?.isProfileComplete || false,
          );
        } catch (error) {
          console.error("Patient profile status check failed:", error);

          setPatientProfileCompleted(false);
        }
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [location.pathname]);

  /*
  ==================================================
  AUTH LISTENERS
  ==================================================
  */

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole"));
    };

    const handleProfileUpdated = async () => {
      try {
        const response = await apiClient.get("/patient/profile/status");

        setPatientProfileCompleted(
          response.data?.data?.isProfileComplete || false,
        );
      } catch (error) {
        console.error("Profile refresh failed:", error);
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
  ROUTE CHECK
  ==================================================
  */

  const isAppRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/doctor-dashboard") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/doctor-profile") ||
    location.pathname.startsWith("/consultations") ||
    location.pathname.startsWith("/consultation-booking") ||
    location.pathname.startsWith("/video-call") ||
    location.pathname.startsWith("/auth");

  const showNavbar = location.pathname === "/" || location.pathname === "";

  if (isChecking) return null;

  /*
  ==================================================
  DASHBOARD REDIRECT LOGIC
  ==================================================
  */

  const getDashboardComponent = () => {
    if (userRole === "doctor" && !doctorProfileCompleted) {
      return <Navigate to="/doctor-profile-setup" replace />;
    }

    if (userRole === "patient" && !patientProfileCompleted) {
      return <Navigate to="/profile" replace />;
    }

    if (userRole === "doctor") {
      return <DoctorDashboard />;
    }

    return <PatientDashboard />;
  };

  return (
    <>
      {showNavbar && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />}
        />

        <Route
          path="/auth"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Auth />}
        />

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

        <Route
          path="/profile"
          element={
            isLoggedIn ? <ProfileCompletion /> : <Navigate to="/auth" replace />
          }
        />

        <Route
          path="/doctor-profile-setup"
          element={
            isLoggedIn ? (
              <DoctorProfileSetup />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route
          path="/doctor-profile-edit"
          element={
            isLoggedIn ? <DoctorProfileEdit /> : <Navigate to="/auth" replace />
          }
        />
      </Routes>

      {!isAppRoute && <Footer />}
    </>
  );
};

export default App;
