import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import backgroundImage from "../assets/images/background_teknisa_page.png";
import CarouselCard from "../components/CarouselCard";
import Chatbot from "../components/Chatbot";
import Header from "../components/Header";
import Icon from "../components/Icon";
import {
  COURSE_COLLECTIONS,
  courseStartsWithPrefix,
  normalizeCourseText,
} from "../data/courseCollections";
import { asArray, fetchJson, getStoredUsername } from "../utils/app";

const PAGE_SIZE = 6;

const Home = () => {
  const [username] = useState(getStoredUsername);
  const [page, setPage] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchJson("/api/cursos")
      // Mantem a Home renderizada mesmo quando a API nao devolver uma lista.
      .then((data) => setCursos(asArray(data)))
      .catch((err) => console.error("Erro ao carregar cursos:", err));
  }, []);

  const cards = useMemo(() => {
    // Agrupa cursos por prefixo para exibir filtros como cards de colecao.
    const collectionCards = COURSE_COLLECTIONS.map((collection) => {
      const cursosColecao = cursos.filter((curso) =>
        courseStartsWithPrefix(curso, collection.prefix)
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

    // Oculta cursos das colecoes na lista principal para manter o mesmo fluxo da Teknisa.
    const cursosSemColecao = cursos.filter(
      (curso) =>
        !COURSE_COLLECTIONS.some((collection) =>
          courseStartsWithPrefix(curso, collection.prefix)
        )
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
          normalizeCourseText(curso.searchText || curso.titulo || "").includes(q)
        )
      : cards;
  }, [cards, search]);

  const total = Math.ceil(cursosFiltrados.length / PAGE_SIZE);
  const current = cursosFiltrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => setPage(0), [search]);

  useEffect(() => {
    if (page >= total) setPage(Math.max(total - 1, 0));
  }, [page, total]);

  const goPage = (step) => {
    if (total > 1) setPage((value) => (value + step + total) % total);
  };

  // Usa a rota da colecao selecionada quando o card for um filtro.
  const openCurso = (curso) =>
    navigate(
      curso.type === "collection" ? curso.collection.route : `/video/${curso.id}`
    );

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF9F7] pt-[128px] font-sans sm:pt-[132px] lg:pt-[72px]">
      <Header username={username} search={search} setSearch={setSearch} />

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

          <div className="relative mt-1 flex w-full items-center justify-center">
            <button
              onClick={() => goPage(-1)}
              disabled={total <= 1}
              className="mx-2 hidden h-12 w-12 items-center justify-center rounded-full bg-white/40 transition hover:bg-white disabled:opacity-40 md:flex"
              aria-label="Página anterior"
            >
              <Icon name="left" className="h-6 w-6 text-black" />
            </button>

            <div className="grid w-full max-w-sm grid-cols-1 justify-items-center gap-4 sm:max-w-2xl sm:grid-cols-2 md:max-w-4xl md:grid-cols-3 md:gap-6">
              {current.map((curso) => (
                <div key={curso.id} className="flex w-full justify-center">
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
              aria-label="Próxima página"
            >
              <Icon name="right" className="h-6 w-6 text-black" />
            </button>
          </div>

          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4 md:hidden">
              {[
                ["Página anterior", -1, "left"],
                ["Próxima página", 1, "right"],
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
                    aria-label={`Ir para página ${i + 1}`}
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
