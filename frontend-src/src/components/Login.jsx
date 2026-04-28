import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logos/logo_branca.png";
import OndaTop from "../assets/images/background_onda1.jpg";
import OndaBottom from "../assets/images/background_onda2.jpg";

const Login = () => {
  const [userDN, setUserDN] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userDN: `${userDN}@nutrihouse.intra`,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("username", data.username);
        navigate("/home");
      } else {
        //  Verifica se o backend retornou mensagem específica
      if (
        data.message?.toLowerCase().includes("senha") ||
        data.message?.toLowerCase().includes("password")
      ) {
        setError("Senha incorreta");
      } else if (
        data.message?.toLowerCase().includes("usuário") ||
        data.message?.toLowerCase().includes("user")
      ) {
        setError("Usuário não encontrado");
      } else {
        setError("Falha na autenticação");
      }
    }
    } catch (err) {
      setError("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#FAF9F7] overflow-hidden px-4">
      {/* Onda superior esquerda */}
      <img
        src={OndaTop}
        alt="Onda superior"
        className="absolute top-0 left-0 w-auto h-[30%] max-w-[50%] object-contain z-0"
      />

      {/* Onda inferior direita */}
      <img
        src={OndaBottom}
        alt="Onda inferior"
        className="absolute bottom-0 right-0 w-auto h-[30%] max-w-[50%] object-contain z-0"
      />

      {/* Box de login */}
      <div className="relative z-10 flex flex-col items-center 
        w-full max-w-[360px]
        bg-[linear-gradient(135deg,_#B95758,_#e14d3a)]
        p-4 md:p-4 rounded-2xl shadow-1g text-center">
        <img
          src={Logo}
          alt="Logo NutriHouse"
          className="w-[200px] mb-[-20px]"
        />

        <h2 className="text-white text-2xl font-semibold mt-1">Bem-vindo</h2>
        <p className="text-white text-sm mb-4">Acesse com seu usuário:</p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="text-center">
            <label htmlFor="usuario" className="text-white font-medium block mb-1">
              Usuário:
            </label>
            <input
              id="usuario"
              type="text"
              value={userDN}
              onChange={(e) => setUserDN(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-[265px] p-1 rounded-full border-none outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <div className="text-center">
            <label htmlFor="senha" className="text-white font-medium block mb-1">
              Senha:
            </label>
            <input
              id="senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-[265px] p-1 rounded-full border-none outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2 w-40 mx-auto bg-white text-[#0c0b0b] font-bold rounded-full transition-all hover:bg-gray-300 disabled:opacity-80"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a
          href="https://app.milvus.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white text-sm mt-4 hover:underline"
        >
          Esqueceu a senha?
        </a>

        {error && (
          <p className="text-red-200 text-sm mt-3 bg-red-600/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
