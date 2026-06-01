const REDACTED = '[redacted]';
const SENSITIVE = /(password|senha|pass|secret|token|authorization|cookie|session|credential|credencial)/i;
const IDENTITY = /(user|usuario|username|userdn|dn|email|login)/i;

const maskPart = (value) => {
  const text = String(value || '').trim();
  if (!text) return REDACTED;
  return `${text.length <= 2 ? text.charAt(0) : text.slice(0, 2)}***`;
};

const maskIdentity = (value) => {
  const text = String(value || '').trim();
  if (!text) return REDACTED;

  const [user] = text.split('@');
  return text.includes('@') ? `${maskPart(user)}@***` : maskPart(text);
};

const redactText = (value) =>
  String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, maskIdentity)
    .replace(/Login failed for user '[^']*'/gi, "Login failed for user '[redacted]'")
    .replace(
      /(password|senha|secret|token|authorization|cookie)\s*[:=]\s*([^\s,;]+)/gi,
      '$1=[redacted]'
    );

const sanitizeLogData = (data) => {
  if (data === undefined || data === null) return data;
  if (data instanceof Error) return redactText(data.message);
  if (Array.isArray(data)) return data.map(sanitizeLogData);
  if (typeof data === 'string') return redactText(data);
  if (typeof data !== 'object') return data;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      SENSITIVE.test(key)
        ? REDACTED
        : IDENTITY.test(key)
        ? maskIdentity(value)
        : sanitizeLogData(value),
    ])
  );
};

const logger = (method) => (message, details) =>
  details === undefined
    ? console[method](message)
    : console[method](message, sanitizeLogData(details));

const buildCorsOptions = () => {
  const allowed = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return allowed.length
    ? {
        credentials: true,
        origin: (origin, done) =>
          !origin || allowed.includes(origin)
            ? done(null, true)
            : done(new Error('Origem nao permitida pelo CORS')),
      }
    : { origin: true, credentials: true };
};

const securityHeaders = (req, res, next) => {
  [
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'no-referrer'],
    ['Cache-Control', 'no-store'],
  ].forEach(([key, value]) => res.setHeader(key, value));
  next();
};

module.exports = {
  buildCorsOptions,
  logError: logger('error'),
  logInfo: logger('log'),
  logWarn: logger('warn'),
  maskIdentity,
  securityHeaders,
};
