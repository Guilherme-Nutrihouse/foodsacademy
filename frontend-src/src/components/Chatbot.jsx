import React, { useState } from "react";
import ChatbotIcon from "../assets/images/chatbot2.png";
import chatbotData from "../data/chatbotData.js"; 

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensagens, setMensagens] = useState([
    { de: "bot", texto: gerarMenu("Menu Principal") }
  ]);
  const [entrada, setEntrada] = useState("");
  const [contexto, setContexto] = useState("Menu Principal");

  function gerarMenu(nomeMenu) {
    const opcoes = Object.entries(chatbotData[nomeMenu])
      .map(([key, val]) => `${key} - ${val.texto}`)
      .join("\n");
    return `Em que posso te ajudar? Digite a opção desejada:\n${opcoes}`;
  }

  const handleSend = () => {
    if (!entrada) return;

    const op = chatbotData[contexto][entrada];
    setMensagens((prev) => [...prev, { de: "user", texto: entrada }]);

    if (op) {
      if (op.resposta) {
        // Resposta final
        setMensagens((prev) => [...prev, { de: "bot", texto: op.resposta }]);

        // Volta ao menu principal
        setMensagens((prev) => [...prev, { de: "bot", texto: gerarMenu("Menu Principal") }]);
        setContexto("Menu Principal");
      } else if (op.next) {
        // Submenu
        setMensagens((prev) => [...prev, { de: "bot", texto: gerarMenu(op.next) }]);
        setContexto(op.next);
      }
    } else {
      // Caso inválido
      setMensagens((prev) => [...prev, { de: "bot", texto: "Opção inválida, tente novamente." }]);
    }

    setEntrada("");
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-6 z-40 w-16 h-16 rounded-full bg-[#EAB308] shadow-lg hover:bg-yellow-400 transition grid place-items-center"
        aria-label="Abrir Chatbot"
      >
        <img src={ChatbotIcon} alt="Chatbot" className="w-8 h-8" />
      </button>

      {/* 🔹 Janela do chatbot */}
      <div
        className={`fixed bottom-24 right-6 w-80 h-96 bg-white border border-gray-300 rounded-2xl shadow-xl z-40 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {/* Cabeçalho */}
        <div className="p-3 bg-[#80B5B4] text-white font-bold rounded-t-2xl">
          Assistente NH 🤖
        </div>

        {/* Área de mensagens */}
        <div className="flex-grow overflow-auto p-4 space-y-2">
          {mensagens.map((msg, i) => (
            <div key={i} className={`flex ${msg.de === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                  msg.de === "user"
                    ? "bg-yellow-100 text-gray-800 text-sm"
                    : "bg-gray-100 text-gray-800 text-sm"
                }`}
              >
                {msg.texto}
              </div>
            </div>
          ))}
        </div>

        {/* Campo de entrada */}
        <div className="p-2 border-t bg-gray-50 flex gap-2">
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Digite o número..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-yellow-500 hover:bg-yellow-400 text-white px-3 rounded-md"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}

export default Chatbot;
