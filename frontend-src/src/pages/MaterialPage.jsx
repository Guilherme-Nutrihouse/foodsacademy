import React from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const MaterialPage = () => {
  const { id } = useParams();

  // Materiais separados por ID 
  const materiaisPorModulo = {
    1: [
      { titulo: "Guia de Boas-Vindas", tipo: "PDF", tamanho: "1.2 MB" },
      { titulo: "Apresentação – Aula 01", tipo: "Slides", tamanho: "2.1 MB" },
    ],
    2: [
      { titulo: "Manual de Liderança", tipo: "PDF", tamanho: "2.3 MB" },
      { titulo: "Atividades – Aula 02", tipo: "Excel", tamanho: "900 KB" },
    ],
    3: [
      { titulo: "Guia de Desenvolvimento", tipo: "PDF", tamanho: "1.8 MB" },
    ],
  };

  const materiais = materiaisPorModulo[id] || [];

  return (
    <main className="relative min-h-screen bg-[#FAF9F7] font-[Poppins,sans-serif]">
      {/* Sidebar */}
      <Sidebar showButton={false} />

      {/* Conteúdo principal */} 
      <section className="ml-72 p-8 flex flex-col items-center">
        <div className="flex flex-col justify-center w-full max-w-6xl">
          {/* Título centralizado horizontalmente */}
          <h1 className="text-3xl font-bold text-center mb-10">
            Materiais de Apoio – Aula {id}
          </h1>

          {/* Materiais */}
          {materiais.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              Nenhum material disponível para este módulo.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {materiais.map((m, i) => (
                <div
                  key={i}
                  className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center text-center hover:shadow-xl transition duration-300"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                    alt="Material"
                    className="w-20 mb-4"
                  />
                  <h3 className="font-semibold text-gray-800 mb-2">{m.titulo}</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {m.tipo} • {m.tamanho}
                  </p>
                  <button className="bg-[#B95758] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#e14d3a] transition duration-300">
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
