import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExitIcon from "../assets/images/exit2.png";
import Logo from "../assets/logos/foodsacademy_logo.svg";
import User from "../assets/logos/logo_novo.svg";
import { useUsuario } from "../contexts/UsuarioContext";
import Icon from "./Icon";
import SearchBar from "./Searchbar.jsx";
import { CirclePlus, Upload } from "lucide-react";
import Input from "./Input";

const navLinks = [
  ["CURSOS", "/home"],
  ["SOBRE", "/sobre"],
  ["CONTATOS", "/contatos"],
];

const Header = ({ username: usernameProp, search, setSearch }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [pngFile, setPngFile] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, limparUsuario, isAdmin } = useUsuario();
  const username = usernameProp || usuario.nomeCompleto || usuario.username;

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const timeout = setTimeout(() => setAccountOpen(false), 4000);
    return () => clearTimeout(timeout);
  }, [accountOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {

    }

    limparUsuario();
    navigate("/");
  };

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    if (!pngFile) {
      setUploadError("Selecione um PNG para enviar.");
      setUploadSuccess("");
      return;
    }

    const fileName = String(pngFile.name || "").toLowerCase();
    const allowedPngTypes = ["image/png", "application/png", "application/octet-stream", ""];
    if (!fileName.endsWith(".png") || !allowedPngTypes.includes(pngFile.type || "")) {
      setUploadError("Envie um arquivo PNG valido.");
      setUploadSuccess("");
      return;
    }

    const nomeLimpo = titulo.trim();

    if (!nomeLimpo) {
      setError("Nome do curso e obrigatorio.");
      setUploadError("");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", nomeLimpo);
    formData.append("png", pngFile, pngFile.name);

    try {

      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const options = {
        method: "POST",
        credentials: "include",
        body: formData,
      };
      const response = await fetch("/api/cursos", options);

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || data.message || "Nao foi possivel realizar o cadastro.",
        );
        return;
      }

      setTitulo("");
      setShowInput(false);
      setPngFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSuccess(data.message || "Curso criado com sucesso.");
      setShowInput(false);
      alert("Curso adicionado com sucesso!");

    } catch (err) {
      console.error("Erro ao cadastrar curso:", err);
      setError("Erro ao conectar ao servidor.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-[#FAF9F7]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-2">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/home"
            className="flex h-11 w-36 shrink-0 items-center overflow-hidden sm:h-[3.25rem] sm:w-40 lg:w-44"
            aria-label="Foods Academy"
          >
            <img
              src={Logo}
              alt="Foods Academy"
              className="h-full w-full object-cover object-[center_45%]"
            />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-black transition hover:bg-black/5 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>

        {setSearch && (
          <div className="w-full min-w-0 lg:max-w-sm lg:flex-1">
            <SearchBar
              value={search ?? localSearch}
              onChange={setSearch ?? setLocalSearch}
            />
          </div>
        )}

        <div
          className={`${menuOpen ? "flex" : "hidden"
            } flex-col gap-3 border-t border-black/10 pt-3 lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-t-0 lg:pt-0`}
        >
          <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
            {navLinks.map(([label, path]) => (
              <Link
                key={path}
                to={path}
                className={`relative rounded-md px-2 py-2 text-sm font-semibold transition hover:text-yellow-600 lg:px-0 ${isActive(path) ? "text-yellow-600" : "text-black"
                  }`}
              >
                {label}
                {isActive(path) && (
                  <span className="absolute inset-x-2 bottom-0 hidden h-1 rounded bg-yellow-400 lg:block" />
                )}
              </Link>
            ))}
          </nav>

          <div className="relative flex min-w-0 flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:justify-start">
            <button
              type="button"
              className="group flex min-w-0 items-center gap-2 text-left text-sm font-medium text-black transition hover:text-yellow-700"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
            >
              <span className="min-w-0 truncate">
                Olá,{" "}
                <strong className="font-semibold">
                  {username}
                </strong>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm transition group-hover:border-yellow-500/70 sm:h-9 sm:w-9">
                <img src={User} alt="" className="h-full w-full object-cover" />
              </span>
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-44">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[linear-gradient(135deg,_#B95758,_#e14d3a)]"
                >
                  <img src={ExitIcon} alt="" className="h-5 w-5" />
                  Encerrar sessão
                </button>
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowInput((value) => !value)}
                aria-label={showInput ? "Fechar cadastro de curso" : "Adicionar curso"}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-black/10 px-3 text-sm font-bold shadow-sm backdrop-blur transition hover:bg-white hover:text-[#9f3f40] ${showInput
                  ? "bg-white text-[#9f3f40] ring-2 ring-[#B95758]/25"
                  : "bg-[#FAF9F7] text-[#B95758]"
                  }`}
              >
                <CirclePlus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                <span className="hidden sm:inline">Novo curso</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {showInput && (
        <div className="mx-auto max-w-screen-xl px-4 pb-3 lg:px-6">
          <section className="rounded-lg border border-black/10 border-l-4 border-l-[#B95758] bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4">
            <form
              className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)_auto] lg:items-end"
              onSubmit={onSubmit}
            >
              <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-[#000000]">
                Nome
                <span className="rounded-md border border-black/10 bg-white shadow-sm">
                  <Input
                    name="nome"
                    placeholder="Ex: TecFood - "
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(e.target.value);
                      setError("");
                    }}
                  />
                </span>
              </label>

              <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700">
                Ícone (PNG 512x512)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,.png"
                  onChange={(event) => {
                    setPngFile(event.target.files?.[0] || null);
                    setUploadError("");
                    setUploadSuccess("");
                  }}
                  className="min-h-10 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[#F0F0E9] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#B95758] focus:border-[#B95758] focus:ring-2 focus:ring-[#B95758]/20"
                />
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#B95758] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f3f40] disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? "Cadastrando..." : "Novo Curso"}
              </button>
            </form>

            {(error || uploadError || uploadSuccess) && (
              <p
                className={`mt-3 text-sm font-semibold ${uploadSuccess ? "text-green-700" : "text-[#B95758]"
                  }`}
              >
                {uploadSuccess || uploadError || error}
              </p>
            )}
          </section>
        </div>
      )}
    </header>
  );
};

export default Header;
