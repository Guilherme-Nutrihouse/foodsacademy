const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { query, sql } = require('../db');
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const publicRootDir = path.join(__dirname, '..', '..');
const videosCursosDir = path.join(publicRootDir, 'videos_cursos');
const databaseModuloRoot = 'F:\\Nutrihouse-Universidade';
const MAX_MP4_SIZE = 100 * 1024 * 1024;

// Mantem o upload em memoria para seguir o mesmo padrao das demais rotas de envio.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MP4_SIZE },
});

const requireAdmin = (req, res, next) => {
  if (req.authUser?.isAdmin) return next();

  return res.status(403).json({ error: 'Apenas administradores podem criar modulos.' });
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

const isMp4 = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimetype = String(file.mimetype || '').toLowerCase();

  return (
    extension === '.mp4' &&
    ['video/mp4', 'application/mp4', 'application/octet-stream'].includes(mimetype)
  );
};

const parseModuloPayload = (body) => {
  if (body?.modulo && typeof body.modulo === 'object') {
    return body.modulo;
  }

  return body || {};
};

// Aceita tanto campos soltos quanto um campo video em JSON no multipart/form-data.
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

// Evita sobrescrever MP4 existente dentro da pasta do modulo.
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

const getModuloFolderName = (modulo) => {
  const caminhoParts = normalizePathParts(modulo.caminho);

  return caminhoParts[caminhoParts.length - 1] || sanitizeFolderName(modulo.titulo);
};

// Monta o caminho fisico e a URL gravada conforme os campos da tabela dbo.video.
const buildVideoPath = (cursoCaminho, modulo, fileName) => {
  const coursePathParts = normalizePathParts(cursoCaminho);
  const moduloFolder = getModuloFolderName(modulo);

  if (!coursePathParts.length || !moduloFolder) return null;

  return {
    fullPath: path.join(videosCursosDir, ...coursePathParts, moduloFolder, fileName),
    storedUrl: `/${[...coursePathParts, moduloFolder, fileName].join('/')}`,
  };
};

const buildModuloPath = (cursoCaminho, moduloTitulo) => {
  const coursePathParts = normalizePathParts(cursoCaminho);
  const moduloFolder = sanitizeFolderName(moduloTitulo);

  if (!coursePathParts.length || !moduloFolder) return null;

  return {
    folderName: moduloFolder,
    fullPath: path.join(videosCursosDir, ...coursePathParts, moduloFolder),
    storedPath: path.win32.join(databaseModuloRoot, ...coursePathParts, moduloFolder),
  };
};

router.post(
  '/modulos/:id_curso',
  requireAdmin,
  asyncRoute('Erro ao adicionar novo modulo', async (req, res) => {
    const idCurso = Number(req.params.id_curso);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({ error: 'ID do curso invalido.' });
    }

    const modulo = parseModuloPayload(req.body);
    const titulo = String(modulo.titulo || '').trim();
    const descricao = String(modulo.descricao || '').trim();

    if (!titulo) {
      return res.status(400).json({ error: 'Titulo do modulo e obrigatorio.' });
    }

    const [curso] = await query('SELECT id, titulo, caminho FROM cursos WHERE id = @id', {
      id: [sql.Int, idCurso],
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso nao encontrado.' });
    }

    const moduloPath = buildModuloPath(curso.caminho, titulo);

    if (!moduloPath) {
      return res.status(400).json({ error: 'Caminho do curso ou modulo invalido.' });
    }

    const idCursoParams = {
      id_curso: [sql.Int, idCurso],
    };
    const [moduloExistente] = await query(
      'SELECT id FROM modulos WHERE id_curso = @id_curso AND (titulo = @titulo OR caminho = @caminho OR caminho = @folderName)',
      {
        ...idCursoParams,
        titulo: [sql.NVarChar(150), titulo],
        caminho: [sql.NVarChar(255), moduloPath.storedPath],
        folderName: [sql.NVarChar(150), moduloPath.folderName],
      }
    );

    if (moduloExistente) {
      return res.status(400).json({ error: 'Modulo ja cadastrado para este curso.' });
    }

    const [ordemAtual] = await query(
      'SELECT ISNULL(MAX(ordem), 0) + 1 AS proximaOrdem FROM modulos WHERE id_curso = @id_curso',
      idCursoParams
    );
    const ordem = Number(ordemAtual?.proximaOrdem || 1);
    const dirAlreadyExists = await fs.promises
      .access(moduloPath.fullPath)
      .then(() => true)
      .catch(() => false);

    try {
      await fs.promises.mkdir(moduloPath.fullPath, { recursive: true });

      const createdFolder = await fs.promises.stat(moduloPath.fullPath);
      if (!createdFolder.isDirectory()) {
        throw new Error('Pasta do modulo nao foi criada.');
      }

      const [moduloCriado] = await query(
        `INSERT INTO modulos (id_curso, titulo, descricao, ordem, caminho)
         OUTPUT INSERTED.id, INSERTED.id_curso, INSERTED.titulo, INSERTED.descricao, INSERTED.ordem, INSERTED.caminho
         VALUES (@id_curso, @titulo, @descricao, @ordem, @caminho)`,
        {
          ...idCursoParams,
          titulo: [sql.NVarChar(150), titulo],
          descricao: [sql.NVarChar(150), descricao || titulo],
          ordem: [sql.Int, ordem],
          caminho: [sql.NVarChar(255), moduloPath.storedPath],
        }
      );

      return res.status(201).json({
        message: 'Modulo criado com sucesso.',
        modulo: moduloCriado,
      });
    } catch (error) {
      if (!dirAlreadyExists) {
        await fs.promises.rm(moduloPath.fullPath, { recursive: true, force: true }).catch(() => undefined);
      }

      throw error;
    }
  })
);

