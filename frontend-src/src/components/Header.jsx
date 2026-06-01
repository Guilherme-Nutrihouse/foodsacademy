import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExitIcon from "../assets/images/exit2.png";
import Logo from "../assets/logos/foodsacademy_logo.svg";
import User from "../assets/logos/logo_novo.svg";
import { getStoredUsername } from "../utils/app";
import Icon from "./Icon";
import SearchBar from "./Searchbar.jsx";

const navLinks = [
  ["CURSOS", "/home"],
  ["SOBRE", "/sobre"],
];

const Header = ({ username: usernameProp, search, setSearch }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
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
      /* segue com logout local */
    }

    localStorage.removeItem("username");
    navigate("/");
  };

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

        <div className="w-full min-w-0 lg:max-w-sm lg:flex-1">
          <SearchBar
            value={search ?? localSearch}
            onChange={setSearch ?? setLocalSearch}
          />
        </div>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } flex-col gap-3 border-t border-black/10 pt-3 lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-t-0 lg:pt-0`}
        >
          <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
            {navLinks.map(([label, path]) => (
              <Link
                key={path}
                to={path}
                className={`relative rounded-md px-2 py-2 text-sm font-semibold transition hover:text-yellow-600 lg:px-0 ${
                  isActive(path) ? "text-yellow-600" : "text-black"
                }`}
              >
                {label}
                {isActive(path) && (
                  <span className="absolute inset-x-2 bottom-0 hidden h-1 rounded bg-yellow-400 lg:block" />
                )}
              </Link>
            ))}
          </nav>

          <div className="relative flex min-w-0 items-center justify-between gap-3 lg:justify-start">
            <button
              type="button"
              className="group flex min-w-0 items-center gap-2 text-left text-sm font-medium text-black transition hover:text-yellow-700"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
            >
              <span className="min-w-0 truncate">
                Olá,{" "}
                <strong className="font-semibold">
                  {usernameProp || getStoredUsername()}
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
