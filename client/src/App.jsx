import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Auth from "./pages/Auth/Auth";
import PatientDashboard from "./pages/PatientDashBoard/PatientDashBoard";
import ProfileCompletion from "./pages/ProfileCompletion/ProfileCompletion";
import Consultations from "./pages/Consultations/Consultations";

const App = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isChecking, setIsChecking] = useState(true);

  // Check token on mount and when route changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    setIsChecking(false);
  }, [location.pathname]);

  // Listen for auth changes (login/logout events)
  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  // Determine if current route is an app route (dashboard, profile-setup, consultations)
  const isAppRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/profile-setup") ||
    location.pathname.startsWith("/consultations");

  // Show loading while checking token
  if (isChecking) {
    return null;
  }

  return (
    <>
      {/* Only show the global Navbar if we are NOT in the app routes */}
      {!isAppRoute && <Navbar />}

      <Routes>
        {/* Home/Landing Page - Redirect to dashboard if logged in */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />}
        />

        {/* Auth Page - Redirect to dashboard if already logged in */}
        <Route
          path="/auth"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Auth />}
        />

        {/* Dashboard - Redirect to auth if not logged in */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? <PatientDashboard /> : <Navigate to="/auth" replace />
          }
        />

        {/* Profile Setup - Redirect to auth if not logged in */}
        <Route
          path="/profile-setup"
          element={
            isLoggedIn ? <ProfileCompletion /> : <Navigate to="/auth" replace />
          }
        />

        {/* Consultations - Redirect to auth if not logged in */}
        <Route
          path="/consultations"
          element={
            isLoggedIn ? <Consultations /> : <Navigate to="/auth" replace />
          }
        />

        {/* Catch-all - Redirect to home or dashboard based on login status */}
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

      {/* Only show the global Footer if we are NOT in the app routes */}
      {!isAppRoute && <Footer />}
    </>
  );
};

export default App;
