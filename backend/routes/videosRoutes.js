const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { query, sql } = require('../db');
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const publicRootDir = path.join(__dirname, '..', '..');
const videosCursosDir = path.join(publicRootDir, 'videos_cursos');
const MAX_MP4_SIZE = 100 * 1024 * 1024;

// Mantem a troca de video alinhada com o upload de novos videos por modulo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MP4_SIZE },
});

const requireAdmin = (req, res, next) => {
  if (req.authUser?.isAdmin) return next();

  return res.status(403).json({ error: 'Apenas administradores podem gerenciar videos.' });
};

const uploadMp4 = (req, res, next) => {
  upload.single('mp4')(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Video maior que o limite de 100MB.'
        : 'Erro ao enviar MP4.';

    return res.status(400).json({ error: message });
  });
};

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

const parseVideoPayload = (body) => {
  if (body?.video && typeof body.video === 'object') {
    return body.video;
  }

  if (typeof body?.video === 'string') {
    const video = body.video.trim();

    if (video.startsWith('{')) {
      try {
        return JSON.parse(video);
      } catch {
        return {};
      }
    }

    return { titulo: video };
  }

  return body || {};
};

const normalizePathParts = (value) =>
  String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => path.basename(part.trim()))
    .filter((part) => part && part !== '.' && part !== '..');

const sanitizeFolderName = (value) =>
  String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');

const sanitizeVideoFileName = (fileName) => {
  const baseName = path.parse(String(fileName || 'video')).name;
  const safeName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${safeName || 'video'}.mp4`;
};

const isMp4 = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimetype = String(file.mimetype || '').toLowerCase();

  return (
    extension === '.mp4' &&
    ['video/mp4', 'application/mp4', 'application/octet-stream'].includes(mimetype)
  );
};

const getUniqueFileName = async (directory, fileName) => {
  const parsed = path.parse(fileName);
  let nextFileName = fileName;
  let counter = 2;

  while (true) {
    try {
      await fs.promises.access(path.join(directory, nextFileName));
      nextFileName = `${parsed.name}-${counter}${parsed.ext}`;
      counter += 1;
    } catch {
      return nextFileName;
    }
  }
};

const getModuloFolderName = (video) => {
  const caminhoParts = normalizePathParts(video.modulo_caminho);

  return caminhoParts[caminhoParts.length - 1] || sanitizeFolderName(video.modulo_titulo);
};

const buildVideoDirectory = (video) => {
  const coursePathParts = normalizePathParts(video.curso_caminho);
  const moduloFolder = video.id_modulo ? getModuloFolderName(video) : '';

  if (!coursePathParts.length || (video.id_modulo && !moduloFolder)) return null;

  const relativeParts = moduloFolder ? [...coursePathParts, moduloFolder] : coursePathParts;

  return {
    fullPath: path.join(videosCursosDir, ...relativeParts),
    relativeParts,
  };
};

const isExternalVideoUrl = (url) => /^https?:\/\//i.test(String(url || ''));

const removeLocalVideoFile = async (video, fileName) => {
  const safeFileName = path.basename(String(fileName || ''));
  const directory = buildVideoDirectory(video);

  if (!safeFileName || !directory || isExternalVideoUrl(video.url)) return;

  await fs.promises.unlink(path.join(directory.fullPath, safeFileName)).catch(() => undefined);
};

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

router.put(
  '/videos/:id',
  requireAdmin,
  uploadMp4,
  asyncRoute('Erro ao atualizar video', async (req, res) => {
    const idVideo = Number(req.params.id);

    if (!Number.isInteger(idVideo) || idVideo <= 0) {
      return res.status(400).json({ error: 'ID do video invalido.' });
    }

    if (req.file && !isMp4(req.file)) {
      return res.status(400).json({ error: 'Envie um arquivo MP4 valido.' });
    }

    const [videoAtual] = await query(
      `SELECT
         v.id,
         v.id_curso,
         v.id_modulo,
         v.titulo,
         v.descricao,
         v.url,
         c.caminho AS curso_caminho,
         m.titulo AS modulo_titulo,
         m.caminho AS modulo_caminho
       FROM video v
       INNER JOIN cursos c ON c.id = v.id_curso
       LEFT JOIN modulos m ON m.id = v.id_modulo
       WHERE v.id = @id`,
      {
        id: [sql.Int, idVideo],
      }
    );

    if (!videoAtual) {
      return res.status(404).json({ error: 'Video nao encontrado.' });
    }

    const videoPayload = parseVideoPayload(req.body);
    const titulo = String(videoPayload.titulo || videoAtual.titulo || '').trim();

    if (!titulo) {
      return res.status(400).json({ error: 'Titulo do video e obrigatorio.' });
    }

    const hasDescricao = Object.prototype.hasOwnProperty.call(videoPayload, 'descricao');
    const descricao = hasDescricao
      ? String(videoPayload.descricao || '').trim() || titulo
      : titulo;
    let nextUrl = null;
    let nextVideoPath = null;

    if (req.file) {
      const directory = buildVideoDirectory(videoAtual);

      if (!directory) {
        return res.status(400).json({ error: 'Caminho do curso ou modulo invalido.' });
      }

      await fs.promises.mkdir(directory.fullPath, { recursive: true });

      const fileName = await getUniqueFileName(
        directory.fullPath,
        // Usa o titulo editado para manter o nome do arquivo legivel no disco.
        sanitizeVideoFileName(`${titulo}.mp4`)
      );
      nextVideoPath = path.join(directory.fullPath, fileName);
      nextUrl = `/${[...directory.relativeParts, fileName].join('/')}`;
      await fs.promises.writeFile(nextVideoPath, req.file.buffer);
    }

    try {
      const params = {
        id: [sql.Int, idVideo],
        titulo: [sql.NVarChar(255), titulo],
        descricao: [sql.NVarChar(500), descricao],
      };
      let updateSql = `UPDATE video
        SET titulo = @titulo, descricao = @descricao
        OUTPUT INSERTED.id, INSERTED.id_curso, INSERTED.id_modulo, INSERTED.titulo, INSERTED.descricao, INSERTED.url
        WHERE id = @id`;

      if (nextUrl) {
        params.url = [sql.NVarChar(500), nextUrl];
        updateSql = `UPDATE video
          SET titulo = @titulo, descricao = @descricao, url = @url
          OUTPUT INSERTED.id, INSERTED.id_curso, INSERTED.id_modulo, INSERTED.titulo, INSERTED.descricao, INSERTED.url
          WHERE id = @id`;
      }

      const [videoAtualizado] = await query(updateSql, params);

      if (!videoAtualizado) {
        if (nextVideoPath) await fs.promises.unlink(nextVideoPath).catch(() => undefined);
        return res.status(404).json({ error: 'Video nao encontrado.' });
      }

      if (nextUrl) {
        const oldFileName = path.basename(String(videoAtual.url || ''));
        const nextFileName = path.basename(nextUrl);

        if (oldFileName && oldFileName !== nextFileName) {
          await removeLocalVideoFile(videoAtual, oldFileName);
        }
      }

      return res.json({
        message: 'Video atualizado com sucesso.',
        video: videoAtualizado,
      });
    } catch (error) {
      if (nextVideoPath) await fs.promises.unlink(nextVideoPath).catch(() => undefined);
      throw error;
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
