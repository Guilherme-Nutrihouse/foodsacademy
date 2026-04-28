import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";


// 👇 Cria uma regra global de estilo em tempo de execução
const globalStyle = document.createElement("style");
globalStyle.innerHTML = `
  html, body, #root {
    font-family: 'Poppins', sans-serif !important;
    background-color: #FAF9F7;
    margin: 0;
    padding: 0;
    height: 100%;
  }
`;
document.head.appendChild(globalStyle);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
