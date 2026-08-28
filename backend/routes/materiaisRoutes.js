const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const { query, sql } = require('../db'); // Necessario para consultar o SQL Server.
const asyncRoute = require('./asyncRoute');

const router = express.Router();
const materialFields = 'id, id_curso, titulo, descricao, caminho, tipo';
const publicRootDir = path.join(__dirname, '..', '..');
const frontendPublicDir = path.join(publicRootDir, 'frontend');
const frontendSrcPublicDir = path.join(publicRootDir, 'frontend-src', 'public');
const videosCursosDir = path.join(publicRootDir, 'videos_cursos');
const MAX_PDF_SIZE = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE },
});

const requireAdmin = (req, res, next) => {
  if (req.authUser?.isAdmin) return next();

  return res.status(403).json({ error: 'Apenas administradores podem enviar materiais.' });
};

const uploadPdf = (req, res, next) => {
  upload.single('pdf')(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'PDF maior que o limite de 25MB.'
        : 'Erro ao enviar PDF.';

    return res.status(400).json({ error: message });
  });
};

const normalizePathParts = (value) =>
  String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => path.basename(part.trim()))
    .filter((part) => part && part !== '.' && part !== '..');

const normalizeName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();

const sanitizeFileName = (fileName) => {
  const baseName = path.parse(String(fileName || 'material')).name;
  const safeName = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${safeName || 'material'}.pdf`;
};

const isPdf = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimetype = String(file.mimetype || '').toLowerCase();

  return (
    extension === '.pdf' &&
    ['application/pdf', 'application/octet-stream'].includes(mimetype)
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

const findCourseFolder = async (curso) => {
  const caminhoParts = normalizePathParts(curso.caminho);
  const baseDir = path.join(videosCursosDir, ...caminhoParts);

  if (caminhoParts.length > 1) return baseDir;

  try {
    const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });
    const courseName = normalizeName(curso.titulo);
    const courseFolder = entries.find(
      (entry) => entry.isDirectory() && normalizeName(entry.name) === courseName
    );

    if (courseFolder) return path.join(baseDir, courseFolder.name);
  } catch {
    return baseDir;
  }

  return baseDir;
};

const getPublicMaterialPath = (filePath) =>
  `/${path.relative(publicRootDir, filePath).replace(/\\/g, '/')}`;

const getSafeStoredPath = (rootDir, relativeValue) => {
  const rootPath = path.resolve(rootDir);
  const filePath = path.resolve(rootPath, relativeValue);
  const relativePath = path.relative(rootPath, filePath);

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return filePath;
};

const getStoredMaterialPaths = (caminho) => {
  const rawValue = String(caminho || '').trim().replace(/\\/g, '/');

  if (!rawValue || /^(https?:)?\/\//i.test(rawValue)) return [];

  let value = rawValue;
  try {
    value = decodeURI(rawValue);
  } catch {
    value = rawValue;
  }

  const relativeValue = value.replace(/^\/+/, '');
  if (!relativeValue) return [];

  const lowerRelativeValue = relativeValue.toLowerCase();
  let rootDirs = [];

  if (lowerRelativeValue.startsWith('videos_cursos/')) {
    rootDirs = [publicRootDir];
  } else if (lowerRelativeValue.startsWith('materiais/')) {
    rootDirs = [frontendPublicDir, frontendSrcPublicDir, publicRootDir];
  }

  return rootDirs.reduce((paths, rootDir) => {
    const filePath = getSafeStoredPath(rootDir, relativeValue);

    if (filePath && !paths.includes(filePath)) {
      paths.push(filePath);
    }

    return paths;
  }, []);
};

const deleteStoredMaterialFiles = async (caminho) => {
  const filePaths = getStoredMaterialPaths(caminho);

  for (const filePath of filePaths) {
    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.isFile()) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
};

router.get(
  '/materiais/:id_curso',
  asyncRoute('Erro ao buscar materiais do curso', async (req, res) => {
    const idCurso = Number(req.params.id_curso);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({ error: 'ID do curso invalido.' });
    }

    const materiais = await query(
      `SELECT ${materialFields} FROM material_apoio WHERE id_curso = @id_curso ORDER BY titulo`,
      {
        id_curso: [sql.Int, idCurso],
      }
    );

    res.json(materiais);
  })
);

router.post(
  '/materiais/:id_curso',
  requireAdmin,
  uploadPdf,
  asyncRoute('Erro ao enviar materiais do curso', async (req, res) => {
    const idCurso = Number(req.params.id_curso);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({ error: 'ID do curso invalido.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'PDF nao enviado.' });
    }

    if (!isPdf(req.file)) {
      return res.status(400).json({ error: 'Envie um arquivo PDF valido.' });
    }

    const [curso] = await query('SELECT id, titulo, caminho FROM cursos WHERE id = @id', {
      id: [sql.Int, idCurso],
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso nao encontrado.' });
    }

    const courseFolder = await findCourseFolder(curso);
    const materiaisDir = path.join(courseFolder, 'Materiais');
    await fs.promises.mkdir(materiaisDir, { recursive: true });

    const fileName = await getUniqueFileName(
      materiaisDir,
      sanitizeFileName(req.file.originalname)
    );
    const filePath = path.join(materiaisDir, fileName);

    try {
      await fs.promises.writeFile(filePath, req.file.buffer);

      const titulo =
        String(req.body.titulo || path.parse(req.file.originalname).name).trim() ||
        'Material de apoio';
      const descricao = String(req.body.descricao || '').trim();
      const caminho = getPublicMaterialPath(filePath);
      const [material] = await query(
        `INSERT INTO material_apoio (id_curso, titulo, descricao, caminho, tipo)
         OUTPUT INSERTED.id, INSERTED.id_curso, INSERTED.titulo, INSERTED.descricao, INSERTED.caminho, INSERTED.tipo
         VALUES (@id_curso, @titulo, @descricao, @caminho, @tipo)`,
        {
          id_curso: [sql.Int, idCurso],
          titulo: [sql.NVarChar(255), titulo],
          descricao: [sql.NVarChar(500), descricao],
          caminho: [sql.NVarChar(500), caminho],
          tipo: [sql.NVarChar(50), 'PDF'],
        }
      );

      res.status(201).json({
        message: 'PDF salvo com sucesso.',
        material,
      });
    } catch (error) {
      await fs.promises.unlink(filePath).catch(() => undefined);
      throw error;
    }
  })
);

router.delete(
  '/materiais/:id_curso/:id_material',
  requireAdmin,
  asyncRoute('Erro ao deletar material do curso', async (req, res) => {
    const idCurso = Number(req.params.id_curso);
    const idMaterial = Number(req.params.id_material);

    if (
      !Number.isInteger(idCurso) ||
      idCurso <= 0 ||
      !Number.isInteger(idMaterial) ||
      idMaterial <= 0
    ) {
      return res.status(400).json({ error: 'IDs do curso ou do material invalidos.' });
    }

    const params = {
      id_curso: [sql.Int, idCurso],
      id_material: [sql.Int, idMaterial],
    };

    const [material] = await query(
      `SELECT ${materialFields}
       FROM material_apoio
       WHERE id_curso = @id_curso AND id = @id_material`,
      params
    );

    if (!material) {
      return res.status(404).json({ error: 'Material nao encontrado.' });
    }

    await deleteStoredMaterialFiles(material.caminho);

    const [materialDeletado] = await query(
      `DELETE FROM material_apoio
       OUTPUT DELETED.id, DELETED.id_curso, DELETED.titulo, DELETED.descricao, DELETED.caminho, DELETED.tipo
       WHERE id_curso = @id_curso AND id = @id_material`,
      params
    );

    res.json({
      message: 'PDF deletado com sucesso.',
      material: materialDeletado || material,
    });
  })
);

module.exports = router;
