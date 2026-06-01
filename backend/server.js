const path = require('path');
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const { buildCorsOptions, logError, logInfo, securityHeaders } = require('./security');
const routes = [
  require('./routes/authRoutes'),
  require('./routes/cursosRoutes'),
  require('./routes/videosRoutes'),
];

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders, cors(buildCorsOptions()), express.json({ limit: process.env.JSON_LIMIT || '100kb' }));
routes.forEach((route) => app.use('/api', route));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  logError('Erro inesperado no backend', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logInfo('Servidor rodando', { port: PORT }));
