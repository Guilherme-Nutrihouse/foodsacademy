const crypto = require('crypto');

const { logWarn } = require('../security');

const COOKIE_NAME = 'foodsacademy_remember_session';
const DEFAULT_DAYS = 30;
let runtimeSecret;

const env = (name) => String(process.env[name] || '').trim();

const b64 = (value) => Buffer.from(value).toString('base64url');

const fromB64 = (value) => Buffer.from(value, 'base64url').toString('utf8');

const getSessionSecret = () => {
  const secret = env('REMEMBER_SESSION_SECRET') || env('SESSION_SECRET');
  if (secret.length >= 16) return secret;

  if (!runtimeSecret) {

    runtimeSecret = crypto.randomBytes(32).toString('hex');
    logWarn(
      'REMEMBER_SESSION_SECRET ausente; cookies lembrados serao invalidados ao reiniciar o backend'
    );
  }

  return runtimeSecret;
};

const getMaxAgeMs = () => {

  const days = Number(process.env.REMEMBER_SESSION_DAYS);
  return (Number.isFinite(days) && days > 0 ? days : DEFAULT_DAYS) * 86400000;
};

const isSecureCookieEnabled = (req) => {
  const configured = env('REMEMBER_SESSION_COOKIE_SECURE').toLowerCase();
  if (configured) return configured === 'true';

  const proto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  return req.secure || proto === 'https';
};

const getCookieOptions = (req, maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isSecureCookieEnabled(req),
  path: '/',
  ...(env('REMEMBER_SESSION_COOKIE_DOMAIN') && { domain: env('REMEMBER_SESSION_COOKIE_DOMAIN') }),
  ...(maxAge && { maxAge }),
});

const sign = (payload) =>

  crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');

const signaturesMatch = (expected, received = '') => {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);

  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const createRememberSessionToken = (username, isAdmin = false, nomeCompleto = '') => {
  const payload = b64(

    JSON.stringify({
      username,
      nomeCompleto,
      isAdmin: isAdmin === true,
      exp: Date.now() + getMaxAgeMs(),
    })
  );
  return `${payload}.${sign(payload)}`;
};

const verifyRememberSessionToken = (token) => {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || !signaturesMatch(sign(payload), signature)) return null;

  try {

    const { username, nomeCompleto, isAdmin, exp } = JSON.parse(fromB64(payload));
    return typeof username === 'string' &&
      username.trim() &&
      typeof exp === 'number' &&
      exp > Date.now()
      ? {
          username: username.trim(),
          nomeCompleto:
            typeof nomeCompleto === 'string' ? nomeCompleto.trim() : '',
          isAdmin: isAdmin === true,
        }
      : null;
  } catch {
    return null;
  }
};

const getCookieValue = (req, name) => {

  const cookie = String(req.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
};

const setRememberSessionCookie = (
  req,
  res,
  username,
  remember = false,
  isAdmin = false,
  nomeCompleto = ''
) =>
  res.cookie(
    COOKIE_NAME,
    createRememberSessionToken(username, isAdmin, nomeCompleto),
    getCookieOptions(req, remember ? getMaxAgeMs() : null)
  );

const clearRememberSessionCookie = (req, res) =>
  res.clearCookie(COOKIE_NAME, getCookieOptions(req));

const getRememberedSession = (req) =>
  verifyRememberSessionToken(getCookieValue(req, COOKIE_NAME));

const getRememberedUsername = (req) => getRememberedSession(req)?.username || null;

const getAuthenticatedSession = getRememberedSession;
const getAuthenticatedUsername = getRememberedUsername;

module.exports = {
  clearRememberSessionCookie,
  getAuthenticatedSession,
  getAuthenticatedUsername,
  getRememberedSession,
  getRememberedUsername,
  setRememberSessionCookie,
};
