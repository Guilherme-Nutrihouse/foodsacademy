const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query, sql } = require('../db');
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const cursoFields = 'id, titulo, caminho, icon, caminho_icon';
const publicRootDir = path.join(__dirname, '..', '..');
const videosCursosDir = path.join(publicRootDir, 'videos_cursos');
const iconesDir = path.join(publicRootDir, 'icons_cursos');
const MAX_PNG_SIZE = 25 * 1024 * 1024;
const MAX_ICON_NAME_LENGTH = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PNG_SIZE },
});

const sanitizeCaminho = (titulo) =>
  String(titulo || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const requireAdmin = (req, res, next) => {
  if (req.authUser?.isAdmin) return next();

  return res.status(403).json({ error: 'Apenas administradores podem gerenciar cursos.' });
};

const uploadPng = (req, res, next) => {
  upload.single('png')(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'PNG maior que o limite de 25MB.'
        : 'Erro ao enviar PNG.';

    return res.status(400).json({ error: message });
  });
};

const buildFileName = (name, extension, suffix = '') => {
  const maxBaseLength = Math.max(1, MAX_ICON_NAME_LENGTH - extension.length - suffix.length);
  const safeBase = name.slice(0, maxBaseLength).replace(/[-_]+$/g, '') || 'icon';

  return `${safeBase}${suffix}${extension}`;
};

const sanitizeFileName = (fileName) => {
  const baseName = path.parse(String(fileName || 'icon')).name;
  const safeName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return buildFileName(safeName || 'icon', '.png');
};

const isPng = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimetype = String(file.mimetype || '').toLowerCase();
  const signature = file.buffer?.subarray(0, 8);
  const hasPngSignature =
    signature?.length === 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a;

  return (
    extension === '.png' &&
    ['image/png', 'application/png', 'application/octet-stream'].includes(mimetype) &&
    hasPngSignature
  );
};

const parseCursoPayload = (body) => {
  if (body?.curso && typeof body.curso === 'object') {
    return body.curso;
  }

  if (typeof body?.curso === 'string') {
    const curso = body.curso.trim();

    if (curso.startsWith('{')) {
      try {
        return JSON.parse(curso);
      } catch {
        return {};
      }
    }

    return { titulo: curso };
  }

  return body || {};
};

const getUniqueFileName = async (directory, fileName) => {
  const parsed = path.parse(fileName);
  let nextFileName = fileName;
  let counter = 2;

  while (true) {
    try {
      await fs.promises.access(path.join(directory, nextFileName));
      nextFileName = buildFileName(parsed.name, parsed.ext, `-${counter}`);
      counter += 1;
    } catch {
      return nextFileName;
    }
  }
};

const withIcon = (curso) => ({
  ...curso,
  icon_url: curso.icon
    ? `/icons_cursos/${path.basename(String(curso.icon))}`
    : curso.caminho_icon || null,
});

const removeIconFile = async (fileName) => {
  const safeFileName = path.basename(String(fileName || ''));

  if (!safeFileName) return;

  await fs.promises.unlink(path.join(iconesDir, safeFileName)).catch(() => undefined);
};

router.get(
  '/cursos',
  asyncRoute('Erro ao buscar cursos', async (req, res) => {
    const cursos = await query(`SELECT ${cursoFields} FROM cursos`);
    res.json(cursos.map(withIcon));
  })
);

router.get(
  '/cursos/:id',
  asyncRoute('Erro ao buscar curso', async (req, res) => {
    const idCurso = Number(req.params.id);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({ error: 'ID do curso invalido.' });
    }

    const params = { id: [sql.Int, idCurso] };
    const [curso] = await query(`SELECT titulo FROM cursos WHERE id = @id`, params);

    if (!curso) return res.status(404).json({ error: 'Curso nao encontrado.' });
    res.json(curso);
  })
);

