import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Doll from "../assets/images/doll2.png";
import Book from "../assets/images/book.png";
import Clock from "../assets/images/clock.png";
import List from "../assets/images/list.png";
import Play from "../assets/images/play-button.png";
import Onda1 from "../assets/images/background_onda3.jpg";
import Onda2 from "../assets/images/background_onda4.jpg";
import Footer from "../components/Footer.jsx";

const Sobre = () => {
  const [username, setUsername] = useState("Usuário");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored && stored !== "undefined") setUsername(stored);
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FAF9F7]">
      <img
        src={Onda1}
        alt=""
        className="pointer-events-none absolute right-0 top-0 z-0 w-36 sm:w-48 md:w-56"
      />

      <img
        src={Onda2}
        alt=""
        className="pointer-events-none absolute left-0 top-0 z-0 h-[28%] max-w-[70%] object-contain sm:h-[40%] sm:max-w-[50%]"
      />

      <Header username={username} />

      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 pt-[118px] sm:px-6 lg:px-8 lg:pt-24">
        <section className="my-8 grid items-center gap-6 md:my-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
          <div className="flex justify-center md:justify-start">
            <img
              src={Doll}
              alt="Aluna estudando"
              className="w-48 max-w-full drop-shadow-lg sm:w-64 md:w-full md:max-w-sm"
            />
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-lg bg-white p-5 text-center shadow sm:p-6">
              <h2 className="mb-3 text-lg font-bold text-[#e14d3a] sm:text-xl">
                NOSSA MISSÃO
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 md:text-base">
                Promover um ambiente de aprendizado moderno, acessível e integrado
                ao dia a dia da NutriHouse, com foco em qualidade, inovação e
                desenvolvimento contínuo.
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 text-center shadow sm:p-6">
              <h2 className="mb-3 text-lg font-bold text-[#e14d3a] sm:text-xl">
                NOSSA VISÃO
              </h2>
              <p className="text-sm leading-relaxed text-gray-800 md:text-base">
                Transformar a NutriHouse em um ambiente de aprendizado contínuo e
                de excelência, promovendo o crescimento e a capacitação de nossos
                colaboradores, fortalecendo nossa cultura e garantindo a melhoria
                constante dos nossos processos e serviços.
              </p>
            </div>
          </div>
        </section>

        <section className="my-10 rounded-lg bg-white p-5 shadow sm:p-8 md:my-12">
          <h2 className="mb-8 text-center text-xl font-bold text-[#e14d3a] md:mb-10 md:text-2xl">
            O QUE ENCONTRAR NA PLATAFORMA
          </h2>
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-start gap-4">
              <img src={List} alt="" className="h-10 w-10 shrink-0" />
              <p className="text-sm text-gray-700 md:text-base">
                Cursos e treinamentos organizados
              </p>
            </div>
            <div className="flex items-start gap-4">
              <img src={Play} alt="" className="h-10 w-10 shrink-0" />
              <p className="text-sm text-gray-700 md:text-base">
                Vídeos práticos e acessíveis
              </p>
            </div>
            <div className="flex items-start gap-4">
              <img src={Book} alt="" className="h-10 w-10 shrink-0" />
              <p className="text-sm text-gray-700 md:text-base">
                Materiais de apoio digitais
              </p>
            </div>
            <div className="flex items-start gap-4">
              <img src={Clock} alt="" className="h-10 w-10 shrink-0" />
              <p className="text-sm text-gray-700 md:text-base">
                Atualizações frequentes e novos módulos
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default Sobre;
