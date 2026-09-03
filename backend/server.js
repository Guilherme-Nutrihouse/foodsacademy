const path = require("path");
const express = require("express");
const cors = require("cors");
const compression = require("compression");

require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const {
  buildCorsOptions,
  logError,
  logInfo,
  securityHeaders,
} = require("./security");
const requireAuth = require("./middleware/requireAuth");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = [
  require("./routes/cursosRoutes"),
  require("./routes/modulosRoutes"),
  require("./routes/videosRoutes"),
  require("./routes/materiaisRoutes"),
  require("./routes/contatosRoutes"),
];

const app = express();
app.use("/api", compression({ threshold: "1kb" }));

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const setStaticHeaders = (res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
};

const setVideoHeaders = (res) => {
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=86400");
};

const staticFolders = [
  {
    route: "/videos_cursos",
    folder: path.join(__dirname, "..", "videos_cursos"),
    maxAge: ONE_DAY_MS,
    setHeaders: setVideoHeaders,
  },
  {
    route: "/icons_cursos",
    folder: path.join(__dirname, "..", "icons_cursos"),
    maxAge: ONE_HOUR_MS,
    setHeaders: setStaticHeaders,
  },
];

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  securityHeaders,
  cors(buildCorsOptions()),
  express.json({ limit: process.env.JSON_LIMIT || "100kb" }),
);

staticFolders.forEach(({ route, folder, maxAge, setHeaders }) =>
  app.use(
    route,
    express.static(folder, {
      acceptRanges: true,
      dotfiles: "ignore",
      etag: true,
      lastModified: true,
      maxAge,
      setHeaders,
    }),
  ),
);
app.use("/api", authRoutes);

protectedRoutes.forEach((route) => app.use("/api", requireAuth, route));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  logError("Erro inesperado no backend", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logInfo("Servidor rodando", { port: PORT }));
