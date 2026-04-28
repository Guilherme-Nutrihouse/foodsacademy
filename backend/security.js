const REDACTED = '[redacted]';

// Chaves com estes nomes nunca devem aparecer completas nos logs.
const SENSITIVE_KEY_PATTERN =
  /(password|senha|pass|secret|token|authorization|cookie|session|credential|credencial)/i;
const IDENTITY_KEY_PATTERN = /(user|usuario|username|userdn|dn|email|login)/i;

// Mantem um pequeno prefixo para ajudar na auditoria sem expor o valor completo.
const maskPart = (value) => {
  const text = String(value || '').trim();

  if (!text) {
    return REDACTED;
  }

  if (text.length <= 2) {
    return `${text.charAt(0)}***`;
  }

  return `${text.slice(0, 2)}***`;
};

// Mascara usuarios/e-mails antes de registrar qualquer evento de autenticacao.
const maskIdentity = (identity) => {
  const text = String(identity || '').trim();

  if (!text) {
    return REDACTED;
  }

  const [localPart] = text.split('@');
  return text.includes('@') ? `${maskPart(localPart)}@***` : maskPart(text);
};

// Remove dados sensiveis de mensagens textuais vindas de erros ou bibliotecas.
const redactSensitiveText = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi, (match) => maskIdentity(match))
    .replace(/Login failed for user '[^']*'/gi, "Login failed for user '[redacted]'")
    .replace(
      /(password|senha|secret|token|authorization|cookie)\s*[:=]\s*([^\s,;]+)/gi,
      '$1=[redacted]'
    );
};

// Percorre objetos/arrays recursivamente para sanitizar estruturas de log.
const sanitizeLogData = (data) => {
  if (data instanceof Error) {
    return redactSensitiveText(data.message);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  if (data && typeof data === 'object') {
    return Object.entries(data).reduce((safeData, [key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        safeData[key] = REDACTED;
      } else if (IDENTITY_KEY_PATTERN.test(key)) {
        safeData[key] = maskIdentity(value);
      } else {
        safeData[key] = sanitizeLogData(value);
      }

      return safeData;
    }, {});
  }

  if (typeof data === 'string') {
    return redactSensitiveText(data);
  }

  return data;
};

// Wrappers de log garantem que todo detalhe passe pelo sanitizador.
const logInfo = (message, details) => {
  if (details === undefined) {
    console.log(message);
    return;
  }

  console.log(message, sanitizeLogData(details));
};

const logWarn = (message, details) => {
  if (details === undefined) {
    console.warn(message);
    return;
  }

  console.warn(message, sanitizeLogData(details));
};

const logError = (message, error) => {
  if (error === undefined) {
    console.error(message);
    return;
  }

  console.error(message, sanitizeLogData(error));
};

// Permite restringir CORS por CORS_ORIGIN; sem configuracao mantem compatibilidade.
const buildCorsOptions = () => {
  const allowedOrigins = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem nao permitida pelo CORS'));
    },
  };
};

// Headers simples que reduzem exposicao de detalhes e cache de respostas da API.
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
};

module.exports = {
  buildCorsOptions,
  logError,
  logInfo,
  logWarn,
  maskIdentity,
  securityHeaders,
};
