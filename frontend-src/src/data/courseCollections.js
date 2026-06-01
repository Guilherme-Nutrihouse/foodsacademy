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

export const getCourseCollection = (id) =>
  id === TEKNISA_COLLECTION.id ? TEKNISA_COLLECTION : null;

export const courseStartsWithPrefix = (course, prefix) =>
  normalizeCourseText(course?.titulo || "").startsWith(
    normalizeCourseText(prefix)
  );
