const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

//////////////////// CONEXAO SQL SERVER ////////////////////
// O backend nao guarda credenciais no codigo; elas devem vir do .env/IIS.
const requiredEnv = ['DB_USER', 'DB_PASS', 'DB_SERVER', 'DB_NAME'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missingEnv.join(', ')}`);
}

// Normaliza flags do .env para booleanos aceitos pela biblioteca mssql.
const toBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'sim'].includes(String(value).trim().toLowerCase());
};

// Configuracao unica usada pelas rotas que precisam consultar o SQL Server.
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: toBoolean(process.env.DB_ENCRYPT, false),
    trustServerCertificate: toBoolean(process.env.DB_TRUST_CERT, true),
  },
};

module.exports = { dbConfig };
