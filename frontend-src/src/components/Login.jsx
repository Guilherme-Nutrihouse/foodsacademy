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
      } else if (
        data.message?.toLowerCase().includes("senha") ||
        data.message?.toLowerCase().includes("password")
      ) {
        setError("Senha incorreta");
      } else if (
        data.message?.toLowerCase().includes("usuario") ||
        data.message?.toLowerCase().includes("usuário") ||
        data.message?.toLowerCase().includes("user")
      ) {
        setError("Usuário não encontrado");
      } else {
        setError("Falha na autenticação");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F7] px-4 py-8">
      <img
        src={OndaTop}
        alt=""
        className="pointer-events-none absolute left-0 top-0 z-0 h-[22%] max-w-[70%] object-contain sm:h-[30%] sm:max-w-[50%]"
      />

      <img
        src={OndaBottom}
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-[22%] max-w-[70%] object-contain sm:h-[30%] sm:max-w-[50%]"
      />

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-lg bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] p-5 text-center shadow-lg sm:p-6">
        <img
          src={Logo}
          alt="Logo NutriHouse"
          className="mb-[-16px] w-44 sm:w-[200px]"
        />

        <h1 className="mt-1 text-2xl font-semibold text-white">Bem-vindo</h1>
        <p className="mb-4 text-sm text-white">Acesse com seu usuário:</p>

        <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
          <div className="text-center">
            <label htmlFor="usuario" className="mb-1 block font-medium text-white">
              Usuário:
            </label>
            <input
              id="usuario"
              type="text"
              value={userDN}
              onChange={(e) => setUserDN(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full max-w-[265px] rounded-full border-none p-2 outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <div className="text-center">
            <label htmlFor="senha" className="mb-1 block font-medium text-white">
              Senha:
            </label>
            <input
              id="senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full max-w-[265px] rounded-full border-none p-2 outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mx-auto mt-2 w-full max-w-40 rounded-full bg-white py-2 font-bold text-[#0c0b0b] transition-all hover:bg-gray-300 disabled:opacity-80"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a
          href="https://app.milvus.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm text-white hover:underline"
        >
          Esqueceu a senha?
        </a>

        {error && (
          <p className="mt-3 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
      </section>
    </main>
  );
};

export default Login;
