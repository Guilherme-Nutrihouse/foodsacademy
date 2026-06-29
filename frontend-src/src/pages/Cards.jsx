import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CarouselCard from "../components/CarouselCard";
import Header from "../components/Header";
import backgroundImage from "../assets/background_teknisa_page.png";
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
    <main className="flex min-h-screen flex-col items-center overflow-x-hidden bg-[#FAF9F7] pt-[128px] font-sans sm:pt-[132px] lg:pt-[72px]">
      <Header username={username} search={search} setSearch={setSearch} />

      <section
        className="relative flex w-full flex-1 flex-col items-center px-4 py-8 sm:px-6 lg:px-8"
        // Aplica o mesmo fundo usado na Home na area dos cards.
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 35%",
        }}
      >
        <h1 className="text-center text-2xl font-semibold text-gray-800">
          {activeCollection ? activeCollection.title : "Todos os Cursos"}
        </h1>

        {/* Centraliza poucos cards e mantem a quebra em linhas para listas maiores. */}
        <div className="mt-6 flex w-full max-w-screen-xl flex-wrap justify-center gap-5">
          {cursosFiltrados.map((curso) => (
            <CarouselCard key={curso.id} {...curso} title={curso.titulo} />
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
