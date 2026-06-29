const express = require('express');
const path = require('path'); // Necessario para montar URLs publicas de arquivos locais.

const { query } = require('../db'); // Necessario para consultar o SQL Server.
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const cursoFields = 'id, titulo, caminho, icon, caminho_icon';

// Monta a URL publica do icone sem expor caminhos internos do banco.
const withIcon = (curso) => ({
  ...curso,
  icon_url: curso.icon
    ? `/icons_cursos/${path.basename(String(curso.icon))}`
    : curso.caminho_icon || null,
});


router.get(
  '/cursos',
  asyncRoute('Erro ao buscar cursos', async (req, res) => {
    try {
      const cursos = await query(`SELECT ${cursoFields} FROM cursos`);
      res.json(cursos.map(withIcon));
    } catch (error) {
      console.log(error);
    }

  })
);



module.exports = router;
