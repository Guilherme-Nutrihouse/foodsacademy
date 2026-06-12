const { getAuthenticatedUsername } = require('../services/rememberSessionService');

// Bloqueia APIs internas quando nao existe sessao assinada emitida pelo login LDAP.
const requireAuth = (req, res, next) => {
  const username = getAuthenticatedUsername(req);

  if (!username) {
    return res.status(401).json({ error: 'Sessao expirada ou inexistente' });
  }

  req.authUser = { username };
  next();
};

module.exports = requireAuth;
