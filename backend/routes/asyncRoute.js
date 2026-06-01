const { logError } = require('../security');

const asyncRoute = (message, handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    logError(message, err);
    res.status(500).json({ error: message });
  }
};

module.exports = asyncRoute;