router.post(
  '/cursos',
  requireAdmin,
  uploadPng,
  asyncRoute('Erro ao adicionar novo curso', async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'PNG nao enviado.' });
    }

    if (!isPng(req.file)) {
      return res.status(400).json({ error: 'Envie um arquivo PNG valido.' });
    }

    const curso = parseCursoPayload(req.body);
    const titulo = String(curso.titulo || '').trim();

    if (!titulo) {
      return res.status(400).json({ error: 'Titulo do curso e obrigatorio.' });
    }

    const caminho = sanitizeCaminho(titulo);

    if (!caminho) {
      return res.status(400).json({ error: 'Titulo do curso invalido.' });
    }

    const cursoDir = path.join(videosCursosDir, caminho);
    await fs.promises.mkdir(cursoDir, { recursive: true });

    const fileName = await getUniqueFileName(
      iconesDir,
      sanitizeFileName(req.file.originalname)
    );
    const filePath = path.join(iconesDir, fileName);

    try {
      await fs.promises.writeFile(filePath, req.file.buffer);

      const params = {
        titulo: [sql.NVarChar(150), titulo],
        caminho: [sql.NVarChar(150), caminho],
        icon: [sql.NVarChar(50), fileName],
        caminho_icon: [sql.NVarChar(100), '/icons_cursos'],
      };

      const [cursoCriado] = await query(
        `INSERT INTO cursos (titulo, caminho, icon, caminho_icon)
         OUTPUT INSERTED.id, INSERTED.titulo, INSERTED.caminho, INSERTED.icon, INSERTED.caminho_icon
         VALUES (@titulo, @caminho, @icon, @caminho_icon)`,
        params
      );

      res.status(201).json({
        message: 'Curso criado com sucesso.',
        curso: withIcon(cursoCriado),
      });
    } catch (error) {
      await fs.promises.unlink(filePath).catch(() => undefined);
      throw error;
    }
  })
);

router.put(
  '/cursos/:id',
  requireAdmin,
  uploadPng,
  asyncRoute('Erro ao atualizar curso', async (req, res) => {
    const idCurso = Number(req.params.id);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({ error: 'ID do curso invalido.' });
    }

    if (req.file && !isPng(req.file)) {
      return res.status(400).json({ error: 'Envie um arquivo PNG valido.' });
    }

    const curso = parseCursoPayload(req.body);
    const titulo = String(curso.titulo || '').trim();

    if (!titulo) {
      return res.status(400).json({ error: 'Titulo do curso e obrigatorio.' });
    }

    let nextIcon = null;
    let nextIconPath = null;

    if (req.file) {
      await fs.promises.mkdir(iconesDir, { recursive: true });
      nextIcon = await getUniqueFileName(iconesDir, sanitizeFileName(req.file.originalname));
      nextIconPath = path.join(iconesDir, nextIcon);
      await fs.promises.writeFile(nextIconPath, req.file.buffer);
    }

    try {
      const params = {
        id: [sql.Int, idCurso],
        titulo: [sql.NVarChar(150), titulo],
      };

      let updateSql = `UPDATE cursos
        SET titulo = @titulo
        OUTPUT INSERTED.id, INSERTED.titulo, INSERTED.caminho, INSERTED.icon, INSERTED.caminho_icon, DELETED.icon AS icon_anterior
        WHERE id = @id`;

      if (nextIcon) {
        params.icon = [sql.NVarChar(50), nextIcon];
        params.caminho_icon = [sql.NVarChar(100), '/icons_cursos'];

        // Mantem o caminho do curso para preservar pastas, videos e materiais ja publicados.
        updateSql = `UPDATE cursos
          SET titulo = @titulo, icon = @icon, caminho_icon = @caminho_icon
          OUTPUT INSERTED.id, INSERTED.titulo, INSERTED.caminho, INSERTED.icon, INSERTED.caminho_icon, DELETED.icon AS icon_anterior
          WHERE id = @id`;
      }

      const [cursoAtualizado] = await query(updateSql, params);

      if (!cursoAtualizado) {
        if (nextIconPath) await fs.promises.unlink(nextIconPath).catch(() => undefined);
        return res.status(404).json({ error: 'Curso nao encontrado.' });
      }

      if (nextIcon && cursoAtualizado.icon_anterior !== nextIcon) {
        await removeIconFile(cursoAtualizado.icon_anterior);
      }

      const { icon_anterior, ...cursoResponse } = cursoAtualizado;

      return res.json({
        message: 'Curso atualizado com sucesso.',
        curso: withIcon(cursoResponse),
      });
    } catch (error) {
      if (nextIconPath) await fs.promises.unlink(nextIconPath).catch(() => undefined);
      throw error;
    }
  })
);

module.exports = router;
