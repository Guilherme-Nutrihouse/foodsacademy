import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { fetchJson, getStoredUsername } from "../utils/app";

const emptyCourse = { modulos: [], videos: [], temModulos: false };
const VIDEO_PRELOAD = "auto";

const WATCHED_VIDEOS_STORAGE_PREFIX = "watchedVideos";

const getWatchedVideosStorageKey = (courseId) => {
  let username = "Usuario";

  try {

    username = getStoredUsername();
  } catch {
    username = "Usuario";
  }

  return `${WATCHED_VIDEOS_STORAGE_PREFIX}:${String(username || "Usuario")
    .trim()
    .toLowerCase()}:${String(courseId || "curso").trim().toLowerCase()}`;
};

const readStoredWatchedVideos = (courseId) => {
  try {

    const stored = localStorage.getItem(getWatchedVideosStorageKey(courseId));

    const data = stored ? JSON.parse(stored) : {};

    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
};

const saveStoredWatchedVideos = (courseId, watchedVideos) => {
  try {

    localStorage.setItem(
      getWatchedVideosStorageKey(courseId),
      JSON.stringify(watchedVideos),
    );
  } catch {
    return;
  }
};

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

const withPlayableVideoUrl = (video) => {
  if (!video?.url || video.url.startsWith("http") || video.url.startsWith("/videos_cursos/")) {
    return video;
  }

  // O POST retorna a URL do banco; a tela precisa da rota publica dos arquivos estaticos.
  return {
    ...video,
    url: `/videos_cursos${video.url.startsWith("/") ? "" : "/"}${video.url}`,
  };
};
const VideoPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(emptyCourse);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState(() =>
    readStoredWatchedVideos(id),
  );

  useEffect(() => {

    setWatchedVideos(readStoredWatchedVideos(id));
  }, [id]);

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

      saveStoredWatchedVideos(id, next);
      return next;
    });
  };


  const handleModuloCreated = (moduloCriado) => {
    if (!moduloCriado) return;

    const moduloComVideos = {
      ...moduloCriado,
      videos: Array.isArray(moduloCriado.videos) ? moduloCriado.videos : [],
    };

    setCourse((prev) => {
      const modulosAtuais = Array.isArray(prev.modulos) ? prev.modulos : [];
      const jaExiste = modulosAtuais.some(
        (modulo) => String(modulo.id) === String(moduloComVideos.id),
      );

      if (jaExiste) return prev;

      return {
        ...prev,
        temModulos: true,
        modulos: [...modulosAtuais, moduloComVideos].sort(
          (a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0),
        ),
      };
    });
  };

  const handleModuloUpdated = (moduloAtualizado) => {
    if (!moduloAtualizado) return;

    setCourse((prev) => ({
      ...prev,
      modulos: (prev.modulos || []).map((modulo) =>
        String(modulo.id) === String(moduloAtualizado.id)
          ? { ...modulo, ...moduloAtualizado, videos: modulo.videos || [] }
          : modulo,
      ),
    }));
  };

  const handleVideoCreated = ({ idModulo, video }) => {
    if (!video) return;

    const videoCriado = withPlayableVideoUrl(video);

    setCourse((prev) => ({
      ...prev,
      modulos: (prev.modulos || []).map((modulo) =>
        String(modulo.id) === String(idModulo)
          ? { ...modulo, videos: [...(modulo.videos || []), videoCriado] }
          : modulo,
      ),
    }));
    setSelectedVideo(videoCriado);
  };

  const handleVideoUpdated = (videoAtualizado) => {
    if (!videoAtualizado) return;

    const nextVideo = withPlayableVideoUrl(videoAtualizado);
    const videoId = String(nextVideo.id);
    const replaceVideo = (video) =>
      String(video.id) === videoId ? { ...video, ...nextVideo } : video;

    setCourse((prev) => ({
      ...prev,
      videos: (prev.videos || []).map(replaceVideo),
      modulos: (prev.modulos || []).map((modulo) => ({
        ...modulo,
        videos: (modulo.videos || []).map(replaceVideo),
      })),
    }));

    setSelectedVideo((prev) =>
      prev && String(prev.id) === videoId ? { ...prev, ...nextVideo } : prev,
    );
  };

  const sidebarProps = {
    modulos: course.temModulos ? course.modulos : [],
    videos: course.temModulos ? [] : course.videos,
    setSelectedVideo,
    watchedVideos,
    onModuloCreated: handleModuloCreated,
    onModuloUpdated: handleModuloUpdated,
    onVideoCreated: handleVideoCreated,
    onVideoUpdated: handleVideoUpdated,
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
