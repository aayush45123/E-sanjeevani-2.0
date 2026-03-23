import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import PaletteDemo from "./pages/PaletteDemo/PaletteDemo";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<PaletteDemo />} />
      </Routes>
    </>
  );
};

export default App;
