const path = require('path');
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const { buildCorsOptions, logError, logInfo, securityHeaders } = require('./security');
const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = [
  require('./routes/cursosRoutes'),
  require('./routes/videosRoutes'),
];

const app = express();
const staticFolders = [
  {
    route: '/videos_cursos',
    folder: path.join(__dirname, '..', 'videos_cursos'),
  },
  {
    route: '/icons_cursos',
    folder: path.join(__dirname, '..', 'icons_cursos'),
  },
];

// Permite cache curto dos arquivos estaticos sem prender atualizacoes por muito tempo.
const setStaticHeaders = (res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders, cors(buildCorsOptions()), express.json({ limit: process.env.JSON_LIMIT || '100kb' }));
// Mantem arquivos estaticos no fluxo anterior do front/IIS.
staticFolders.forEach(({ route, folder }) =>
  app.use(
    route,
    express.static(folder, {
      dotfiles: 'ignore',
      setHeaders: setStaticHeaders,
    })
  )
);
app.use('/api', authRoutes);
// Protege APIs internas contra acesso direto por link compartilhado.
protectedRoutes.forEach((route) => app.use('/api', requireAuth, route));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  logError('Erro inesperado no backend', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logInfo('Servidor rodando', { port: PORT }));
