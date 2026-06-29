import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon";

const Sidebar = ({
  showButton = true,
  modulos = [],
  videos = [],
  setSelectedVideo,
  watchedVideos = {},
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [moduloAberto, setModuloAberto] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const resize = (e) => {
      if (e.clientX > 220 && e.clientX < 400) setSidebarWidth(e.clientX);
    };
    const stop = () => setIsResizing(false);

    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stop);
    };
  }, [isResizing]);

  const closeAnd = (action) => {
    setIsMobileOpen(false);
    action();
  };

  const voltar = (salvarPagina = false) =>
    closeAnd(() => {
      if (salvarPagina) {
        localStorage.setItem("paginaAnterior", window.location.pathname);
      }
      navigate(-1);
    });

  const selectVideo = (video) =>
    closeAnd(() => {
      if (setSelectedVideo) setSelectedVideo(video);
    });

  const MaterialButton = ({ className = "mt-4" }) =>
    showButton && (
      <button
        onClick={() => closeAnd(() => navigate(`/materiais/${id || 1}`))}
        className={`${className} w-full rounded-md bg-white py-2 font-semibold text-[#B95758] shadow-sm transition hover:bg-gray-100`}
      >
        Material de Apoio
      </button>
    );

  const VideoItem = ({ video }) => {
    const watched = watchedVideos[video.id];

    return (
      <li
        onClick={() => selectVideo(video)}
        className={`flex cursor-pointer items-start gap-3 rounded-md px-1 py-1 transition ${
          watched ? "text-green-300" : "hover:text-yellow-200"
        }`}
        title={video.titulo || video.descricao}
      >
        <Icon
          name="check"
          className={`h-[18px] w-[18px] shrink-0 ${
            watched ? "text-green-400" : "text-white"
          }`}
        />
        <span className="min-w-0 flex-1 break-words leading-tight">
          {video.titulo || video.descricao}
        </span>
      </li>
    );
  };

  const NavigationList = () => (
    <ul className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
      {modulos.length ? (
        modulos.map((modulo) => (
          <li key={modulo.id}>
            <button
              type="button"
              onClick={() =>
                setModuloAberto(moduloAberto === modulo.id ? null : modulo.id)
              }
              className="flex w-full items-center justify-between gap-3 text-left font-semibold transition hover:text-yellow-200"
            >
              <span className="min-w-0 flex-1 truncate">{modulo.titulo}</span>
              <Icon
                name="right"
                className={`h-4 w-4 shrink-0 transition-transform ${
                  moduloAberto === modulo.id ? "rotate-90" : ""
                }`}
              />
            </button>

            {moduloAberto === modulo.id && (
              <ul className="mt-3 space-y-3 pl-3">
                {modulo.videos.map((video) => (
                  <VideoItem key={video.id} video={video} />
                ))}
              </ul>
            )}
          </li>
        ))
      ) : videos.length ? (
        videos.map((video) => <VideoItem key={video.id} video={video} />)
      ) : (
        <li className="text-white/80">Nenhum item disponível.</li>
      )}
    </ul>
  );

  return (
    <>
      <aside
        style={{ width: sidebarWidth }}
        className="sidebar fixed left-0 top-0 hidden h-full select-none flex-col justify-between bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] p-6 text-white shadow-lg md:flex"
      >
        <div className="relative mb-6 flex items-center gap-3">
          <div className="group relative">
            <button
              onClick={() => voltar()}
              aria-label="Voltar"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#ffffff22]"
            >
              <Icon
                name="back"
                className="h-5 w-5 text-white"
                strokeWidth={3}
              />
            </button>
            <div className="absolute left-10 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-yellow-400 px-2 py-1 text-xs text-white shadow-md group-hover:block">
              {location.pathname.includes("/materiais")
                ? "Voltar ao vídeo"
                : "Voltar a Página Anterior"}
            </div>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-wide">MÓDULOS</h2>
        </div>

        <NavigationList />
        <MaterialButton />

        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-white active:bg-white"
        />
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] text-white shadow-lg md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => voltar(true)}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/15"
          >
            <Icon name="back" strokeWidth={3} />
          </button>

          <h2 className="min-w-0 flex-1 truncate text-center text-base font-bold uppercase tracking-wide">
            MÓDULOS
          </h2>

          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition hover:bg-white/15"
            aria-label="Abrir módulos"
            aria-expanded={isMobileOpen}
          >
            <Icon name={isMobileOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>

        {isMobileOpen && (
          <div className="border-t border-white/20 px-4 pb-4">
            <div className="custom-scrollbar max-h-[calc(100vh-5rem)] overflow-y-auto pt-4">
              <NavigationList />
              <MaterialButton className="mt-5" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
