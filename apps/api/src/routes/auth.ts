import { Router } from 'express';
import multer from 'multer';
import { completeSso, forgot, login, me, register, registerAdmin, reset, startSso } from '../controllers/auth.controller.js';
import { submitApplication } from '../controllers/researcher-application.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { enforceTrustedNetwork } from '../middleware/network-access.js';
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

router.post('/register', asyncHandler(enforceTrustedNetwork), validateBody(registerSchema), asyncHandler(register));
router.post('/register-admin', authenticate, asyncHandler(enforceTrustedNetwork), authorize('ADMIN'), validateBody(registerSchema), asyncHandler(registerAdmin));
router.post('/register-researcher-application', asyncHandler(enforceTrustedNetwork), applicationUpload, asyncHandler(submitApplication));
router.post('/login', asyncHandler(enforceTrustedNetwork), validateBody(loginSchema), asyncHandler(login));
router.get('/sso/:provider/start', asyncHandler(enforceTrustedNetwork), asyncHandler(startSso));
router.get('/sso/:provider/callback', asyncHandler(enforceTrustedNetwork), asyncHandler(completeSso));
router.get('/sso/:provider', asyncHandler(enforceTrustedNetwork), asyncHandler(startSso));
router.post('/forgot-password', asyncHandler(enforceTrustedNetwork), validateBody(forgotPasswordSchema), asyncHandler(forgot));
router.post('/reset-password', asyncHandler(enforceTrustedNetwork), validateBody(resetPasswordSchema), asyncHandler(reset));
router.get('/me', authenticate, asyncHandler(me));

export default router;
