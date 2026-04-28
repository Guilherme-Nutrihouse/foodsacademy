import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

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

  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const [moduloAberto, setModuloAberto] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth > 220 && newWidth < 400) {
        setSidebarWidth(newWidth);
      }
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  const handleVoltar = () => {
    setIsMobileOpen(false);
    if (location.pathname.includes("/materiais")) {
      navigate(`/video/${id || 1}`);
    } else {
      navigate("/home");
    }
  };

  const handleSelectVideo = (video) => {
    if (setSelectedVideo) setSelectedVideo(video);
    setIsMobileOpen(false);
  };

  const handleMaterialClick = () => {
    setIsMobileOpen(false);
    navigate(`/materiais/${id || 1}`);
  };

  const renderStatusIcon = (videoId) => (
    <div
      className={`shrink-0 ${watchedVideos[videoId] ? "text-green-400" : "text-white"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </div>
  );

  const renderVideoItem = (video) => (
    <li
      key={video.id}
      onClick={() => handleSelectVideo(video)}
      className={`flex cursor-pointer items-start gap-3 rounded-md px-1 py-1 transition ${
        watchedVideos[video.id] ? "text-green-300" : "hover:text-yellow-200"
      }`}
      title={video.titulo || video.descricao}
    >
      {renderStatusIcon(video.id)}
      <span className="min-w-0 flex-1 break-words leading-tight">
        {video.titulo || video.descricao}
      </span>
    </li>
  );

  const renderNavigationList = () => (
    <ul className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
      {modulos.length > 0 ? (
        modulos.map((mod) => (
          <li key={mod.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left font-semibold transition hover:text-yellow-200"
              onClick={() => setModuloAberto(moduloAberto === mod.id ? null : mod.id)}
            >
              <span className="min-w-0 flex-1 truncate">{mod.titulo}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 shrink-0 transform transition-transform ${
                  moduloAberto === mod.id ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {moduloAberto === mod.id && (
              <ul className="mt-3 space-y-3 pl-3">
                {mod.videos.map((video) => renderVideoItem(video))}
              </ul>
            )}
          </li>
        ))
      ) : videos.length > 0 ? (
        videos.map((video) => renderVideoItem(video))
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
          <div
            onMouseEnter={() => setMostrarTooltip(true)}
            onMouseLeave={() => setMostrarTooltip(false)}
          >
            <button
              onClick={handleVoltar}
              aria-label="Voltar"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#ffffff22]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {mostrarTooltip && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-yellow-400 px-2 py-1 text-xs text-white shadow-md">
                {location.pathname.includes("/materiais")
                  ? "Voltar ao vídeo"
                  : "Voltar a Home"}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold uppercase tracking-wide">MÓDULOS</h2>
        </div>

        {renderNavigationList()}

        {showButton && (
          <button
            onClick={handleMaterialClick}
            className="mt-4 w-full rounded-md bg-white py-2 font-semibold text-[#B95758] shadow-sm transition hover:bg-gray-100"
          >
            Material de Apoio
          </button>
        )}

        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-white active:bg-white"
        />
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] text-white shadow-lg md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={handleVoltar}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/15"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h2 className="min-w-0 flex-1 truncate text-center text-base font-bold uppercase tracking-wide">
            MÓDULOS
          </h2>

          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition hover:bg-white/15"
            aria-label="Abrir módulos"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? (
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

        {isMobileOpen && (
          <div className="border-t border-white/20 px-4 pb-4">
            <div className="custom-scrollbar max-h-[calc(100vh-5rem)] overflow-y-auto pt-4">
              {renderNavigationList()}

              {showButton && (
                <button
                  onClick={handleMaterialClick}
                  className="mt-5 w-full rounded-md bg-white py-2 font-semibold text-[#B95758] shadow-sm transition hover:bg-gray-100"
                >
                  Material de Apoio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
