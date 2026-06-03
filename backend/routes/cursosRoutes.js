const express = require('express');
const path = require('path'); // Necessario para montar URLs publicas dos videos locais.

const { query, sql } = require('../db'); // Necessario para usar parametros tipados no SQL Server.
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const cursoFields = 'id, titulo, caminho, icon, caminho_icon';


router.get(
  '/cursos',
  asyncRoute('Erro ao buscar cursos', async (req, res) => {
    const cursos = await query(`SELECT ${cursoFields} FROM cursos`);
    res.json(cursos.map(withIcon));
  })
);



module.exports = router;
