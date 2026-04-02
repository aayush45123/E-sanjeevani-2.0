import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Auth from "./pages/Auth/Auth";
import PatientDashboard from "./pages/PatientDashBoard/PatientDashBoard";
import ProfileCompletion from "./pages/ProfileCompletion/ProfileCompletion";

const App = () => {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/auth" element={<Auth />}></Route>
        <Route path="/dashboard" element={<PatientDashboard />}></Route>
        <Route path="/profile-setup" element={<ProfileCompletion />}></Route>
      </Routes>
      <Footer></Footer>
    </>
  );
};

export default App;
