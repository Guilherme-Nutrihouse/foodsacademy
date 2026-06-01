import React, { useState } from "react";
import ChatbotIcon from "../assets/images/chatbot2.png";
import chatbotData from "../data/chatbotData.js";
import Icon from "./Icon";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensagens, setMensagens] = useState([
    { de: "bot", texto: gerarMenu("Menu Principal") },
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
    const userMessage = { de: "user", texto: entrada };
    const nextContext = op?.resposta ? "Menu Principal" : op?.next || contexto;
    const botMessages = op?.resposta
      ? [
          { de: "bot", texto: op.resposta },
          { de: "bot", texto: gerarMenu("Menu Principal") },
        ]
      : [{ de: "bot", texto: op?.next ? gerarMenu(op.next) : "Opção inválida, tente novamente." }];

    setMensagens((prev) => [...prev, userMessage, ...botMessages]);
    setContexto(nextContext);

    setEntrada("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#EAB308] shadow-lg transition hover:bg-yellow-400 sm:right-6 sm:h-16 sm:w-16"
        aria-label="Abrir Chatbot"
      >
        <img src={ChatbotIcon} alt="Chatbot" className="h-8 w-8" />
      </button>

      <div
        className={`fixed bottom-24 left-3 right-3 z-40 flex h-96 max-h-[calc(100vh-8rem)] flex-col rounded-lg border border-gray-300 bg-white shadow-xl transition-all duration-300 ease-in-out sm:left-auto sm:right-6 sm:w-80 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="rounded-t-lg bg-[#80B5B4] p-3 font-bold text-white">
          Assistente NH
        </div>

        <div className="flex-grow space-y-2 overflow-auto p-4">
          {mensagens.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.de === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
                  msg.de === "user"
                    ? "bg-yellow-100 text-gray-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.texto}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t bg-gray-50 p-2">
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Digite o número..."
            className="min-w-0 flex-1 rounded-md border border-gray-300 p-2"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="rounded-md bg-yellow-500 px-3 text-white hover:bg-yellow-400"
            aria-label="Enviar mensagem"
          >
            <Icon name="send" />
          </button>
        </div>
      </div>
    </>
  );
}

export default Chatbot;
