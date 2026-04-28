import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const VideoPage = () => {
  const { id } = useParams();
  const [videos, setVideos] = useState([]);
  const [modulos, setModulos] = useState([]); 
  const [temModulos, setTemModulos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState(() => {
    const stored = localStorage.getItem("watchedVideos");
    return stored ? JSON.parse(stored) : {};
  });
  const videoRef = useRef(null);

  useEffect(() => {
    async function carregarVideos() {
      try {
        const res = await fetch(`/api/videos/${id}`);
        const data = await res.json();

        // 🔹 Detecta o tipo de retorno
        if (Array.isArray(data)) {
          // curso sem módulos
          setVideos(data);
          setTemModulos(false);
          if (data.length > 0) setSelectedVideo(data[0]);
        } else if (data.tipo === "com_modulos") {
          // curso com módulos
          setModulos(data.modulos);
          setTemModulos(true);

          // seleciona o primeiro vídeo do primeiro módulo
          const primeiroModulo = data.modulos[0];
          if (primeiroModulo && primeiroModulo.videos?.length > 0) {
            setSelectedVideo(primeiroModulo.videos[0]);
          }
        } else if (data.tipo === "sem_modulos") {
          // curso sem módulos, mas com novo formato
          setVideos(data.videos);
          setTemModulos(false);
          if (data.videos.length > 0) setSelectedVideo(data.videos[0]);
        } else {
          console.error("Resposta inesperada da API:", data);
        }
      } catch (err) {
        console.error("Erro ao carregar vídeos:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarVideos();
  }, [id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [selectedVideo]);

  const handleVideoEnded = () => {
    if (selectedVideo) {
      const updated = { ...watchedVideos, [selectedVideo.id]: true };
      setWatchedVideos(updated);
      localStorage.setItem("watchedVideos", JSON.stringify(updated));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          modulos={temModulos ? modulos : []}
          videos={temModulos ? [] : videos}
          setSelectedVideo={setSelectedVideo}
          watchedVideos={watchedVideos}
        />
        <div className="flex-1 ml-72 p-8 flex items-center justify-center">
          <h1 className="text-2xl font-semibold text-gray-700">
            Carregando vídeo...
          </h1>
        </div>
      </div>
    );
  }

  if (!temModulos && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 ml-72 p-8 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Nenhum vídeo encontrado para este curso
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar dinâmica */}
      <Sidebar
        modulos={temModulos ? modulos : []}
        videos={temModulos ? [] : videos}
        setSelectedVideo={setSelectedVideo}
        watchedVideos={watchedVideos}
      />

      {/* Player principal */}
      <div className="flex-1 ml-72 p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {selectedVideo ? selectedVideo.titulo : "Carregando vídeo..."}
        </h1>

        <div className="w-[80%] max-w-5xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden mb-6">
          {selectedVideo && (
            <video
              ref={videoRef}
              key={selectedVideo.url}
              className="w-full h-full object-contain"
              controls
              onEnded={handleVideoEnded}
            >
              <source src={selectedVideo.url} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
