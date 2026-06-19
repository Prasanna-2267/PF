import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import * as authController from './auth.controller.js';

// In-memory rate limiting (sufficient for a single server at current scale;
// swap for a shared store if we ever run multiple instances).
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post('/signup', otpLimiter, asyncHandler(authController.signup));
authRouter.post('/resend-otp', otpLimiter, asyncHandler(authController.resendOtp));
authRouter.post('/verify-otp', otpLimiter, asyncHandler(authController.verifyOtp));
authRouter.post('/login', loginLimiter, asyncHandler(authController.login));
authRouter.post('/google', loginLimiter, asyncHandler(authController.google));
authRouter.post('/forgot-password', otpLimiter, asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', otpLimiter, asyncHandler(authController.resetPassword));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', requireAuth, asyncHandler(authController.logout));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.patch('/phone', requireAuth, asyncHandler(authController.updatePhone));
