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
import Contatos from "./pages/Contatos";
import VideoPage from "./pages/VideoPage";
import MaterialPage from "./pages/MaterialPage";
import { UsuarioProvider, useUsuario } from "./contexts/UsuarioContext";
import { fetchJson } from "./utils/app";

// Valida a sessao assinada uma vez enquanto a area interna estiver montada.
const PrivateRoute = () => {
  const [status, setStatus] = useState("checking");
  const location = useLocation();
  const { atualizarUsuario, limparUsuario } = useUsuario();

  useEffect(() => {
    let active = true;
    setStatus("checking");

    fetchJson("/api/remember-session")
      .then((data) => {
        if (!active) return;
        atualizarUsuario(data);
        setStatus("authorized");
      })
      .catch(() => {
        if (!active) return;
        // Remove identidade local quando a sessao real nao existe mais.
        limparUsuario();
        setStatus("unauthorized");
      });

    return () => {
      active = false;
    };
  }, [atualizarUsuario, limparUsuario]); // Evita nova validacao ao trocar de curso/rota interna.

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
    <UsuarioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route path="/materiais/:id" element={<MaterialPage />} />
            <Route path="/sobre" element={<Sobre />} />
            {/* Integra contatos na mesma area interna protegida por sessao LDAP. */}
            <Route path="/contatos" element={<Contatos />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </Router>
    </UsuarioProvider>
  );
}

export default App;
