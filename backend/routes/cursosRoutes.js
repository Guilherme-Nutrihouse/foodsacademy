const express = require('express');
const sql = require('mssql');

const { dbConfig } = require('../db');
const { logError } = require('../security');

const router = express.Router();

// Lista os cursos com os campos consumidos pelo frontend.
router.get('/cursos', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query('SELECT id, titulo, caminho, icon, caminho_icon FROM cursos');

    // Converte o retorno do SQL em um contrato de API estavel.
    const cursos = result.recordset.map((curso) => ({
      id: curso.id,
      titulo: curso.titulo,
      caminho: curso.caminho,
      icon: curso.icon,
      caminho_icon: curso.caminho_icon,
      icon_url: curso.icon ? `/icons_cursos/${curso.icon}` : null,
    }));

    res.json(cursos);
  } catch (err) {
    logError('Erro ao buscar cursos', err);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

module.exports = router;
