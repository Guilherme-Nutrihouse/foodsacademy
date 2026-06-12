import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Cards from "./pages/Cards";
import VideoPage from "./pages/VideoPage";
import MaterialPage from "./pages/MaterialPage";
import { fetchJson } from "./utils/app";

// Valida a sessao assinada no backend antes de mostrar qualquer tela interna.
const PrivateRoute = () => {
  const [status, setStatus] = useState("checking");
  const location = useLocation();

  useEffect(() => {
    let active = true;
    setStatus("checking");

    fetchJson("/api/remember-session")
      .then((data) => {
        if (!active) return;
        if (data.username) localStorage.setItem("username", data.username);
        setStatus("authorized");
      })
      .catch(() => {
        if (!active) return;
        // Remove identidade local quando a sessao real nao existe mais.
        localStorage.removeItem("username");
        setStatus("unauthorized");
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF9F7] px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-700">Validando acesso...</h1>
      </main>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/video/:id" element={<VideoPage />} />
          <Route path="/materiais/:id" element={<MaterialPage />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
