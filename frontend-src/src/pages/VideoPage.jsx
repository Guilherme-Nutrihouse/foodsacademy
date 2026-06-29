import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { fetchJson } from "../utils/app";

const emptyCourse = { modulos: [], videos: [], temModulos: false };
const VIDEO_PRELOAD = "auto"; // Antecipa buffer apenas do video selecionado.

const parseCourse = (data) => {
  if (Array.isArray(data)) return { ...emptyCourse, videos: data };
  if (data.tipo === "com_modulos") {
    return { ...emptyCourse, modulos: data.modulos, temModulos: true };
  }
  if (data.tipo === "sem_modulos")
    return { ...emptyCourse, videos: data.videos };
  console.error("Resposta inesperada da API:", data);
  return emptyCourse;
};

const VideoPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(emptyCourse);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState(() => {
    const stored = localStorage.getItem("watchedVideos");
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    setLoading(true);
    fetchJson(`/api/videos/${id}`)
      .then((data) => {
        const nextCourse = parseCourse(data);
        setCourse(nextCourse);
        setSelectedVideo(
          nextCourse.modulos[0]?.videos?.[0] || nextCourse.videos[0] || null,
        );
      })
      .catch((err) => console.error("Erro ao carregar vídeos:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVideoEnded = () => {
    if (!selectedVideo) return;

    setWatchedVideos((prev) => {
      const next = { ...prev, [selectedVideo.id]: true };
      localStorage.setItem("watchedVideos", JSON.stringify(next));
      return next;
    });
  };

  const sidebarProps = {
    modulos: course.temModulos ? course.modulos : [],
    videos: course.temModulos ? [] : course.videos,
    setSelectedVideo,
    watchedVideos,
  };

  const Page = ({ children, sidebar = sidebarProps }) => (
    <div className="min-h-screen bg-gray-50">
      <Sidebar {...sidebar} />
      <main className="flex min-h-screen w-full flex-col items-center px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
        {children}
      </main>
    </div>
  );

  if (loading || (!course.temModulos && !course.videos.length)) {
    return (
      <Page sidebar={loading ? sidebarProps : {}}>
        <h1 className="m-auto text-center text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">
          {loading
            ? "Carregando vídeo..."
            : "Nenhum vídeo encontrado para este curso"}
        </h1>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="mb-5 max-w-5xl break-words text-center text-xl font-bold text-gray-800 sm:text-2xl md:mb-6 md:text-3xl">
        {selectedVideo ? selectedVideo.titulo : "Carregando vídeo..."}
      </h1>

      <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl sm:rounded-xl">
        {selectedVideo && (
          /* Evita recarregamento manual duplicado; a key ja troca a midia do player. */
          <video
            key={selectedVideo.url}
            className="h-full w-full object-contain"
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onEnded={handleVideoEnded}
            playsInline
            preload={VIDEO_PRELOAD}
          >
            <source src={selectedVideo.url} type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
        )}
      </div>
    </Page>
  );
};

export default VideoPage;
