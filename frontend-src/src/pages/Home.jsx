import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import CarouselCard from "../components/CarouselCard";
import Header from "../components/Header";
import Chatbot from "../components/Chatbot";
import backgroundImage from "../assets/images/background_teknisa_page.png";


const PAGE_SIZE = 6;

// Função utilitária para dividir os cursos em páginas
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
      .catch((err) => console.error(" Erro ao carregar cursos:", err));
  }, []);

  const pages = chunk(cursos, PAGE_SIZE);
  const total = pages.length;
  const current = pages[page] ?? [];

  const handleCardClick = (id) => {
    console.log("Clicou no curso:", id);
    navigate(`/video/${id}`);
  };

  return (
    <main className="bg-[#FAF9F7] flex flex-col min-h-screen pt-[70px] font-sans">
      {/* Cabeçalho */}
      <Header username={username} />

      {/* Conteúdo principal */}
      <section className="relative flex flex-col justify-center items-center flex-1"
      style={{ 
              backgroundImage: `url(${backgroundImage})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom",
              backgroundSize: "100% 40%",
       }}
      >
      <div className="w-full max-w-[1150px] px-6 flex flex-col justify-between h-full pt-10">
       <Outlet />

          {/* Grid de cards e navegação */}
          <div className="relative w-full flex items-center justify-center mt-1">
            {/* Seta esquerda */}
            <button
              onClick={() => setPage((prev) => (prev > 0 ? prev - 1 : total - 1))}
              disabled={total <= 1}
              className="w-12 h-12 flex items-center justify-center bg-transparent mx-2"
              aria-label="Página anterior"
            >
              <svg
                className="w-6 h-6 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {current.map((curso) => (
                <div key={curso.id} className="flex justify-center">
                  <CarouselCard
                    id={curso.id}
                    title={curso.titulo}
                    icon={curso.icon_url}
                    onClick={() => handleCardClick(curso.id)}
                    className="h-[180px]"
                  />
                </div>
              ))}
            </div>

            {/* Seta direita */}
            <button
              onClick={() => setPage((prev) => (prev < total - 1 ? prev + 1 : 0))}
              disabled={total <= 1}
              className="w-12 h-12 flex items-center justify-center bg-transparent mx-2"
              aria-label="Próxima página"
            >
              <svg
                className="w-6 h-6 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Paginação */}
          {total > 0 && (
            <div className="w-full h-[100px] flex items-center justify-center">
              <div className="paginacao-container space-x-2">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`Ir para página ${i + 1}`}
                    className={`w-10 h-10 text-center flex items-center justify-center rounded-md font-medium
                      ${
                        page === i
                          ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-200"
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

      {/* Chatbot */}
      <Chatbot />
    </main>
  );
};

export default Home;
