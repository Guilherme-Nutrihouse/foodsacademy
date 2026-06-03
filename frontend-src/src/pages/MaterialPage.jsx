import React from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

// Materiais estaticos publicados na pasta public do React.
const materiaisPorCurso = {
  5: [
    {
      titulo: "Ebook Prompts de ChatGPT",
      tipo: "PDF",
      caminho: "/Materiais/Introducao_IA/prompts.pdf",
    },
  ],
};

const MaterialPage = () => {
  const { id } = useParams();
  const materiais = materiaisPorCurso[id] || [];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FAF9F7] font-[Poppins,sans-serif]">
      <Sidebar showButton={false} />

      <section className="w-full px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
          <h1 className="mb-8 break-words text-center text-2xl font-bold sm:text-3xl md:mb-10">
            Materiais de Apoio - Curso {id}
          </h1>

          {materiais.length === 0 ? (
            <p className="text-center text-base text-gray-500 sm:text-lg">
              Nenhum material disponivel para este curso.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {materiais.map((material) => (
                <div
                  key={material.caminho}
                  className="flex flex-col items-center rounded-lg bg-white p-5 text-center shadow-lg transition duration-300 hover:shadow-xl sm:p-6"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                    alt="Material"
                    className="mb-4 w-16 sm:w-20"
                  />
                  <h2 className="mb-2 break-words font-semibold text-gray-800">
                    {material.titulo}
                  </h2>
                  <p className="mb-4 text-sm text-gray-500">{material.tipo}</p>
                  <a
                    href={material.caminho}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#B95758] px-5 py-2 font-medium text-white transition duration-300 hover:bg-[#e14d3a]"
                  >
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MaterialPage;
