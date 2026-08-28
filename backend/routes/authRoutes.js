const express = require("express");
const ldap = require("ldapjs");

const { logError, logInfo, logWarn } = require("../security");
const {
  clearRememberSessionCookie,
  getAuthenticatedSession,
  setRememberSessionCookie,
} = require("../services/rememberSessionService");

const router = express.Router();
const LDAP_URL = process.env.LDAP_URL;
// Busca apenas atributos seguros usados no perfil e na permissao administrativa.
const LDAP_USER_ATTRIBUTES = [
  "memberOf",
  "displayName",
  "cn",
  "name",
  "givenName",
  "sn",
];
// Permite liberar admins somente por grupos declarados em LDAP_ADMIN_GROUPS.
const ADMIN_GROUP_NAMES = String(process.env.LDAP_ADMIN_GROUPS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

if (!LDAP_URL)
  throw new Error("Variavel de ambiente obrigatoria ausente: LDAP_URL");

router.get("/authenticate", (req, res) =>
  res.status(200).json({ ok: true, service: "foodsacademy-api" }),
);

router.get("/remember-session", (req, res) => {
  const session = getAuthenticatedSession(req);
  if (!session)
    return res.status(401).json({ authenticated: false, remembered: false });

  logInfo("Sessao autenticada validada", { username: session.username });
  res.status(200).json({
    authenticated: true,
    remembered: true,
    username: session.username,
    nomeCompleto: session.nomeCompleto || "",
    isAdmin: session.isAdmin,
  });
});

router.post("/logout", (req, res) => {
  clearRememberSessionCookie(req, res);
  res.status(200).json({ ok: true });
});

const closeLdap = (client) => {
  try {
    client.unbind(
      (err) => err && logWarn("Erro ao encerrar conexao LDAP", err),
    );
  } catch (err) {
    logWarn("Erro ao encerrar conexao LDAP", err);
  }
};

// Usa LDAP_BASE_DN quando existir; caso contrario deriva o base DN pelo dominio do login.
const getLdapBaseDN = (userDN) => {
  const configuredBaseDN = String(process.env.LDAP_BASE_DN || "").trim();
  if (configuredBaseDN) return configuredBaseDN;

  return String(userDN)
    .split("@")[1]
    ?.split(".")
    .filter(Boolean)
    .map((part) => `DC=${part}`)
    .join(",");
};

// Escapa valores usados no filtro LDAP para evitar caracteres especiais na busca.
const escapeLdapFilterValue = (value) =>
  String(value).replace(/[\0()*\\]/g, (char) => {
    const escaped = {
      "\0": "\\00",
      "(": "\\28",
      ")": "\\29",
      "*": "\\2a",
      "\\": "\\5c",
    };
    return escaped[char] || char;
  });


// Normaliza atributos LDAP multivalorados, como memberOf.
const getAttributeValues = (values) =>
  (Array.isArray(values) ? values : [values])
    .filter((value) => value !== undefined && value !== null)
    .map((value) =>
      Buffer.isBuffer(value) ? value.toString("utf8").trim() : String(value).trim(),
    )
    .filter(Boolean);

const getFirstAttributeValue = (values) => getAttributeValues(values)[0] || "";

const getFullName = (user) =>
  [
    user.displayName,
    user.name,
    user.cn,
    [user.givenName, user.sn].filter(Boolean).join(" "),
  ]
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";

// Extrai somente atributos seguros, sem devolver o objeto LDAP completo.
const mapLdapUserAttributes = (entry) => {
  const ldapUser = (entry?.pojo?.attributes || entry?.attributes || []).reduce(
    (user, attr) => {
      const { type, values } = attr.pojo || attr;
      const key = String(type || "").toLowerCase();

      if (key === "memberof") user.memberOf = getAttributeValues(values);
      if (key === "displayname") user.displayName = getFirstAttributeValue(values);
      if (key === "cn") user.cn = getFirstAttributeValue(values);
      if (key === "name") user.name = getFirstAttributeValue(values);
      if (key === "givenname") user.givenName = getFirstAttributeValue(values);
      if (key === "sn") user.sn = getFirstAttributeValue(values);

      return user;
    },
    { memberOf: [] },
  );

  return {
    memberOf: ldapUser.memberOf,
    nomeCompleto: getFullName(ldapUser),
  };
};

// Calcula permissao administrativa apenas pelos grupos LDAP do usuario.
const isLdapAdmin = (ldapUser) => {
  const groups = (Array.isArray(ldapUser.memberOf) ? ldapUser.memberOf : []).map((group) =>
    String(group || "").toLowerCase(),
  );

  return ADMIN_GROUP_NAMES.some((groupName) =>
    groups.some((groupDN) => groupDN.includes(`cn=${groupName},`) || groupDN.includes(groupName)),
  );
};

// Busca atributos do usuario usando a conexao ja autenticada no LDAP.
const getLdapUserAttributes = (client, userDN) =>
  new Promise((resolve) => {
    const baseDN = getLdapBaseDN(userDN);
    const username = String(userDN).split("@")[0];

    if (!baseDN || !username) return resolve({ memberOf: [], nomeCompleto: "" });

    const filter = `(|(userPrincipalName=${escapeLdapFilterValue(userDN)})(sAMAccountName=${escapeLdapFilterValue(username)}))`;
    const options = {
      scope: "sub",
      filter,
      sizeLimit: 1,
      attributes: LDAP_USER_ATTRIBUTES,
    };
    let ldapUser = { memberOf: [], nomeCompleto: "" };
    let done = false;

    const finish = (user) => {
      if (done) return;
      done = true;
      resolve(user);
    };

    // Mantem login valido mesmo se a busca de atributos falhar.
    try {
      client.search(baseDN, options, (err, searchRes) => {
        if (err) {
          logWarn("Falha ao iniciar busca de atributos LDAP", {
            userDN,
            reason: err.message,
          });
          return finish(ldapUser);
        }

        searchRes.on("searchEntry", (entry) => {
          ldapUser = mapLdapUserAttributes(entry);
        });
        searchRes.on("error", (searchErr) => {
          logWarn("Falha na busca de atributos LDAP", {
            userDN,
            reason: searchErr.message,
          });
          finish({ memberOf: [], nomeCompleto: "" });
        });
        searchRes.on("end", () => finish(ldapUser));
      });
    } catch (searchErr) {
      logWarn("Falha inesperada na busca de atributos LDAP", {
        userDN,
        reason: searchErr.message,
      });
      finish(ldapUser);
    }
  });

const ldapAuth = (userDN, password) =>
  new Promise((resolve) => {
    const client = ldap.createClient({
      url: LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000,
    });
    let done = false;

    const finish = (user, err) => {
      if (done) return;
      done = true;
      if (err) logError("Erro de conexao LDAP", err);
      closeLdap(client);
      resolve(user);
    };

    client.on("error", (err) => finish(null, err));
    client.bind(userDN, password, async (err) => {
      if (done) return;

      if (err)
        logWarn("Falha LDAP", { userDN, reason: "credenciais_invalidas" });
      else logInfo("Autenticacao LDAP bem-sucedida", { userDN });

      if (err) return finish(null);

      // Retorna apenas atributos seguros depois que o bind LDAP confirma as credenciais.
      finish(await getLdapUserAttributes(client, userDN));
    });
  });

router.post("/authenticate", async (req, res) => {
  const { userDN = "", password = "", rememberLogin } = req.body || {};
  const normalizedUserDN = String(userDN).trim();

  if (!normalizedUserDN || typeof password !== "string" || !password) {
    logWarn("Tentativa de autenticacao com credenciais invalidas");
    return res.status(400).json({ message: "Credenciais obrigatorias" });
  }

  logInfo("Requisicao recebida em /authenticate", { userDN: normalizedUserDN });

  const ldapUser = await ldapAuth(normalizedUserDN, password);

  if (!ldapUser) {
    logWarn("Falha na autenticacao do usuario", { userDN: normalizedUserDN });
    return res.status(401).json({ message: "Falha na autenticação" });
  }

  const username = normalizedUserDN.split("@")[0];
  // Calcula se o usuario deve enxergar recursos administrativos.
  const isAdmin = isLdapAdmin(ldapUser);
  // Emite sessao assinada para toda autenticacao LDAP valida.
  const nomeCompleto = ldapUser.nomeCompleto || "";
  setRememberSessionCookie(
    req,
    res,
    username,
    rememberLogin === true,
    isAdmin,
    nomeCompleto,
  );

  logInfo("Usuario autenticado", { username, isAdmin });
  res.json({
    message: "Autentica\u00e7\u00e3o bem-sucedida",
    username,
    nomeCompleto,
    isAdmin,
  });
});

module.exports = router;
