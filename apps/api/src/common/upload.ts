import path from 'node:path';
import multer from 'multer';
import { uploadDir } from './runtime-storage.js';

const datasetUploadMaxBytes = Number(process.env.DATASET_UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024 * 1024);

export const uploadSingleFile = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: {
    fileSize: datasetUploadMaxBytes,
  },
}).single('file');

export const uploadDatasetFiles = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: {
    fileSize: datasetUploadMaxBytes,
    files: 1000,
  },
}).array('files', 1000);
