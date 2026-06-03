import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate  } from "react-router-dom";
import Login from "./components/Login";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Cards from "./pages/Cards";
import VideoPage from "./pages/VideoPage";
import MaterialPage from "./pages/MaterialPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/materiais/:id" element={<MaterialPage />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
