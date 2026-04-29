const express = require('express');
const cors = require('cors');
const path = require('path');

// Carrega as variaveis do backend antes de importar rotas que dependem delas.
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const {
  buildCorsOptions,
  logError,
  logInfo,
  securityHeaders,
} = require('./security');

const authRoutes = require('./routes/authRoutes');
const cursosRoutes = require('./routes/cursosRoutes');
const videosRoutes = require('./routes/videosRoutes');

const app = express();

// Middlewares globais: removem exposicao desnecessaria, aplicam headers,
// liberam CORS conforme ambiente e limitam o tamanho do JSON recebido.
app.disable('x-powered-by');
// Permite detectar HTTPS original quando o backend roda atras do IIS/proxy.
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: process.env.JSON_LIMIT || '100kb' }));
logInfo('Express.json habilitado para ler JSON');

// Todas as rotas mantem o prefixo /api para preservar os endpoints atuais.
app.use('/api', authRoutes);
app.use('/api', cursosRoutes);
app.use('/api', videosRoutes);

// Tratamento central para erros nao previstos nas rotas/middlewares.
app.use((err, req, res, next) => {
  logError('Erro inesperado no backend', err);

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
});

//////////////////// INICIAR SERVIDOR ////////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logInfo('Servidor rodando', { port: PORT });
});
