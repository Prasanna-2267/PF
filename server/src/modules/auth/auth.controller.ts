import type { Request, RequestHandler, Response } from 'express';
import { authConfig } from '../../config/auth.js';
import { HttpError } from '../../middleware/error.js';
import * as authService from './auth.service.js';
import { loginSchema, resendOtpSchema, signupSchema, verifyOtpSchema } from './auth.validation.js';
import { UserModel } from './user.model.js';

function reqMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(authConfig.refreshCookieName, token, {
    ...authConfig.cookie,
    maxAge: authConfig.refreshTtlSec * 1000,
  });
}

export const signup: RequestHandler = async (req, res) => {
  const input = signupSchema.parse(req.body);
  res.status(201).json(await authService.signup(input));
};

export const resendOtp: RequestHandler = async (req, res) => {
  const { email } = resendOtpSchema.parse(req.body);
  res.json(await authService.resendOtp(email));
};

export const verifyOtp: RequestHandler = async (req, res) => {
  const { email, code } = verifyOtpSchema.parse(req.body);
  const { user, tokens } = await authService.verifyOtp(email, code, reqMeta(req));
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user, accessToken: tokens.accessToken });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(email, password, reqMeta(req));
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user, accessToken: tokens.accessToken });
};

export const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies?.[authConfig.refreshCookieName] as string | undefined;
  const { accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
};

export const logout: RequestHandler = async (req, res) => {
  if (req.auth) await authService.logout(req.auth.sub, req.auth.deviceId);
  res.clearCookie(authConfig.refreshCookieName, { path: authConfig.cookie.path });
  res.json({ message: 'Logged out' });
};

export const me: RequestHandler = async (req, res) => {
  const user = await UserModel.findById(req.auth!.sub);
  if (!user) throw new HttpError(404, 'Account not found');
  res.json({ user: authService.publicUser(user) });
};
