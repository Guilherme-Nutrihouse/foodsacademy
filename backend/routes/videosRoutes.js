const express = require('express');
const path = require('path');
const sql = require('mssql');

const { dbConfig } = require('../db');
const { logError } = require('../security');

const router = express.Router();

// Retorna a estrutura de videos de um curso, com ou sem modulos.
router.get('/videos/:id_curso', async (req, res) => {
  const { id_curso } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    // Primeiro confirma que o curso existe e pega a pasta base dos arquivos.
    const cursoResult = await pool
      .request()
      .input('id', sql.Int, id_curso)
      .query('SELECT titulo, caminho FROM cursos WHERE id = @id');

    if (cursoResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Curso n\u00e3o encontrado' });
    }

    const { caminho } = cursoResult.recordset[0];

    const pastaCurso = String(caminho || '')
      .replace(/\\/g, '/')
      .trim();

    // As URLs publicas sao montadas a partir da pasta cadastrada para o curso.
    const baseURL = `/videos_cursos/${pastaCurso}`;

    // Modulos e videos sao buscados separadamente para montar a hierarquia da resposta.
    const modulosResult = await pool
      .request()
      .input('id_curso', sql.Int, id_curso)
      .query(
        'SELECT id, titulo, descricao, caminho, ordem FROM modulos WHERE id_curso = @id_curso ORDER BY ordem'
      );

    const videosResult = await pool
      .request()
      .input('id_curso', sql.Int, id_curso)
      .query(
        'SELECT id, id_modulo, titulo, descricao, url FROM video WHERE id_curso = @id_curso'
      );

    // Quando ha modulos, cada video e agrupado no modulo correspondente.
    if (modulosResult.recordset.length > 0) {
      const modulos = modulosResult.recordset.map((mod) => {
        const videos = videosResult.recordset
          .filter((v) => v.id_modulo === mod.id)
          .map((v) => {
            let finalUrl = '';

            // Preserva links externos; arquivos locais recebem caminho publico seguro.
            if (v.url && v.url.startsWith('http')) {
              finalUrl = v.url;
            } else if (v.url && v.url.includes('.')) {
              finalUrl = `${baseURL}/${path.basename(mod.caminho)}/${path.basename(v.url)}`;
            } else {
              finalUrl = `${baseURL}/${path.basename(mod.caminho)}/${v.titulo}.mp4`;
            }

            return {
              id: v.id,
              titulo: v.titulo,
              descricao: v.descricao,
              url: finalUrl,
            };
          });

        return {
          id: mod.id,
          titulo: mod.titulo,
          descricao: mod.descricao,
          ordem: mod.ordem,
          videos,
        };
      });

      return res.json({ tipo: 'com_modulos', modulos });
    }

    // Cursos sem modulo retornam uma lista simples de videos.
    const videos = videosResult.recordset
      .filter((v) => !v.id_modulo)
      .map((v) => {
        let finalUrl = '';

        // Mesma regra de URL usada nos videos dentro de modulos.
        if (v.url && v.url.startsWith('http')) {
          finalUrl = v.url;
        } else if (v.url && v.url.includes('.')) {
          finalUrl = `${baseURL}/${path.basename(v.url)}`;
        } else {
          finalUrl = `${baseURL}/${v.titulo}.mp4`;
        }

        return {
          id: v.id,
          titulo: v.titulo,
          descricao: v.descricao,
          url: finalUrl,
        };
      });

    return res.json({ tipo: 'sem_modulos', videos });
  } catch (err) {
    logError('Erro ao buscar videos do curso', err);
    res.status(500).json({ error: 'Erro ao buscar v\u00eddeos do curso' });
  }
});

module.exports = router;
