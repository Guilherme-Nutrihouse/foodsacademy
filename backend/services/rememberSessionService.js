const crypto = require('crypto');

const { logWarn } = require('../security');

const COOKIE_NAME = 'foodsacademy_remember_session';
const DEFAULT_MAX_AGE_DAYS = 30;

let runtimeSecret;

// Mantem o token compacto e seguro para transporte em cookie.
const encodeBase64Url = (value) =>
  Buffer.from(value).toString('base64url');

// Volta o payload assinado para texto antes de validar os campos.
const decodeBase64Url = (value) =>
  Buffer.from(value, 'base64url').toString('utf8');

// Usa segredo configurado quando existir; sem isso, tokens expiram ao reiniciar.
const getSessionSecret = () => {
  const configuredSecret =
    process.env.REMEMBER_SESSION_SECRET || process.env.SESSION_SECRET;

  if (configuredSecret && configuredSecret.trim().length >= 16) {
    return configuredSecret.trim();
  }

  if (!runtimeSecret) {
    runtimeSecret = crypto.randomBytes(32).toString('hex');
    logWarn(
      'REMEMBER_SESSION_SECRET ausente; cookies lembrados serao invalidados ao reiniciar o backend'
    );
  }

  return runtimeSecret;
};

// Permite ajustar a duracao sem mudar codigo.
const getMaxAgeMs = () => {
  const configuredDays = Number(process.env.REMEMBER_SESSION_DAYS);
  const days =
    Number.isFinite(configuredDays) && configuredDays > 0
      ? configuredDays
      : DEFAULT_MAX_AGE_DAYS;

  return days * 24 * 60 * 60 * 1000;
};

// Detecta HTTPS mesmo quando o Node esta atras de IIS/proxy reverso.
const isHttpsRequest = (req) => {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  return req.secure || forwardedProto === 'https';
};

// Secure pode ser configurado, mas por padrao acompanha a requisicao recebida.
const isSecureCookieEnabled = (req) => {
  const configuredValue = String(
    process.env.REMEMBER_SESSION_COOKIE_SECURE || ''
  ).toLowerCase();

  if (configuredValue === 'true') {
    return true;
  }

  if (configuredValue === 'false') {
    return false;
  }

  return isHttpsRequest(req);
};

const getCookieDomain = () => {
  const domain = String(process.env.REMEMBER_SESSION_COOKIE_DOMAIN || '').trim();
  return domain || undefined;
};

const getCookieOptions = (req, maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isSecureCookieEnabled(req),
  path: '/',
  ...(getCookieDomain() ? { domain: getCookieDomain() } : {}),
  ...(maxAge ? { maxAge } : {}),
});

const signPayload = (payload) =>
  crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

const signaturesMatch = (expected, received) => {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received || '');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

// O token contem apenas usuario e expiracao; nunca senha LDAP.
const createRememberSessionToken = (username) => {
  const payload = encodeBase64Url(
    JSON.stringify({
      username,
      exp: Date.now() + getMaxAgeMs(),
    })
  );
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
};

const verifyRememberSessionToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || !signaturesMatch(signPayload(payload), signature)) {
    return null;
  }

  try {
    const data = JSON.parse(decodeBase64Url(payload));

    if (
      typeof data.username !== 'string' ||
      data.username.trim().length === 0 ||
      typeof data.exp !== 'number' ||
      data.exp <= Date.now()
    ) {
      return null;
    }

    return data.username.trim();
  } catch {
    return null;
  }
};

// Le cookies sem adicionar dependencia nova ao backend.
const getCookieValue = (req, cookieName) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return '';
  }

  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));

  if (!cookie) {
    return '';
  }

  return decodeURIComponent(cookie.slice(cookieName.length + 1));
};

const setRememberSessionCookie = (req, res, username) => {
  res.cookie(
    COOKIE_NAME,
    createRememberSessionToken(username),
    getCookieOptions(req, getMaxAgeMs())
  );
};

const clearRememberSessionCookie = (req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions(req));
};

const getRememberedUsername = (req) =>
  verifyRememberSessionToken(getCookieValue(req, COOKIE_NAME));

module.exports = {
  clearRememberSessionCookie,
  getRememberedUsername,
  setRememberSessionCookie,
};
