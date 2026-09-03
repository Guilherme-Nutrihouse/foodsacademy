const { getAuthenticatedSession } = require('../services/rememberSessionService');

const requireAuth = (req, res, next) => {
  const session = getAuthenticatedSession(req);

  if (!session?.username) {
    return res.status(401).json({ error: 'Sessao expirada ou inexistente' });
  }

  req.authUser = session;
  next();
};

module.exports = requireAuth;
