import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import CarouselCard from "../components/CarouselCard";
import Header from "../components/Header";
import Chatbot from "../components/Chatbot";
import backgroundImage from "../assets/images/background_teknisa_page.png";
import {
  TEKNISA_COLLECTION,
  courseStartsWithPrefix,
  normalizeCourseText,
} from "../data/courseCollections";

const PAGE_SIZE = 6;

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const Home = () => {
  const [username, setUsername] = useState("Usuário");
  const [page, setPage] = useState(0);
  const [cursos, setCursos] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored && stored !== "undefined") setUsername(stored);
  }, []);

  useEffect(() => {
    fetch("/api/cursos")
      .then((res) => res.json())
      .then((data) => {
        setCursos(data);
      })
      .catch((err) => console.error("Erro ao carregar cursos:", err));
  }, []);

  const cards = useMemo(() => {
    const cursosTeknisa = cursos.filter((curso) =>
      courseStartsWithPrefix(curso, TEKNISA_COLLECTION.prefix)
    );
    const cursosSemTeknisa = cursos.filter(
      (curso) => !courseStartsWithPrefix(curso, TEKNISA_COLLECTION.prefix)
    );

    return [
      {
        id: `collection-${TEKNISA_COLLECTION.id}`,
        titulo: TEKNISA_COLLECTION.title,
        icon_url: TEKNISA_COLLECTION.iconUrl,
        searchText: [
          TEKNISA_COLLECTION.title,
          TEKNISA_COLLECTION.prefix,
          ...cursosTeknisa.map((curso) => curso.titulo),
        ].join(" "),
        type: "collection",
      },
      ...cursosSemTeknisa.map((curso) => ({ ...curso, type: "course" })),
    ];
  }, [cursos]);

  const cursosFiltrados = useMemo(() => {
    const q = normalizeCourseText(search.trim());
    if (!q) return cards;

    return cards.filter((curso) =>
      normalizeCourseText(curso.searchText || curso.titulo || "").includes(q)
    );
  }, [cards, search]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const pages = chunk(cursosFiltrados, PAGE_SIZE);
  const total = pages.length;
  const current = pages[page] ?? [];

  useEffect(() => {
    if (page > 0 && page >= total) {
      setPage(Math.max(total - 1, 0));
    }
  }, [page, total]);

  const handleCardClick = (id) => {
    navigate(`/video/${id}`);
  };

  const handleCollectionClick = () => {
    navigate(TEKNISA_COLLECTION.route);
  };

  const goPreviousPage = () => {
    if (total <= 1) return;
    setPage((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const goNextPage = () => {
    if (total <= 1) return;
    setPage((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const renderArrow = (direction) => (
    <svg
      className="h-6 w-6 text-black"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      {direction === "left" ? <path d="M12 19l-7-7 7-7" /> : <path d="M12 5l7 7-7 7" />}
    </svg>
  );

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF9F7] pt-[128px] font-sans sm:pt-[132px] lg:pt-[72px]">
      <Header username={username} search={search} setSearch={setSearch} />

      <section
        className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "100% 35%",
        }}
      >
        <div className="flex h-full w-full max-w-[1150px] flex-col px-4 sm:px-6 lg:px-8">
          <Outlet />

          <div className="relative mt-1 flex w-full items-center justify-center">
            <button
              onClick={goPreviousPage}
              disabled={total <= 1}
              className="mx-2 hidden h-12 w-12 items-center justify-center rounded-full bg-white/40 transition hover:bg-white disabled:opacity-40 md:flex"
              aria-label="Página anterior"
            >
              {renderArrow("left")}
            </button>

            <div className="grid w-full max-w-sm grid-cols-1 justify-items-center gap-4 sm:max-w-2xl sm:grid-cols-2 md:max-w-4xl md:grid-cols-3 md:gap-6">
              {current.map((curso) => (
                <div key={curso.id} className="flex w-full justify-center">
                  <CarouselCard
                    id={curso.id}
                    title={curso.titulo}
                    icon_url={curso.icon_url}
                    onClick={() =>
                      curso.type === "collection"
                        ? handleCollectionClick()
                        : handleCardClick(curso.id)
                    }
                    className={
                      curso.type === "collection"
                        ? "bg-[linear-gradient(135deg,_#263238,_#e14d3a)]"
                        : ""
                    }
                  />
                </div>
              ))}

              {cursosFiltrados.length === 0 && (
                <p className="col-span-full rounded-lg bg-white/80 px-4 py-3 text-center text-gray-600 shadow-sm">
                  {search
                    ? `Nenhum curso encontrado para "${search}".`
                    : "Nenhum curso cadastrado no momento."}
                </p>
              )}
            </div>

            <button
              onClick={goNextPage}
              disabled={total <= 1}
              className="mx-2 hidden h-12 w-12 items-center justify-center rounded-full bg-white/40 transition hover:bg-white disabled:opacity-40 md:flex"
              aria-label="Próxima página"
            >
              {renderArrow("right")}
            </button>
          </div>

          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4 md:hidden">
              <button
                onClick={goPreviousPage}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                aria-label="Página anterior"
              >
                {renderArrow("left")}
              </button>
              <button
                onClick={goNextPage}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                aria-label="Próxima página"
              >
                {renderArrow("right")}
              </button>
            </div>
          )}

          {total > 0 && (
            <div className="flex min-h-[88px] w-full items-center justify-center py-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: total }).map((_, i) => (
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
