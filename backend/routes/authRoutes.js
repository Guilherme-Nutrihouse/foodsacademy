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

if (!LDAP_URL) throw new Error('Variavel de ambiente obrigatoria ausente: LDAP_URL');

router.get('/authenticate', (req, res) =>
  res.status(200).json({ ok: true, service: 'foodsacademy-api' })
);

router.get('/remember-session', (req, res) => {
  const username = getRememberedUsername(req);
  if (!username) return res.status(401).json({ remembered: false });

  logInfo('Sessao lembrada validada', { username });
  res.status(200).json({ remembered: true, username });
});

router.post('/logout', (req, res) => {
  clearRememberSessionCookie(req, res);
  res.status(200).json({ ok: true });
});

const closeLdap = (client) => {
  try {
    client.unbind((err) => err && logWarn('Erro ao encerrar conexao LDAP', err));
  } catch (err) {
    logWarn('Erro ao encerrar conexao LDAP', err);
  }
};

const ldapAuth = (userDN, password) =>
  new Promise((resolve) => {
    const client = ldap.createClient({
      url: LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000,
    });
    let done = false;

    const finish = (ok, err) => {
      if (done) return;
      done = true;
      if (err) logError('Erro de conexao LDAP', err);
      closeLdap(client);
      resolve(ok);
    };

    client.on('error', (err) => finish(false, err));
    client.bind(userDN, password, (err) => {
      if (done) return;

      if (err) logWarn('Falha LDAP', { userDN, reason: 'credenciais_invalidas' });
      else logInfo('Autenticacao LDAP bem-sucedida', { userDN });

      finish(!err);
    });
  });

router.post('/authenticate', async (req, res) => {
  const { userDN = '', password = '', rememberLogin } = req.body || {};
  const normalizedUserDN = String(userDN).trim();

  if (!normalizedUserDN || typeof password !== 'string' || !password) {
    logWarn('Tentativa de autenticacao com credenciais invalidas');
    return res.status(400).json({ message: 'Credenciais obrigatorias' });
  }

  logInfo('Requisicao recebida em /authenticate', { userDN: normalizedUserDN });

  if (!(await ldapAuth(normalizedUserDN, password))) {
    logWarn('Falha na autenticacao do usuario', { userDN: normalizedUserDN });
    return res.status(401).json({ message: 'Falha na autenticação' });
  }

  const username = normalizedUserDN.split('@')[0];
  if (rememberLogin === true) setRememberSessionCookie(req, res, username);
  else clearRememberSessionCookie(req, res);

  logInfo('Usuario autenticado', { username });
  res.json({ message: 'Autenticação bem-sucedida', username });
});

module.exports = router;
