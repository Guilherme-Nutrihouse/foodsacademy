import React, { useState, useEffect } from "react";
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

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const handleResize = (e) => {
    if (isResizing) {
      const newWidth = e.clientX;

      if (newWidth > 220 && newWidth < 400) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  const handleVoltar = () => {
    if (location.pathname.includes("/materiais")) {
      navigate(`/video/${id || 1}`);
    } else {
      navigate("/home");
    }
  };

  return (
    <div
      style={{ width: sidebarWidth }}
      className="sidebar bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] text-white p-6 fixed top-0 left-0 h-full flex flex-col justify-between shadow-lg transition-none select-none"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6 relative">
        <div
          onMouseEnter={() => setMostrarTooltip(true)}
          onMouseLeave={() => setMostrarTooltip(false)}
        >
          <button
            onClick={handleVoltar}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#ffffff22] transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {mostrarTooltip && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-yellow-400 text-white text-xs px-2 py-1 rounded-md shadow-md animate-fade-in select-none whitespace-nowrap">
              {location.pathname.includes("/materiais")
                ? "Voltar ao vídeo"
                : "Voltar à Home"}
            </div>
          )}
        </div>

        <h2 className="text-lg font-bold uppercase tracking-wide select-none">
          MÓDULOS
        </h2>
      </div>

      {/* Lista de módulos ou vídeos */}
      <ul
        className="flex-2 overflow-y-auto pr-1 space-y-6 text-sm custom-scrollbar"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {modulos.length > 0 ? (
          modulos.map((mod) => (
            <li key={mod.id}>
              <div
                className="flex justify-between items-center cursor-pointer font-semibold hover:text-yellow-200"
                onClick={() =>
                  setModuloAberto(moduloAberto === mod.id ? null : mod.id)
                }
              >
                <span className="truncate">{mod.titulo}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 transform transition-transform ${
                    moduloAberto === mod.id ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {moduloAberto === mod.id && (
                <ul className="pl-3 mt-2 space-y-4">
                  {mod.videos.map((v) => (
                    <li
                      key={v.id}
                      onClick={() => setSelectedVideo(v)}
                      className={`cursor-pointer flex items-center gap-3 ${
                        watchedVideos[v.id]
                          ? "text-green-300"
                          : "hover:text-yellow-200"
                      }`}
                    >
                      {/* Ícone do lado esquerdo */}
                      <div
                        className={`flex-shrink-0 ${
                          watchedVideos[v.id] ? "text-green-400" : "text-white"
                        }`}
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
                          className="lucide lucide-circle-check-icon"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>

                      <span
                        className="line-clamp-2 leading-tight flex-1"
                        title={v.titulo}
                      >
                        {v.titulo}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        ) : (
          videos.map((video) => (
            <li
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={`cursor-pointer transition flex items-center gap-3 truncate ${
                watchedVideos[video.id]
                  ? "text-green-300"
                  : "hover:text-yellow-200"
              }`}
              title={video.titulo || video.descricao}
            >
              {/* Checklist */}
              <div
                className={`flex-shrink-0 ${
                  watchedVideos[video.id] ? "text-green-400" : "text-white"
                }`}
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
                  className="lucide lucide-circle-check-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

              <span className="flex-1">
                {video.titulo || video.descricao}
              </span>
            </li>
          ))
        )}
      </ul>

      {/* Botão de material */}
      {showButton && (
        <button
          onClick={() => navigate(`/materiais/${id || 1}`)}
          className="w-full bg-white text-[#B95758] font-semibold py-2 rounded-md hover:bg-gray-100 transition shadow-sm mt-4"
        >
          Material de Apoio
        </button>
      )}

      {/* Barra de arrastar */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-white active:bg-white"
      ></div>
    </div>
  );
};

export default Sidebar;
