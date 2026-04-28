import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./Searchbar.jsx";
import Logo from "../assets/logos/logo_preta.png";
import User from "../assets/images/user.png";
import ExitIcon from "../assets/images/exit2.png"; 

const Header = () => {
  const [username, setUsername] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(
      storedUsername && storedUsername !== "undefined" ? storedUsername : "Usuário"
    );
  }, []);

  useEffect(() => {
    let timeoutId;
    if (isMenuOpen) {
      timeoutId = setTimeout(() => {
        setIsMenuOpen(false);
      }, 4000); 
    }
    return () => clearTimeout(timeoutId);
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("username"); 
    navigate("/"); // Redireciona para a página de login
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[#FAF9F7] shadow-sm border-b-0">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-2">
        {/* Logo à esquerda */}
        <div className="flex items-center">
          <img src={Logo} alt="NutriHouse" className="h-10 w-auto" />
        </div>

      <SearchBar value={search} onChange={setSearch} />  

        {/* Direita: NAV + Saudações lado a lado */}
        <div className="flex items-center gap-10">
          {/* Navbar */}
          <nav className="flex items-center gap-6">
            {/* Link CURSOS */}
            <div className="relative">
              <Link
                to="/home"
                className={`text-black font-medium transition hover:text-yellow-600 ${
                  location.pathname === "/home" ? "text-yellow-600 font-semibold" : ""
                }`}
              >
                CURSOS
              </Link>
              {location.pathname === "/home" && (
                <div className="absolute left-0 w-full h-1 bg-yellow-400 rounded mt-1" />
              )}
            </div>

            {/* Link SOBRE */}
            <div className="relative">
              <Link
                to="/sobre"
                className={`text-black font-medium transition hover:text-yellow-600 ${
                  location.pathname === "/sobre" ? "text-yellow-600 font-semibold" : ""
                }`}
              >
                SOBRE
              </Link>
              {location.pathname === "/sobre" && (
                <div className="absolute left-0 w-full h-1 bg-yellow-400 rounded mt-1" />
              )}
            </div>
          </nav>

          {/* Saudação e menu de logout */}
          <div className="relative flex items-center gap-2">
            <span
              className="text-black cursor-pointer"
              onClick={() => setIsMenuOpen((prev) => !prev)} 
            >
              Olá, <strong>{username}</strong>
            </span>
            <img src={User} alt="User" className="h-5 w-5 cursor-pointer" 
            onClick={() => setIsMenuOpen((prev) => !prev)} />

            {/* logout */}
            {isMenuOpen && (
              <div className="absolute right-5 top-6 bg-transparent w-38 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-2 py-2 text-sm font-poppins 
                 text-white font-bold bg-black rounded-lg hover:bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] transition-colors">
                  <img src={ExitIcon} alt="Exit" className="h-6 w-6" />
                  Encerrar Sessão
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
