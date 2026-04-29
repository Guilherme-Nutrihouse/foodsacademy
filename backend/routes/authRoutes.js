const express = require('express');
const ldap = require('ldapjs');

const { logError, logInfo, logWarn } = require('../security');
const {
  clearRememberSessionCookie,
  getRememberedUsername,
  setRememberSessionCookie,
} = require('../services/rememberSessionService');

const router = express.Router();
const LDAP_URL = process.env.LDAP_URL;

// LDAP_URL e obrigatorio porque toda autenticacao deve passar pelo diretorio.
if (!LDAP_URL) {
  throw new Error('Variavel de ambiente obrigatoria ausente: LDAP_URL');
}

// Health check simples usado para confirmar que a API esta respondendo.
router.get('/authenticate', (req, res) => {
  res.status(200).json({ ok: true, service: 'foodsacademy-api' });
});

// Restaura acesso lembrado somente quando o cookie assinado pelo backend e valido.
router.get('/remember-session', (req, res) => {
  const username = getRememberedUsername(req);

  if (!username) {
    return res.status(401).json({ remembered: false });
  }

  logInfo('Sessao lembrada validada', { username });
  return res.status(200).json({ remembered: true, username });
});

// Limpa o cookie HttpOnly no encerramento da sessao.
router.post('/logout', (req, res) => {
  clearRememberSessionCookie(req, res);
  res.status(200).json({ ok: true });
});

// Fecha a conexao LDAP apos cada tentativa para evitar conexoes penduradas.
const unbindClient = (client) => {
  try {
    client.unbind((err) => {
      if (err) {
        logWarn('Erro ao encerrar conexao LDAP', err);
      }
    });
  } catch (err) {
    logWarn('Erro ao encerrar conexao LDAP', err);
  }
};

// Faz bind direto no LDAP com o DN/senha informados e retorna apenas sucesso/falha.
const authenticateWithDN = (userDN, password, callback) => {
  logInfo('Iniciando autenticacao LDAP', { userDN });

  const client = ldap.createClient({
    url: LDAP_URL,
    timeout: 5000,
    connectTimeout: 10000,
  });

  // Garante que callback sera chamado uma unica vez mesmo se houver erro de socket.
  let completed = false;
  const done = (isAuthenticated) => {
    if (!completed) {
      completed = true;
      callback(isAuthenticated);
    }
  };

  client.on('error', (err) => {
    logError('Erro de conexao LDAP', err);
    done(false);
  });

  client.bind(userDN, password, (err) => {
    unbindClient(client);

    if (err) {
      logWarn('Falha LDAP', { userDN, reason: 'credenciais_invalidas' });
      done(false);
      return;
    }

    logInfo('Autenticacao LDAP bem-sucedida', { userDN });
    done(true);
  });
};

// Recebe credenciais, valida formato minimo e delega a autenticacao ao LDAP.
router.post('/authenticate', (req, res) => {
  const { userDN, password, rememberLogin } = req.body || {};

  if (
    typeof userDN !== 'string' ||
    typeof password !== 'string' ||
    userDN.trim().length === 0 ||
    password.length === 0
  ) {
    logWarn('Tentativa de autenticacao com credenciais invalidas');
    return res.status(400).json({ message: 'Credenciais obrigatorias' });
  }

  const normalizedUserDN = userDN.trim();
  logInfo('Requisicao recebida em /authenticate', { userDN: normalizedUserDN });

  authenticateWithDN(normalizedUserDN, password, (isAuthenticated) => {
    if (isAuthenticated) {
      // Retorna apenas o usuario derivado do DN, sem devolver senha ou detalhes LDAP.
      const username = normalizedUserDN.split('@')[0];

      // O cookie lembrado autentica proximos acessos sem guardar a senha LDAP.
      if (rememberLogin === true) {
        setRememberSessionCookie(req, res, username);
      } else {
        clearRememberSessionCookie(req, res);
      }

      logInfo('Usuario autenticado', { username });
      res.json({ message: 'Autentica\u00e7\u00e3o bem-sucedida', username });
    } else {
      logWarn('Falha na autenticacao do usuario', { userDN: normalizedUserDN });
      res.status(401).json({ message: 'Falha na autentica\u00e7\u00e3o' });
    }
  });
});

module.exports = router;
