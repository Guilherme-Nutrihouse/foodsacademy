import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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
      </Routes>
    </Router>
  );
}

export default App;
