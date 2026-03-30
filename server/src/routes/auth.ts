import { Router } from 'express';
import multer from 'multer';
import { completeSso, forgot, login, me, register, registerAdmin, reset, startSso } from '../controllers/auth.controller.js';
import { submitApplication } from '../controllers/researcher-application.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 3 },
}).fields([
  { name: 'cvFile', maxCount: 1 },
  { name: 'affiliationProofFile', maxCount: 1 },
  { name: 'irbDocumentFile', maxCount: 1 },
]);

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/register-admin', authenticate, authorize('ADMIN'), validateBody(registerSchema), asyncHandler(registerAdmin));
router.post('/register-researcher-application', applicationUpload, asyncHandler(submitApplication));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.get('/sso/:provider/start', asyncHandler(startSso));
router.get('/sso/:provider/callback', asyncHandler(completeSso));
router.get('/sso/:provider', asyncHandler(startSso));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgot));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(reset));
router.get('/me', authenticate, asyncHandler(me));

export default router;
