export const getStoredUsername = () => {
  const username = localStorage.getItem("username");
  return username && username !== "undefined" ? username : "Usuário";
};

export const fetchJson = (url, options) =>
  fetch(url, options).then((res) => res.json());

export const withCourseIcon = (curso) => ({
  ...curso,
  icon_url: curso.icon ? `/icons_cursos/${curso.icon}` : null,
});
