import type { JwtPayload } from '../utils/jwt.js';

type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      file?: UploadedFile;
    }
  }
}

export {};
