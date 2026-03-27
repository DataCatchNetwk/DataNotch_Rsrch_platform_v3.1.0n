import { Router } from 'express';
import { forgot, login, me, register, reset } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgot));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(reset));
router.get('/me', authenticate, asyncHandler(me));

export default router;
