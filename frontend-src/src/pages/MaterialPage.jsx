import React from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const MaterialPage = () => {
  const { id } = useParams();

  const materiaisPorModulo = {
    1: [
      { titulo: "Guia de Boas-Vindas", tipo: "PDF", tamanho: "1.2 MB" },
      { titulo: "Apresentação - Aula 01", tipo: "Slides", tamanho: "2.1 MB" },
    ],
    2: [
      { titulo: "Manual de Liderança", tipo: "PDF", tamanho: "2.3 MB" },
      { titulo: "Atividades - Aula 02", tipo: "Excel", tamanho: "900 KB" },
    ],
    3: [{ titulo: "Guia de Desenvolvimento", tipo: "PDF", tamanho: "1.8 MB" }],
  };

  const materiais = materiaisPorModulo[id] || [];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FAF9F7] font-[Poppins,sans-serif]">
      <Sidebar showButton={false} />

      <section className="w-full px-4 pb-8 pt-24 sm:px-6 md:pl-[332px] md:pr-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
          <h1 className="mb-8 break-words text-center text-2xl font-bold sm:text-3xl md:mb-10">
            Materiais de Apoio - Aula {id}
          </h1>

          {materiais.length === 0 ? (
            <p className="text-center text-base text-gray-500 sm:text-lg">
              Nenhum material disponível para este módulo.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {materiais.map((material, i) => (
                <div
                  key={i}
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
                  <p className="mb-4 text-sm text-gray-500">
                    {material.tipo} - {material.tamanho}
                  </p>
                  <button className="rounded-lg bg-[#B95758] px-5 py-2 font-medium text-white transition duration-300 hover:bg-[#e14d3a]">
                    Baixar
                  </button>
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
