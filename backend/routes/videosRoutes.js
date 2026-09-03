const express = require('express');
const path = require('path');

const { query, sql } = require('../db');
const asyncRoute = require('./asyncRoute');

const router = express.Router();

const publicPath = (...parts) =>
  parts.filter(Boolean).map((part) => path.basename(String(part))).join('/');

const videoUrl = (baseUrl, video, modulo) => {
  if (video.url?.startsWith('http')) return video.url;

  const file = video.url?.includes('.') ? path.basename(video.url) : `${video.titulo}.mp4`;
  return `${baseUrl}/${publicPath(modulo?.caminho, file)}`;
};

const mapVideo = (baseUrl, modulo) => (video) => ({
  id: video.id,
  titulo: video.titulo,
  descricao: video.descricao,
  url: videoUrl(baseUrl, video, modulo),
});

router.get(
  '/videos/:id_curso',
  asyncRoute('Erro ao buscar vídeos do curso', async (req, res) => {
    try {
      const params = { id: [sql.Int, req.params.id_curso] };
      const [curso] = await query('SELECT titulo, caminho FROM cursos WHERE id = @id', params);

      if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });

      const idCurso = { id_curso: [sql.Int, req.params.id_curso] };
      const [modulos, videos] = await Promise.all([
        query(
          `SELECT id, titulo, descricao, caminho, ordem
         FROM modulos
         WHERE id_curso = @id_curso
         ORDER BY ordem`,
          idCurso
        ),
        query(
          `SELECT id, id_modulo, titulo, descricao, url
         FROM video
         WHERE id_curso = @id_curso`,
          idCurso
        ),
      ]);
      const baseUrl = `/videos_cursos/${String(curso.caminho || '').replace(/\\/g, '/').trim()}`;

      if (!modulos.length) {
        return res.json({
          tipo: 'sem_modulos',
          videos: videos.filter((video) => !video.id_modulo).map(mapVideo(baseUrl)),
        });
      }

      res.json({
        tipo: 'com_modulos',
        modulos: modulos.map((modulo) => ({
          id: modulo.id,
          titulo: modulo.titulo,
          descricao: modulo.descricao,
          ordem: modulo.ordem,
          videos: videos
            .filter((video) => video.id_modulo === modulo.id)
            .map(mapVideo(baseUrl, modulo)),
        })),
      });
    } catch (error) {
      console.log(error);
    }

  })
);

router.get(
  '/videos/length/:id_curso',
  asyncRoute('Erro ao buscar quantidade de videos do curso', async (req, res) => {
    const params = { id: [sql.Int, req.params.id_curso] };
    const [curso] = await query('SELECT id FROM cursos WHERE id = @id', params);

    if (!curso) return res.status(404).json({ error: 'Curso nao encontrado' });

    const idCurso = { id_curso: [sql.Int, req.params.id_curso] };
    const [resultado] = await query(
      `SELECT COUNT(*) AS total
       FROM video
       WHERE id_curso = @id_curso`,
      idCurso
    );

    res.json(resultado?.total ?? 0);
  })
);

module.exports = router;
