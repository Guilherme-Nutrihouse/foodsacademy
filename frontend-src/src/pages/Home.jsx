import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SquarePen, Upload, X } from "lucide-react";
import backgroundImage from "../assets/background_teknisa_page.png";
import CarouselCard from "../components/CarouselCard";
import Chatbot from "../components/Chatbot";
import Header from "../components/Header";
import Icon from "../components/Icon";
import Input from "../components/Input";
import { useUsuario } from "../contexts/UsuarioContext";
import {
  COURSE_COLLECTIONS,
  courseStartsWithPrefix,
  normalizeCourseText,
} from "../data/courseCollections";
import { asArray, fetchJson, withCourseIcon } from "../utils/app";

const PAGE_SIZE = 6;
const allowedPngTypes = ["image/png", "application/png", "application/octet-stream", ""];

const isValidPngFile = (file) => {
  if (!file) return true;

  const fileName = String(file.name || "").toLowerCase();
  return fileName.endsWith(".png") && allowedPngTypes.includes(file.type || "");
};

const updateCourseRequest = (idCurso, formData) =>
  fetchJson(`/api/cursos/${encodeURIComponent(String(idCurso))}`, {
    method: "PUT",
    body: formData,
  });

const Home = () => {
  const [page, setPage] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseIconFile, setEditCourseIconFile] = useState(null);
  const [editCourseError, setEditCourseError] = useState("");
  const [editCourseSuccess, setEditCourseSuccess] = useState("");
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const editCourseFileInputRef = useRef(null);
  const navigate = useNavigate();
  const { usuario, isAdmin } = useUsuario();
  const canManageCourses = isAdmin === true || String(usuario?.isAdmin).toLowerCase() === "true";

  useEffect(() => {
    fetchJson("/api/cursos")
      .then((data) => setCursos(asArray(data).map(withCourseIcon)))
      .catch((err) => console.error("Erro ao carregar cursos:", err));
  }, []);

  const resetCourseEdit = () => {
    setEditingCourse(null);
    setEditCourseTitle("");
    setEditCourseIconFile(null);
    setEditCourseError("");
    if (editCourseFileInputRef.current) editCourseFileInputRef.current.value = "";
  };

  const upsertCourse = (curso) => {
    if (!curso) return;

    const nextCourse = withCourseIcon(curso);

    setCursos((prev) => {
      const courseId = String(nextCourse.id);
      const exists = prev.some((item) => String(item.id) === courseId);

      return exists
        ? prev.map((item) => (String(item.id) === courseId ? nextCourse : item))
        : [...prev, nextCourse];
    });
  };

  const startCourseEdit = (curso) => {
    if (!canManageCourses || curso.type !== "course") return;

    setEditingCourse(curso);
    setEditCourseTitle(curso.titulo || "");
    setEditCourseIconFile(null);
    setEditCourseError("");
    setEditCourseSuccess("");
    if (editCourseFileInputRef.current) editCourseFileInputRef.current.value = "";
  };

  const handleCourseEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingCourse) return;

    const titulo = editCourseTitle.trim();

    if (!titulo) {
      setEditCourseError("Nome do curso e obrigatorio.");
      return;
    }

    if (!isValidPngFile(editCourseIconFile)) {
      setEditCourseError("Envie um arquivo PNG valido.");
      return;
    }

    const formData = new FormData();
    // Usa FormData porque o icone PNG e opcional no mesmo endpoint de edicao.
    formData.append("titulo", titulo);
    if (editCourseIconFile) formData.append("png", editCourseIconFile, editCourseIconFile.name);

    try {
      setUpdatingCourse(true);
      setEditCourseError("");
      setEditCourseSuccess("");

      const data = await updateCourseRequest(editingCourse.id, formData);

      if (data.curso) upsertCourse(data.curso);
      setEditCourseSuccess(data.message || "Curso atualizado com sucesso.");
      resetCourseEdit();
    } catch (error) {
      console.error("Erro ao atualizar curso:", error);
      setEditCourseError(error.message || "Nao foi possivel atualizar o curso.");
    } finally {
      setUpdatingCourse(false);
    }
  };

  const cards = useMemo(() => {

    const collectionCards = COURSE_COLLECTIONS.map((collection) => {
      const cursosColecao = cursos.filter((curso) =>
        courseStartsWithPrefix(curso, collection.prefix),
      );

      return {
        id: `collection-${collection.id}`,
        titulo: collection.title,
        icon_url: collection.iconUrl,
        searchText: [
          collection.title,
          collection.prefix,
          ...cursosColecao.map((curso) => curso.titulo),
        ].join(" "),
        type: "collection",
        collection,
      };
    });

    const cursosSemColecao = cursos.filter(
      (curso) =>
        !COURSE_COLLECTIONS.some((collection) =>
          courseStartsWithPrefix(curso, collection.prefix),
        ),
    );

    return [
      ...collectionCards,
      ...cursosSemColecao.map((curso) => ({ ...curso, type: "course" })),
    ];
  }, [cursos]);

  const cursosFiltrados = useMemo(() => {
    const q = normalizeCourseText(search.trim());
    return q
      ? cards.filter((curso) =>
          normalizeCourseText(curso.searchText || curso.titulo || "").includes(
            q,
          ),
        )
      : cards;
  }, [cards, search]);

  const total = Math.ceil(cursosFiltrados.length / PAGE_SIZE);
  const current = cursosFiltrados.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => setPage(0), [search]);

  useEffect(() => {
    if (page >= total) setPage(Math.max(total - 1, 0));
  }, [page, total]);

  const goPage = (step) => {
    if (total > 1) setPage((value) => (value + step + total) % total);
  };

  const openCurso = (curso) =>
    navigate(
      curso.type === "collection"
        ? curso.collection.route
        : `/video/${curso.id}`,
    );

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[#FFFFFF] pt-[128px] font-sans sm:pt-[132px] lg:pt-[72px]">
      <Header search={search} setSearch={setSearch} onCourseCreated={upsertCourse} />

      <section
        className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 35%",
        }}
      >
        <div className="flex h-full w-full max-w-[1150px] flex-col px-4 sm:px-6 lg:px-8">
          <Outlet />

          {canManageCourses && editingCourse && (
            <section className="mb-4 w-full rounded-md border border-black/10 border-l-4 border-l-[#B95758] bg-white/95 p-4 shadow-sm backdrop-blur">
              <form
                className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)_auto_auto] lg:items-end"
                onSubmit={handleCourseEditSubmit}
              >
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-[#000000]">
                  Nome
                  <span className="rounded-md border border-black/10 bg-white shadow-sm">
                    <Input
                      name="nome"
                      placeholder="Nome do curso"
                      value={editCourseTitle}
                      onChange={(event) => {
                        setEditCourseTitle(event.target.value);
                        setEditCourseError("");
                      }}
                    />
                  </span>
                </label>

                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700">
                  Icone PNG
                  <input
                    ref={editCourseFileInputRef}
                    type="file"
                    accept="image/png,.png"
                    onChange={(event) => {
                      setEditCourseIconFile(event.target.files?.[0] || null);
                      setEditCourseError("");
                      setEditCourseSuccess("");
                    }}
                    className="min-h-10 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[#F0F0E9] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#B95758] focus:border-[#B95758] focus:ring-2 focus:ring-[#B95758]/20"
                  />
                </label>

                <button
                  type="submit"
                  disabled={updatingCourse}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#B95758] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#9f3f40] disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {updatingCourse ? "Atualizando..." : "Atualizar"}
                </button>

                <button
                  type="button"
                  onClick={resetCourseEdit}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#6f625d] shadow-sm transition hover:bg-[#F0F0E9] lg:w-auto"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancelar
                </button>
              </form>

              {editCourseError && (
                <p className="mt-3 text-sm font-semibold text-[#B95758]">
                  {editCourseError}
                </p>
              )}
            </section>
          )}

          {!editingCourse && editCourseSuccess && (
            <p className="mb-4 text-center text-sm font-semibold text-green-700">
              {editCourseSuccess}
            </p>
          )}

          <div className="relative mt-1 flex w-full items-center justify-center">
            <button
              onClick={() => goPage(-1)}
              disabled={total <= 1}
              className="mx-2 hidden h-12 w-12 items-center justify-center rounded-full bg-white/40 transition hover:bg-white disabled:opacity-40 md:flex"
              aria-label="Pagina anterior"
            >
              <Icon name="left" className="h-6 w-6 text-black" />
            </button>

            {/* Mantem espaco real para 3 cards de 20rem sem eles estourarem as colunas. */}
            <div className="grid w-full max-w-sm grid-cols-1 justify-items-center gap-5 sm:max-w-2xl sm:grid-cols-2 sm:gap-6 md:max-w-[68rem] md:grid-cols-3 md:gap-8">
              {current.map((curso) => (
                <div key={curso.id} className="flex w-full justify-center">
                  <div className="relative w-full max-w-80">
                    <CarouselCard
                      id={curso.id}
                      title={curso.titulo}
                      icon_url={curso.icon_url}
                      onClick={() => openCurso(curso)}
                      className={
                        curso.type === "collection"
                          ? "bg-[linear-gradient(135deg,_#263238,_#e14d3a)]"
                          : ""
                      }
                    />

                    {canManageCourses && curso.type === "course" && (
                      <button
                        type="button"
                        onClick={() => startCourseEdit(curso)}
                        aria-label={`Editar curso ${curso.titulo}`}
                        title="Editar curso"
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md border border-white/40 bg-white/95 text-[#B95758] shadow-sm transition hover:bg-[#F0F0E9] hover:text-[#9f3f40]"
                      >
                        <SquarePen className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!cursosFiltrados.length && (
                <p className="col-span-full rounded-lg bg-white/80 px-4 py-3 text-center text-gray-600 shadow-sm">
                  {search
                    ? `Nenhum curso encontrado para "${search}".`
                    : "Nenhum curso cadastrado no momento."}
                </p>
              )}
            </div>

            <button
              onClick={() => goPage(1)}
              disabled={total <= 1}
              className="mx-2 hidden h-12 w-12 items-center justify-center rounded-full bg-white/40 transition hover:bg-white disabled:opacity-40 md:flex"
              aria-label="Proxima pagina"
            >
              <Icon name="right" className="h-6 w-6 text-black" />
            </button>
          </div>

          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4 md:hidden">
              {[
                ["Pagina anterior", -1, "left"],
                ["Proxima pagina", 1, "right"],
              ].map(([label, step, icon]) => (
                <button
                  key={label}
                  onClick={() => goPage(step)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                  aria-label={label}
                >
                  <Icon name={icon} className="h-6 w-6 text-black" />
                </button>
              ))}
            </div>
          )}

          {total > 0 && (
            <div className="flex min-h-[88px] w-full items-center justify-center py-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: total }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`Ir para pagina ${i + 1}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-md text-center font-medium ${
                      page === i
                        ? "bg-yellow-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Chatbot />
    </main>
  );
};

export default Home;