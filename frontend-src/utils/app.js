export const getStoredUsername = () => {
    const username = localStorage.getItem("username");
    return username && username !== "undefined" ? username : "Usuário";
};

export const fetchJson = async (url, options = {}) => {
    // Envia o cookie httpOnly da sessao em todas as chamadas internas da API.
    const res = await fetch(url, { credentials: "include", ...options });
    const data = await res.json().catch(() => ({}));

    // Trata erros HTTP antes de entregar os dados para as telas.
    if (!res.ok) throw new Error(data.message || data.error || "Erro ao conectar ao servidor");

    return data;
};

// Garante lista vazia quando a API retornar outro formato.
export const asArray = (value) => (Array.isArray(value) ? value : []);

export const withCourseIcon = (curso) => ({
    ...curso,
    icon_url: curso.icon ? `/icons_cursos/${curso.icon}` : null,
});