import React, { useEffect, useRef, useState } from "react";
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

        if (Array.isArray(data)) {
          setVideos(data);
          setTemModulos(false);
          if (data.length > 0) setSelectedVideo(data[0]);
        } else if (data.tipo === "com_modulos") {
          setModulos(data.modulos);
          setTemModulos(true);

          const primeiroModulo = data.modulos[0];
          if (primeiroModulo && primeiroModulo.videos?.length > 0) {
            setSelectedVideo(primeiroModulo.videos[0]);
          }
        } else if (data.tipo === "sem_modulos") {
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

  const sidebarProps = {
    modulos: temModulos ? modulos : [],
    videos: temModulos ? [] : videos,
    setSelectedVideo,
    watchedVideos,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar {...sidebarProps} />
        <main className="flex min-h-screen w-full items-center justify-center px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
          <h1 className="text-center text-xl font-semibold text-gray-700 sm:text-2xl">
            Carregando vídeo...
          </h1>
        </main>
      </div>
    );
  }

  if (!temModulos && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex min-h-screen w-full items-center justify-center px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
          <h1 className="text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            Nenhum vídeo encontrado para este curso
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar {...sidebarProps} />

      <main className="flex min-h-screen w-full flex-col items-center px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
        <h1 className="mb-5 max-w-5xl break-words text-center text-xl font-bold text-gray-800 sm:text-2xl md:mb-6 md:text-3xl">
          {selectedVideo ? selectedVideo.titulo : "Carregando vídeo..."}
        </h1>

        <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl sm:rounded-xl">
          {selectedVideo && (
            <video
              ref={videoRef}
              key={selectedVideo.url}
              className="h-full w-full object-contain"
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              onEnded={handleVideoEnded}
            >
              <source src={selectedVideo.url} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
          )}
        </div>
      </main>
    </div>
  );
};

export default VideoPage;
