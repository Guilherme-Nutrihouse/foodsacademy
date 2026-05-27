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

const COURSE_COLLECTIONS = {
  [TEKNISA_COLLECTION.id]: TEKNISA_COLLECTION,
};

export const getCourseCollection = (id) => COURSE_COLLECTIONS[id] || null;

export const courseStartsWithPrefix = (course, prefix) =>
  normalizeCourseText(course?.titulo || "").startsWith(normalizeCourseText(prefix));
