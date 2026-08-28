const USERNAME_STORAGE_KEY = "username";
const FULL_NAME_STORAGE_KEY = "nomeCompleto";
const IS_ADMIN_STORAGE_KEY = "isAdmin";

const hasOwn = (data, key) =>
  data !== null &&
  data !== undefined &&
  Object.prototype.hasOwnProperty.call(data, key);

const toBoolean = (value) =>
  value === true || String(value).trim().toLowerCase() === "true";

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
  return localStorage.getItem(USERNAME_STORAGE_KEY) || "Usuario";
}

export function getStoredNomeCompleto() {
  return localStorage.getItem(FULL_NAME_STORAGE_KEY) || "";
}

export function getStoredIsAdmin() {
  return toBoolean(localStorage.getItem(IS_ADMIN_STORAGE_KEY));
}

export function getStoredUser() {
  const username = getStoredUsername();
  const nomeCompleto = getStoredNomeCompleto();

  return {
    username,
    nomeCompleto: nomeCompleto || username,
    isAdmin: getStoredIsAdmin(),
  };
}

export function saveStoredSession(data = {}) {
  const username = data.username ? String(data.username).trim() : "";

  if (data.username) {
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
  }

  const hasFullName =
    hasOwn(data, "nomeCompleto") ||
    hasOwn(data, "fullName") ||
    hasOwn(data, "displayName");
  const nomeCompleto = String(
    data.nomeCompleto || data.fullName || data.displayName || "",
  ).trim();

  if (hasFullName) {
    if (nomeCompleto) localStorage.setItem(FULL_NAME_STORAGE_KEY, nomeCompleto);
    else localStorage.removeItem(FULL_NAME_STORAGE_KEY);
  } else if (username) {
    localStorage.removeItem(FULL_NAME_STORAGE_KEY);
  }

  if (hasOwn(data, "isAdmin")) {
    localStorage.setItem(IS_ADMIN_STORAGE_KEY, String(toBoolean(data.isAdmin)));
  }
}

export function clearStoredSession() {
  localStorage.removeItem(USERNAME_STORAGE_KEY);
  localStorage.removeItem(FULL_NAME_STORAGE_KEY);
  localStorage.removeItem(IS_ADMIN_STORAGE_KEY);
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
