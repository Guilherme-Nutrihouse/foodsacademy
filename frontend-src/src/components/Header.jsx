import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./Searchbar.jsx";
import Logo from "../assets/logos/logo_preta.png";
import User from "../assets/images/user.png";
import ExitIcon from "../assets/images/exit2.png";

const Header = ({ username: usernameProp, search: controlledSearch, setSearch }) => {
  const [storedUsername, setStoredUsername] = useState("Usuário");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const username = usernameProp || storedUsername;
  const searchValue = controlledSearch ?? localSearch;
  const handleSearchChange = setSearch ?? setLocalSearch;

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    setStoredUsername(
      savedUsername && savedUsername !== "undefined" ? savedUsername : "Usuário"
    );
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let timeoutId;
    if (isAccountOpen) {
      timeoutId = setTimeout(() => {
        setIsAccountOpen(false);
      }, 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [isAccountOpen]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative rounded-md px-2 py-2 text-sm font-semibold transition hover:text-yellow-600 lg:px-0 ${
      isActive(path) ? "text-yellow-600" : "text-black"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-[#FAF9F7]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-2">
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" className="flex shrink-0 items-center" aria-label="Foods Academy">
            <img src={Logo} alt="NutriHouse" className="h-9 w-auto sm:h-10" />
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-black transition hover:bg-black/5 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div className="w-full min-w-0 lg:max-w-sm lg:flex-1">
          <SearchBar value={searchValue} onChange={handleSearchChange} />
        </div>

        <div
          className={`${
            isMobileMenuOpen ? "flex" : "hidden"
          } flex-col gap-3 border-t border-black/10 pt-3 lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-t-0 lg:pt-0`}
        >
          <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
            <Link to="/home" className={navLinkClass("/home")}>
              CURSOS
              {isActive("/home") && (
                <span className="absolute inset-x-2 bottom-0 hidden h-1 rounded bg-yellow-400 lg:block" />
              )}
            </Link>

            <Link to="/sobre" className={navLinkClass("/sobre")}>
              SOBRE
              {isActive("/sobre") && (
                <span className="absolute inset-x-2 bottom-0 hidden h-1 rounded bg-yellow-400 lg:block" />
              )}
            </Link>
          </nav>

          <div className="relative flex min-w-0 items-center justify-between gap-3 lg:justify-start">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 text-left text-black"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              aria-expanded={isAccountOpen}
            >
              <span className="min-w-0 truncate">
                Olá, <strong>{username}</strong>
              </span>
              <img src={User} alt="" className="h-5 w-5 shrink-0" />
            </button>

            {isAccountOpen && (
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
