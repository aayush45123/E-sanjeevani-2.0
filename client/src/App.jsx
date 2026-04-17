import React from "react";
import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Auth from "./pages/Auth/Auth";
import PatientDashboard from "./pages/PatientDashBoard/PatientDashBoard";
import ProfileCompletion from "./pages/ProfileCompletion/ProfileCompletion";

const App = () => {
  const location = useLocation();

  // Define which routes should NOT have the public marketing Navbar and Footer
  const isAppRoute = 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/profile-setup');

  return (
    <>
      {/* Only show the global Navbar if we are NOT in the app routes */}
      {!isAppRoute && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/auth" element={<Auth />}></Route>
        <Route path="/dashboard" element={<PatientDashboard />}></Route>
        <Route path="/profile-setup" element={<ProfileCompletion />}></Route>
      </Routes>

      {/* Only show the global Footer if we are NOT in the app routes */}
      {!isAppRoute && <Footer />}
    </>
  );
};

export default App;