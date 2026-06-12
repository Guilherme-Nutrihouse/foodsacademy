import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CarouselCard from "../components/CarouselCard";
import Header from "../components/Header";
import {
  courseStartsWithPrefix,
  getCourseCollection,
  normalizeCourseText,
} from "../data/courseCollections";
import {
  asArray,
  fetchJson,
  getStoredUsername,
  withCourseIcon,
} from "../utils/app";

const Cards = () => {
  const [username] = useState(getStoredUsername);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const activeCollection = getCourseCollection(searchParams.get("collection"));

  useEffect(() => {
    fetchJson("/api/cursos")
      // Evita quebrar filtros quando a API falhar ou mudar o formato da resposta.
      .then((data) => setCursos(asArray(data).map(withCourseIcon)))
      .catch((error) => console.error("Erro ao carregar cursos:", error))
      .finally(() => setLoading(false));
  }, []);

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
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden bg-white pt-[128px] sm:pt-[132px] lg:pt-[72px]">
      <Header username={username} search={search} setSearch={setSearch} />

      <section className="flex w-full flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-center text-2xl font-semibold text-gray-800">
          {activeCollection ? activeCollection.title : "Todos os Cursos"}
        </h1>

        <div className="mt-6 grid w-full max-w-screen-xl grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cursosFiltrados.map((curso) => (
            <div key={curso.id} className="flex h-full w-full justify-center">
              <CarouselCard {...curso} title={curso.titulo} />
            </div>
          ))}

          {!cursosFiltrados.length && (
            <p className="col-span-full mt-6 text-center text-gray-500">
              {search
                ? `Nenhum curso encontrado para "${search}".`
                : activeCollection
                  ? `Nenhum curso encontrado em ${activeCollection.title}.`
                  : "Nenhum curso cadastrado no momento."}
            </p>
          )}
        </div>
      </section>
      <div className="mt-2 text-center text-sm text-gray-500">
        Mostrando {cursosFiltrados.length} de {cursosBase.length}
      </div>
    </main>
  );
};

export default Cards;
