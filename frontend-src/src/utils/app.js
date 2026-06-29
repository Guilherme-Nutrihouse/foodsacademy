// Centraliza leituras JSON para manter as telas internas com o mesmo tratamento de sessao.
export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Erro ao buscar dados.");
  }

  return data;
}

// Normaliza respostas que deveriam ser listas, evitando quebra visual quando a API muda.
export function asArray(data) {
  return Array.isArray(data) ? data : [];
}

// Recupera o usuario salvo pelo login para exibir no cabecalho.
export function getStoredUsername() {
  return localStorage.getItem("username") || "Usuario";
}

// Monta a URL do icone do curso quando o backend retorna apenas caminho/nome do arquivo.
export function withCourseIcon(course) {
  if (!course || course.icon_url) return course;

  const iconPath = course.caminho_icon || course.icon;
  if (!iconPath) return course;

  const cleanPath = String(iconPath).replace(/^[/\\]+/, "").replace(/\\/g, "/");
  const icon_url = cleanPath.startsWith("icons_cursos/")
    ? `/${cleanPath}`
    : `/icons_cursos/${cleanPath}`;

  return { ...course, icon_url };
}
