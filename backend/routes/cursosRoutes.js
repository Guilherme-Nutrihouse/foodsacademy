const express = require('express');

const { query, sql } = require('../db');
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const cursoFields = 'id, titulo, caminho, icon, caminho_icon';
const withIcon = (curso) => ({
  ...curso,
  icon_url: curso.icon ? `/icons_cursos/${curso.icon}` : null,
});

router.get(
  '/cursos',
  asyncRoute('Erro ao buscar cursos', async (req, res) => {
    const cursos = await query(`SELECT ${cursoFields} FROM cursos`);
    res.json(cursos.map(withIcon));
  })
);

router.get(
  '/materiais/:id',
  asyncRoute('Erro ao buscar materiais', async (req, res) => {
    const materiais = await query(
      `SELECT id, id_curso, titulo, descricao, caminho, tipo
       FROM material_apoio
       WHERE id_curso = @id`,
      { id: [sql.Int, req.params.id] }
    );

    res.json(materiais);
  })
);

module.exports = router;
