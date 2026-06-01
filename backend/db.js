const path = require('path');
const sql = require('mssql');

require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const requiredEnv = ['DB_USER', 'DB_PASS', 'DB_SERVER', 'DB_NAME'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length) {
  throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missingEnv.join(', ')}`);
}

const bool = (value, fallback) =>
  value === undefined
    ? fallback
    : ['true', '1', 'yes', 'sim'].includes(String(value).trim().toLowerCase());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: bool(process.env.DB_ENCRYPT, false),
    trustServerCertificate: bool(process.env.DB_TRUST_CERT, true),
  },
};

const query = async (text, params = {}) => {
  const request = (await sql.connect(dbConfig)).request();

  Object.entries(params).forEach(([name, [type, value]]) =>
    request.input(name, type, value)
  );

  return (await request.query(text)).recordset;
};

module.exports = { dbConfig, query, sql };