// Insere um novo video usando somente o id_modulo e preenche id_curso a partir do modulo.
const postVideoByModulo = asyncRoute('Erro ao adicionar novo video', async (req, res) => {
  const idModulo = Number(req.params.id_modulo);

  if (!Number.isInteger(idModulo) || idModulo <= 0) {
    return res.status(400).json({ error: 'ID do modulo invalido.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Video MP4 nao enviado.' });
  }

  if (!isMp4(req.file)) {
    return res.status(400).json({ error: 'Envie um arquivo MP4 valido.' });
  }

  const [modulo] = await query(
    `SELECT
       m.id,
       m.id_curso,
       m.titulo,
       m.caminho,
       c.caminho AS curso_caminho
     FROM modulos m
     INNER JOIN cursos c ON c.id = m.id_curso
     WHERE m.id = @id_modulo`,
    {
      id_modulo: [sql.Int, idModulo],
    }
  );

  if (!modulo) {
    return res.status(404).json({ error: 'Modulo nao encontrado.' });
  }

  const video = parseVideoPayload(req.body);
  const titulo =
    String(video.titulo || path.parse(req.file.originalname).name).trim() ||
    'Video';
  const moduloFolder = getModuloFolderName(modulo);
  const coursePathParts = normalizePathParts(modulo.curso_caminho);

  if (!coursePathParts.length || !moduloFolder) {
    return res.status(400).json({ error: 'Caminho do curso ou modulo invalido.' });
  }

  const moduloDir = path.join(videosCursosDir, ...coursePathParts, moduloFolder);
  await fs.promises.mkdir(moduloDir, { recursive: true });

  const fileName = await getUniqueFileName(
    moduloDir,
    // Usa o titulo do campo UTF-8 porque originalname pode chegar com encoding incorreto.
    sanitizeVideoFileName(`${titulo}.mp4`)
  );
  const videoPath = buildVideoPath(modulo.curso_caminho, modulo, fileName);

  if (!videoPath) {
    return res.status(400).json({ error: 'Caminho do curso ou modulo invalido.' });
  }

  try {
    await fs.promises.writeFile(videoPath.fullPath, req.file.buffer);

    const [videoCriado] = await query(
      `INSERT INTO video (id_curso, id_modulo, titulo, descricao, url)
       OUTPUT INSERTED.id, INSERTED.id_curso, INSERTED.id_modulo, INSERTED.titulo, INSERTED.descricao, INSERTED.url
       VALUES (@id_curso, @id_modulo, @titulo, @descricao, @url)`,
      {
        id_curso: [sql.Int, modulo.id_curso],
        id_modulo: [sql.Int, idModulo],
        titulo: [sql.NVarChar(255), titulo],
        // A descricao deve ser sempre igual ao titulo do video.
        descricao: [sql.NVarChar(500), titulo],
        url: [sql.NVarChar(500), videoPath.storedUrl],
      }
    );

    return res.status(201).json({
      message: 'Video criado com sucesso.',
      video: videoCriado,
    });
  } catch (error) {
    await fs.promises.unlink(videoPath.fullPath).catch(() => undefined);
    throw error;
  }
});

router.post('/modulos/:id_modulo/videos', requireAdmin, uploadMp4, postVideoByModulo);

module.exports = router;