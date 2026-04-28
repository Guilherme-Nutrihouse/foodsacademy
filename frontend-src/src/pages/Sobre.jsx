import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Doll from "../assets/images/doll2.png";
import Book from "../assets/images/book.png";
import Clock from "../assets/images/clock.png";
import List from "../assets/images/list.png";
import Play from "../assets/images/play-button.png";
import Onda1 from "../assets/images/background_onda3.jpg";
import Onda2 from "../assets/images/background_onda4.jpg";
import Footer from "../components/Footer.jsx"


const Sobre = () => {
  const [username, setUsername] = useState("Usuário");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored && stored !== "undefined") setUsername(stored);
    document.body.style.overflowY = "auto ";
  }, []);

  return (
    <main className="h-screen bg-[#FAF9F7] min-h-screen flex flex-col overflow-y-auto custom-scrollbar relative">
      {/* Onda no canto superior direito */}
      <div className="absolute top-0 right-0 z-0 flex-grow">
        <img 
          src={Onda1} 
          alt="Onda dir" 
          className="w-48 md:w-70" />
      </div>
      
      {/* Onda superior esquerda */}
            <img
              src={Onda2}
              alt="Onda esq"
              className="absolute top-0 left-0 w-auto h-[40%] max-w-[50%] object-contain z-0"
            />

      <Header username={username} />

      <div className="max-w-5xl relative ml-2 md:ml-24">
        {/* Hero + Missão e Visão lado a lado */}
        <section className="grid md:grid-cols-2 gap-8 items-center my-14">
          {/* Coluna esquerda → Doll */}
          <div className="flex justify-center md:justify-start">
            <img
              src={Doll}
              alt="Aluna estudando"
              className="auto drop-shadow-lg"
            />
          </div>

          {/* Missão e Visão */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h2 className="text-xl font-bold text-[#e14d3a] mb-3">NOSSA MISSÃO</h2>
              <p className="text-gray-800 leading-relaxed text-sm md:text-base">
                Promover um ambiente de aprendizado moderno, acessível e integrado
                ao dia a dia da NutriHouse, com foco em qualidade, inovação e
                desenvolvimento contínuo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h2 className="text-xl font-bold text-[#e14d3a] mb-3">NOSSA VISÃO</h2>
              <p className="text-gray-800 leading-relaxed text-sm md:text-base">
                Transformar a NutriHouse em um ambiente de aprendizado contínuo e de
                excelência, promovendo o crescimento e a capacitação de nossos colaboradores, 
                fortalecendo nossa cultura e garantindo a melhoria constante dos nossos 
                processos e serviços.
              </p>
            </div>
          </div>
        </section>

        {/* O que você encontra */}
        <section className="bg-white p-8 rounded-xl shadow my-12">
          <h2 className="text-xl md:text-2xl font-bold text-[#e14d3a] mb-10 text-center">
            O QUE ENCONTRAR NA PLATAFORMA
          </h2>
          <div className="space-y-6">
            {/* Item 1 */}
            <div className="flex items-center gap-4">
              <img src={List} alt="Cursos" className="w-10 h-10" />
              <p className="text-gray-700 text-sm md:text-base">
                Cursos e treinamentos organizados
              </p>
            </div>
            {/* Item 2 */}
            <div className="flex items-center gap-4">
              <img src={Play} alt="Vídeos" className="w-10 h-10" />
              <p className="text-gray-700 text-sm md:text-base">
                Vídeos práticos e acessíveis
              </p>
            </div>
            {/* Item 3 */}
            <div className="flex items-center gap-4">
              <img src={Book} alt="Materiais" className="w-10 h-10" />
              <p className="text-gray-700 text-sm md:text-base">
                Materiais de apoio digitais
              </p>
            </div>
            {/* Item 4 */}
            <div className="flex items-center gap-4">
              <img src={Clock} alt="Atualizações" className="w-10 h-10" />
              <p className="text-gray-700 text-sm md:text-base">
                Atualizações frequentes e novos módulos
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Rodapé */}
      <Footer />
    </main>
  );
};

export default Sobre;
