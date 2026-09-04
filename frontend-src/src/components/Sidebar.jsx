import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon";
import { useUsuario } from "../contexts/UsuarioContext";
import { CertificateButton } from "./Certificate";
import { Check, CirclePlus, SquarePen, Upload, X } from "lucide-react";
import Input from "../components/Input";

const allowedMp4Types = ["video/mp4", "application/mp4", "application/octet-stream", ""];

const isValidMp4File = (file) => {
  if (!file) return true;

  const fileName = String(file.name || "").toLowerCase();
  return fileName.endsWith(".mp4") && allowedMp4Types.includes(file.type || "");
};

const Sidebar = ({
  showButton = true,
  modulos = [],
  videos = [],
  setSelectedVideo,
  watchedVideos = {},
  onModuloCreated = () => {},
  onModuloUpdated = () => {},
  onVideoCreated = () => {},
  onVideoUpdated = () => {},
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { usuario, nomeCompleto, atualizarUsuario, isAdmin } = useUsuario();
  const canManageModules = isAdmin === true || String(usuario?.isAdmin).toLowerCase() === "true";
  const [moduloAberto, setModuloAberto] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserSessionChecked, setIsUserSessionChecked] = useState(false);
  const [videosLength, setVideosLength] = useState(0);
  const [cursoNome, setCursoNome] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [nomeModulo, setNomeModulo] = useState("");
  const [editingModuloId, setEditingModuloId] = useState(null);
  const [editingModuloName, setEditingModuloName] = useState("");
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editingVideoTitle, setEditingVideoTitle] = useState("");
  const [editingVideoFile, setEditingVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingModuloId, setUpdatingModuloId] = useState(null);
  const [updatingVideoId, setUpdatingVideoId] = useState(null);
  const [uploadingVideoId, setUploadingVideoId] = useState(null);
  const videoFileInputs = useRef({});
  const editVideoFileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    setIsUserSessionChecked(false);
    fetch("/api/remember-session", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (active && data?.authenticated) {
          atualizarUsuario(data);
        }
      })
      .catch((error) => console.log(error))
      .finally(() => {
        if (active) setIsUserSessionChecked(true);
      });

    return () => {
      active = false;
    };
  }, [atualizarUsuario]);

  useEffect(() => {
    if (!id) return;

    const fetchVideosLength = async () => {
      try {
        const cursoId = encodeURIComponent(String(id));
        const response = await fetch(`/api/videos/length/${cursoId}`, {
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(
            data.error || data.message || "Nao foi possivel consultar os videos.",
          );
          return;
        }

        setVideosLength(Number(data) || 0);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchCourseName = async () => {
      try {
        const cursoId = encodeURIComponent(String(id));
        const response = await fetch(`/api/cursos/${cursoId}`, {
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(
            data.error || data.message || "Nao foi possivel localizar o curso.",
          );
          return;
        }

        const nome =
          typeof data === "string"
            ? data
            : Array.isArray(data)
              ? data[0]?.titulo
              : data?.titulo;

        setCursoNome(nome || "");
      } catch (error) {
        console.log(error);
      }
    };

    fetchVideosLength();
    fetchCourseName();
  }, [id]);

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

  const currentCourseVideos = useMemo(() => {
    if (modulos.length) {
      return modulos.flatMap((modulo) => modulo.videos || []);
    }

    return videos;
  }, [modulos, videos]);

  const watchedVideosCount = useMemo(
    () => currentCourseVideos.filter((video) => watchedVideos[video.id]).length,
    [currentCourseVideos, watchedVideos],
  );

  const getLocalApiBase = () => {

    const configuredBase =
      typeof process !== "undefined" ? process.env.REACT_APP_API_URL : "";
    if (configuredBase) return configuredBase.replace(/\/$/, "");

    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );

    return isLocalHost ? `http://${window.location.hostname}:5000` : "";
  };

  const totalVideos = Number(videosLength) || currentCourseVideos.length;

  const canDownloadCertificate =
    totalVideos > 0 && watchedVideosCount === totalVideos;

  const certificateStudentName = useMemo(() => {
    const username = String(usuario?.username || "").trim();
    const fullName = String(nomeCompleto || usuario?.nomeCompleto || "").trim();

    if (fullName && fullName.toLowerCase() !== username.toLowerCase()) {
      return fullName;
    }

    const fallbackName = username || fullName;

    return fallbackName
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }, [nomeCompleto, usuario]);

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

  const ActionError = () =>
    actionError && (
      <p className="mb-3 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#B95758] shadow-sm">
        {actionError}
      </p>
    );

  const updateModuloRequest = async (idModulo, modulo) => {
    const moduloId = encodeURIComponent(String(idModulo));
    const options = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(modulo),
    };
    const response = await fetch(`/api/modulos/${moduloId}`, options);

    if (response.status !== 404) return response;

    const localApiBase = getLocalApiBase();
    if (!localApiBase) return response;

    return fetch(`${localApiBase}/api/modulos/${moduloId}`, options);
  };

  const updateVideoRequest = async (idVideo, formData) => {
    const videoId = encodeURIComponent(String(idVideo));
    const options = {
      method: "PUT",
      credentials: "include",
      body: formData,
    };
    const response = await fetch(`/api/videos/${videoId}`, options);

    if (response.status !== 404) return response;

    const localApiBase = getLocalApiBase();
    if (!localApiBase) return response;

    return fetch(`${localApiBase}/api/videos/${videoId}`, options);
  };

  const startModuloEdit = (modulo) => {
    if (!canManageModules) return;

    setEditingModuloId(modulo.id);
    setEditingModuloName(modulo.titulo || "");
    setActionError("");
  };

  const cancelModuloEdit = () => {
    setEditingModuloId(null);
    setEditingModuloName("");
    setActionError("");
  };

  const handleModuloEditSubmit = async (event, modulo) => {
    event.preventDefault();

    const nomeLimpo = editingModuloName.trim();

    if (!nomeLimpo) {
      setActionError("Nome do modulo e obrigatorio.");
      return;
    }

    try {
      setUpdatingModuloId(modulo.id);
      setActionError("");

      const response = await updateModuloRequest(modulo.id, { titulo: nomeLimpo });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError(data.error || data.message || "Nao foi possivel atualizar o modulo.");
        return;
      }

      onModuloUpdated(data.modulo || { ...modulo, titulo: nomeLimpo, descricao: nomeLimpo });
      cancelModuloEdit();
      alert(data.message || "Modulo atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar modulo:", error);
      setActionError("Erro ao conectar ao servidor.");
    } finally {
      setUpdatingModuloId(null);
    }
  };

  const startVideoEdit = (video) => {
    if (!canManageModules) return;

    setEditingVideoId(video.id);
    setEditingVideoTitle(video.titulo || video.descricao || "");
    setEditingVideoFile(null);
    setActionError("");
    if (editVideoFileInputRef.current) editVideoFileInputRef.current.value = "";
  };

  const cancelVideoEdit = () => {
    setEditingVideoId(null);
    setEditingVideoTitle("");
    setEditingVideoFile(null);
    setActionError("");
    if (editVideoFileInputRef.current) editVideoFileInputRef.current.value = "";
  };

  const handleVideoEditSubmit = async (event, video) => {
    event.preventDefault();

    const tituloVideo = editingVideoTitle.trim();

    if (!tituloVideo) {
      setActionError("Nome do video e obrigatorio.");
      return;
    }

    if (!isValidMp4File(editingVideoFile)) {
      setActionError("Selecione um arquivo MP4.");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", tituloVideo);
    if (editingVideoFile) formData.append("mp4", editingVideoFile, editingVideoFile.name);

    try {
      setUpdatingVideoId(video.id);
      setActionError("");

      const response = await updateVideoRequest(video.id, formData);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError(data.error || data.message || "Nao foi possivel atualizar o video.");
        return;
      }

      onVideoUpdated(data.video || { ...video, titulo: tituloVideo, descricao: tituloVideo });
      cancelVideoEdit();
      alert(data.message || "Video atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar video:", error);
      setActionError("Erro ao conectar ao servidor.");
    } finally {
      setUpdatingVideoId(null);
    }
  };

  const VideoItem = ({ video }) => {
    const watched = watchedVideos[video.id];
    const isEditingVideo = String(editingVideoId) === String(video.id);
    const isUpdatingVideo = String(updatingVideoId) === String(video.id);

    if (isEditingVideo) {
      return (
        <li className="rounded-md border border-white/20 bg-white/10 p-2">
          <form className="space-y-2" onSubmit={(event) => handleVideoEditSubmit(event, video)}>
            <span className="block rounded-md border border-white/20 bg-white shadow-sm">
              <Input
                value={editingVideoTitle}
                onChange={(event) => setEditingVideoTitle(event.target.value)}
                placeholder="Nome do video"
              />
            </span>

            <input
              ref={editVideoFileInputRef}
              type="file"
              accept="video/mp4,.mp4"
              className="hidden"
              onChange={(event) => {
                setEditingVideoFile(event.target.files?.[0] || null);
                setActionError("");
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => editVideoFileInputRef.current?.click()}
                title="Trocar MP4"
                aria-label="Trocar MP4"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758]"
              >
                <Upload className="h-4 w-4" strokeWidth={2.4} />
              </button>

              <span className="min-w-0 flex-1 truncate text-xs text-white/85">
                {editingVideoFile?.name || "MP4 opcional"}
              </span>

              <button
                type="submit"
                disabled={isUpdatingVideo}
                title="Salvar video"
                aria-label="Salvar video"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#B95758] transition hover:bg-yellow-100 disabled:cursor-wait disabled:opacity-60"
              >
                <Check className="h-4 w-4" strokeWidth={2.4} />
              </button>

              <button
                type="button"
                onClick={cancelVideoEdit}
                title="Cancelar"
                aria-label="Cancelar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758]"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
          </form>
        </li>
      );
    }

    return (
      <li className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => selectVideo(video)}
          className={`flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md px-1 py-1 text-left transition ${watched ? "text-green-300" : "hover:text-yellow-200"}`}
          title={video.titulo || video.descricao}
        >
          <Icon
            name="check"
            className={`h-[18px] w-[18px] shrink-0 ${watched ? "text-green-400" : "text-white"}`}
          />
          <span className="min-w-0 flex-1 break-words leading-tight">
            {video.titulo || video.descricao}
          </span>
        </button>

        {canManageModules && (
          <button
            type="button"
            onClick={() => startVideoEdit(video)}
            aria-label={`Editar video ${video.titulo || video.descricao}`}
            title="Editar video"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758]"
          >
            <SquarePen className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        )}
      </li>
    );
  };

  const postVideoToModulo = async (idModulo, formData) => {
    const moduloId = encodeURIComponent(String(idModulo));

    const options = {
      method: "POST",
      credentials: "include",
      body: formData,
    };
    const response = await fetch(`/api/modulos/${moduloId}/videos`, options);

    if (response.status !== 404) return response;

    const localApiBase = getLocalApiBase();
    if (!localApiBase) return response;

    return fetch(`${localApiBase}/api/modulos/${moduloId}/videos`, options);
  };

  const handleVideoFileChange = async (event, modulo) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const idCurso = Number(id);
    const idModulo = Number(modulo?.id);

    if (!Number.isInteger(idCurso) || idCurso <= 0 || !Number.isInteger(idModulo) || idModulo <= 0) {
      alert("Curso ou modulo invalido para upload.");
      return;
    }

    if (!String(file.name || "").toLowerCase().endsWith(".mp4")) {
      alert("Selecione um arquivo MP4.");
      return;
    }

    const tituloVideo = String(file.name || "")
      .replace(/\.mp4$/i, "")
      .trim() || "Video";

    const formData = new FormData();
    // Envia o titulo como campo UTF-8 para evitar caracteres quebrados do originalname.
    formData.append("titulo", tituloVideo);
    formData.append("mp4", file);

    try {
      setUploadingVideoId(idModulo);

      const response = await postVideoToModulo(idModulo, formData);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || data.message || "Nao foi possivel enviar o video.");
        return;
      }

      if (data.video) onVideoCreated({ idCurso, idModulo, video: data.video });
      setVideosLength((total) => (Number(total) || 0) + 1);

      alert(data.message || "Video enviado com sucesso!");
    } catch (err) {
      console.error("Erro ao enviar video:", err);
      alert("Erro ao conectar ao servidor.");
    } finally {
      setUploadingVideoId(null);
    }
  };

  const NavigationList = () => (
    <ul className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
      {modulos.length ? (
        modulos.map((modulo) => {
          const isUploadingVideo = String(uploadingVideoId) === String(modulo.id);
          const isEditingModulo = String(editingModuloId) === String(modulo.id);
          const isUpdatingModulo = String(updatingModuloId) === String(modulo.id);

          return (
            <li key={modulo.id}>
              {isEditingModulo ? (
                <form className="flex items-center gap-2" onSubmit={(event) => handleModuloEditSubmit(event, modulo)}>
                  <span className="min-w-0 flex-1 rounded-md border border-white/20 bg-white shadow-sm">
                    <Input
                      value={editingModuloName}
                      onChange={(event) => setEditingModuloName(event.target.value)}
                      placeholder="Nome do modulo"
                    />
                  </span>

                  <button
                    type="submit"
                    disabled={isUpdatingModulo}
                    aria-label="Salvar modulo"
                    title="Salvar modulo"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#B95758] transition hover:bg-yellow-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>

                  <button
                    type="button"
                    onClick={cancelModuloEdit}
                    aria-label="Cancelar"
                    title="Cancelar"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758]"
                  >
                    <X className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModuloAberto(moduloAberto === modulo.id ? null : modulo.id)
                    }
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left font-semibold transition hover:text-yellow-200"
                  >
                    <span className="min-w-0 flex-1 truncate">{modulo.titulo}</span>
                    <Icon
                      name="right"
                      className={`h-4 w-4 shrink-0 transition-transform ${moduloAberto === modulo.id ? "rotate-90" : ""}`}
                    />
                  </button>

                  {canManageModules && (
                    <>
                      <button
                        type="button"
                        onClick={() => startModuloEdit(modulo)}
                        aria-label={`Editar modulo ${modulo.titulo}`}
                        title="Editar modulo"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758]"
                      >
                        <SquarePen className="h-4 w-4" strokeWidth={2.4} />
                      </button>

                      <input
                        ref={(input) => {
                          if (input) videoFileInputs.current[modulo.id] = input;
                          else delete videoFileInputs.current[modulo.id];
                        }}
                        type="file"
                        accept="video/mp4,.mp4"
                        className="hidden"
                        onChange={(event) => handleVideoFileChange(event, modulo)}
                      />
                      <button
                        type="button"
                        disabled={isUploadingVideo}
                        onClick={() => videoFileInputs.current[modulo.id]?.click()}
                        aria-label={`Enviar video para ${modulo.titulo}`}
                        title="Enviar video"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-[#B95758] disabled:cursor-wait disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {moduloAberto === modulo.id && (
                <ul className="mt-3 space-y-3 pl-3">
                  {(modulo.videos || []).map((video) => (
                    <VideoItem key={video.id} video={video} />
                  ))}
                </ul>
              )}
            </li>
          );
        })
      ) : videos.length ? (
        videos.map((video) => <VideoItem key={video.id} video={video} />)
      ) : (
        <li className="text-white/80">Nenhum item disponivel.</li>
      )}
    </ul>
  );

  const createModulo = async (titulo) => {

    const idCurso = encodeURIComponent(String(id));

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ titulo }),
    };
    const response = await fetch(`/api/modulos/${idCurso}`, options);

    if (response.status !== 404) return response;

    const localApiBase = getLocalApiBase();
    if (!localApiBase) return response;

    return fetch(`${localApiBase}/api/modulos/${idCurso}`, options);
  };

  async function onSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nomeLimpo = String(formData.get("nome") ?? "").trim();

    if (!nomeLimpo) {
      setError("Nome do modulo e obrigatorio.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createModulo(nomeLimpo);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error || data.message || "Nao foi possivel realizar o cadastro do modulo.",
        );
        return;
      }

      if (data.modulo) onModuloCreated(data.modulo);

      setNomeModulo("");
      setShowInput(false);

      alert(data.message || "Modulo adicionado com sucesso!");
    } catch (err) {
      console.error("Erro ao cadastrar modulo:", err);
      setError("Erro ao conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <aside
        style={{ width: sidebarWidth }}
        className="sidebar fixed left-0 top-0 hidden h-full select-none flex-col justify-between bg-[linear-gradient(135deg,_#B95758,_#e14d3a)] p-6 text-white shadow-lg md:flex"
      >
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
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
                  ? "Voltar ao video"
                  : "Voltar a Pagina Anterior"}
              </div>
            </div>

            <h2 className="min-w-0 flex-1 text-lg font-bold uppercase tracking-wide">MODULOS</h2>
            {canManageModules && (
              <button
                type="button"
                onClick={() => setShowInput((prev) => !prev)}
                aria-label="Adicionar modulo"
                title="Adicionar modulo"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white shadow-sm transition hover:bg-white hover:text-[#B95758] ${showInput ? "bg-white text-[#B95758]" : "bg-white/10"}`}
              >
                <CirclePlus className="h-5 w-5" strokeWidth={2.4} />
              </button>
            )}
          </div>

          {showInput && (
            <section className="rounded-md border border-white/25 bg-white/95 p-3 text-[#332f2d] shadow-sm">
              <form className="space-y-3" onSubmit={onSubmit}>
                <label className="block text-sm font-semibold text-[#6d625e]">
                  Nome
                  <span className="mt-1 block">
                    <Input
                      name="nome"
                      placeholder="Nome do modulo"
                      value={nomeModulo}
                      onChange={(e) => setNomeModulo(e.target.value)}
                    />
                  </span>
                </label>

                {error && (
                  <p className="text-xs font-semibold text-[#B95758]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-10 w-full items-center justify-center rounded-md bg-[#B95758] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f3f40] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Criando..." : "Criar modulo"}
                </button>
              </form>
            </section>
          )}
        </div>

        <ActionError />
        <NavigationList />
        {canDownloadCertificate && isUserSessionChecked && (
          <CertificateButton
            studentName={certificateStudentName}
            courseName={cursoNome}
          />
        )}
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
            MODULOS
          </h2>

          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition hover:bg-white/15"
            aria-label="Abrir modulos"
            aria-expanded={isMobileOpen}
          >
            <Icon name={isMobileOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>

        {isMobileOpen && (
          <div className="border-t border-white/20 px-4 pb-4">
            <div className="custom-scrollbar max-h-[calc(100vh-5rem)] overflow-y-auto pt-4">
              <ActionError />
              <NavigationList />

              {canDownloadCertificate && isUserSessionChecked && (
                <CertificateButton
                  studentName={certificateStudentName}
                  courseName={cursoNome}
                  className="mt-5"
                />
              )}
              <MaterialButton className="mt-5" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
