export const normalizeCourseText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const TEKNISA_COLLECTION = {
  id: "teknisa",
  title: "Teknisa",
  prefix: "Tecfood -",
  iconUrl: "/icons_cursos/icon_teknisa.png",
  route: "/cards?collection=teknisa",
};

// Filtro dos cursos com prefixo IA -.
export const IA_COLLECTION = {
  id: "ia",
  title: "IA - Inteligência Artificial",
  prefix: "IA -",
  iconUrl: "/icons_cursos/icon_ia.png",
  route: "/cards?collection=ia",
};

export const MARKETING_COLLECTION = {
  id: "mkt",
  title: "Marketing Digital",
  prefix: "MKT -",
  iconUrl: "/icons_cursos/icon_mkt.png",
  route: "/cards?collection=mkt",
};

// Colecoes exibidas como filtros na Home.
export const COURSE_COLLECTIONS = [TEKNISA_COLLECTION, IA_COLLECTION, MARKETING_COLLECTION];

// Busca a colecao ativa pela query string da pagina de cards.
export const getCourseCollection = (id) =>
  COURSE_COLLECTIONS.find((collection) => collection.id === id) || null;

// Mantem compatibilidade com chamadas antigas do filtro Teknisa.
export const getTeknisaCourseCollection = (id) =>
  id === TEKNISA_COLLECTION.id ? getCourseCollection(id) : null;

export const courseStartsWithPrefix = (course, prefix) =>
  normalizeCourseText(course?.titulo || "").startsWith(
    normalizeCourseText(prefix)
  );
