import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SquarePen, Upload, X } from "lucide-react";
import CarouselCard from "../components/CarouselCard";
import Header from "../components/Header";
import Input from "../components/Input";
import backgroundImage from "../assets/background_teknisa_page.png";
import { useUsuario } from "../contexts/UsuarioContext";
import {
  courseStartsWithPrefix,
  getCourseCollection,
  normalizeCourseText,
} from "../data/courseCollections";
import {
  asArray,
  fetchJson,
  withCourseIcon,
} from "../utils/app";

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

const Cards = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseIconFile, setEditCourseIconFile] = useState(null);
  const [editCourseError, setEditCourseError] = useState("");
  const [editCourseSuccess, setEditCourseSuccess] = useState("");
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const editCourseFileInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { usuario, isAdmin } = useUsuario();
  const canManageCourses = isAdmin === true || String(usuario?.isAdmin).toLowerCase() === "true";

  const activeCollection = getCourseCollection(searchParams.get("collection"));

  useEffect(() => {
    fetchJson("/api/cursos")
      .then((data) => setCursos(asArray(data).map(withCourseIcon)))
      .catch((error) => console.error("Erro ao carregar cursos:", error))
      .finally(() => setLoading(false));
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
    if (!canManageCourses) return;

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

  const q = normalizeCourseText(search.trim());

  const cursosBase = activeCollection
    ? cursos.filter((curso) =>
        courseStartsWithPrefix(curso, activeCollection.prefix),
      )
    : cursos;
  const cursosFiltrados = q
    ? cursosBase.filter((curso) =>
        normalizeCourseText(curso.titulo || "").includes(q),
      )
    : cursosBase;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <h1 className="text-center text-xl font-semibold text-gray-700 sm:text-2xl">
          Carregando cursos...
        </h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden bg-[#FFFFFF] pt-[128px] font-sans sm:pt-[132px] lg:pt-[72px]">
      <Header search={search} setSearch={setSearch} onCourseCreated={upsertCourse} />

      <section
        className="relative flex w-full flex-1 flex-col items-center px-4 py-8 sm:px-6 lg:px-8"

        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 35%",
          backgroundColor: "white"
        }}
      >
        <h1 className="text-center text-2xl font-semibold text-gray-800">
          {activeCollection ? activeCollection.title : "Todos os Cursos"}
        </h1>

        {canManageCourses && editingCourse && (
          <section className="mt-5 w-full max-w-screen-xl rounded-md border border-black/10 border-l-4 border-l-[#B95758] bg-white/95 p-4 shadow-sm backdrop-blur">
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
                    onChange={(e) => {
                      setEditCourseTitle(e.target.value);
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

            {(editCourseError || editCourseSuccess) && (
              <p
                className={`mt-3 text-sm font-semibold ${editCourseSuccess ? "text-green-700" : "text-[#B95758]"}`}
              >
                {editCourseSuccess || editCourseError}
              </p>
            )}
          </section>
        )}

        {!editingCourse && editCourseSuccess && (
          <p className="mt-4 text-sm font-semibold text-green-700">
            {editCourseSuccess}
          </p>
        )}

        <div className="mt-6 flex w-full max-w-screen-xl flex-wrap justify-center gap-5">
          {cursosFiltrados.map((curso) => (
            <div key={curso.id} className="relative w-80">
              <CarouselCard {...curso} title={curso.titulo} />

              {canManageCourses && (
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
          ))}

          {!cursosFiltrados.length && (
            <p className="mt-6 w-full text-center text-gray-500">
              {search
                ? `Nenhum curso encontrado para "${search}".`
                : activeCollection
                  ? `Nenhum curso encontrado em ${activeCollection.title}.`
                  : "Nenhum curso cadastrado no momento."}
            </p>
          )}
        </div>

        <div className="mt-2 text-center text-sm text-gray-500">
          Mostrando {cursosFiltrados.length} de {cursosBase.length}
        </div>
      </section>
    </main>
  );
};

export default Cards;
