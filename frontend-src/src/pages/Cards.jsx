import React, { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import CarouselCard from "../components/CarouselCard";

const Cards = () => {
  const [username, setUsername] = useState("");
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(
      storedUsername && storedUsername !== "undefined"
        ? storedUsername
        : "Usuário"
    );
  }, []);

  useEffect(() => {
    async function carregarCursos() {
      try {
        const res = await fetch('/api/cursos');
        const data = await res.json();

        // Ajusta as URLs dos ícones e adiciona fallback
        const cursosComIcones = data.map((curso) => ({
          id: curso.id,
          titulo: curso.titulo,
          caminho: curso.caminho,
          icon: curso.icon,
          caminho_icon: curso.caminho_icon,
          icon_url: curso.icon ? `/icons_cursos/${curso.icon}` : null,
        }));


        setCursos(cursosComIcones);
      } catch (error) {
        console.error(" Erro ao carregar cursos:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarCursos();
  }, []);

  const cursosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cursos;
    return cursos.filter((c) => (c.titulo || "").toLowerCase().includes(q));
  }, [cursos, search]);

  if (loading) {
    return (
      <main className="bg-white flex flex-col items-center min-h-screen justify-center">
        <h1 className="text-2xl text-gray-700">Carregando cursos...</h1>
      </main>
    );
  }

  return (
    <main className="bg-white flex flex-col items-center min-h-screen">
      {/* Cabeçalho */}
      <Header username={username} search={search} setSearch={setSearch} />

      {/* Conteúdo principal */}
      <div className="w-full flex flex-col items-center px-6 py-8">
        <h1 className="mt-8 text-2xl font-semibold text-gray-800">
          Todos os Cursos
        </h1>

        <div className="mt-2 text-sm text-gray-500">
          Mostrando {cursosFiltrados.length} de {cursos.length}
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center mt-6 w-full max-w-screen-xl">
          {cursos.map((curso) => (
            <div key={curso.id} className="w-full h-full flex justify-center">
              <CarouselCard
                id={curso.id}
                title={curso.titulo}
                caminho={curso.caminho}
                icon={curso.icon}
                caminho_icon={curso.caminho_icon}
                icon_url={curso.icon_url}
                className="h-[180px]"
              />
            </div>
          ))}

          {/* Caso não existam cursos (já considerando filtro) */}
          {cursosFiltrados.length === 0 && (
            <p className="text-gray-500 mt-6">
              {search
                ? `Nenhum curso encontrado para “${search}”.`
                : "Nenhum curso cadastrado no momento."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Cards;