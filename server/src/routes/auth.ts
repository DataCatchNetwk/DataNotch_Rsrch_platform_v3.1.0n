import { Router } from 'express';
import { completeSso, forgot, login, me, register, registerAdmin, reset, startSso } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/register-admin', authenticate, authorize('ADMIN'), validateBody(registerSchema), asyncHandler(registerAdmin));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.get('/sso/:provider/start', asyncHandler(startSso));
router.get('/sso/:provider/callback', asyncHandler(completeSso));
router.get('/sso/:provider', asyncHandler(startSso));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgot));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(reset));
router.get('/me', authenticate, asyncHandler(me));

export default router;
