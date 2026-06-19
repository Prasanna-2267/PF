import type { Request, RequestHandler, Response } from 'express';
import { authConfig } from '../../config/auth.js';
import { HttpError } from '../../middleware/error.js';
import * as authService from './auth.service.js';
import { googleSchema, loginSchema, signupSchema, verifyOtpSchema } from './auth.validation.js';
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

function setSignupCookie(res: Response, token: string): void {
  res.cookie(authConfig.signupCookieName, token, {
    ...authConfig.cookie,
    maxAge: authConfig.signupTtlSec * 1000,
  });
}

function signupToken(req: Request): string | undefined {
  return req.cookies?.[authConfig.signupCookieName] as string | undefined;
}

export const signup: RequestHandler = async (req, res) => {
  const input = signupSchema.parse(req.body);
  const { signupToken: token } = await authService.signup(input);
  setSignupCookie(res, token);
  res.status(201).json({ message: 'Verification code sent to your email' });
};

export const resendOtp: RequestHandler = async (req, res) => {
  res.json(await authService.resendOtp(signupToken(req)));
};

export const verifyOtp: RequestHandler = async (req, res) => {
  const { code } = verifyOtpSchema.parse(req.body);
  const { user, tokens } = await authService.verifyOtp(signupToken(req), code, reqMeta(req));
  res.clearCookie(authConfig.signupCookieName, { path: authConfig.cookie.path });
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user, accessToken: tokens.accessToken });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, reqMeta(req));

  if (result.status === 'unverified') {
    setSignupCookie(res, result.signupToken);
    res.status(403).json({ error: 'Email not verified. We sent you a new verification code.' });
    return;
  }

  setRefreshCookie(res, result.tokens.refreshToken);
  res.json({ user: result.user, accessToken: result.tokens.accessToken });
};

export const google: RequestHandler = async (req, res) => {
  const { credential } = googleSchema.parse(req.body);
  const { user, tokens } = await authService.googleLogin(credential, reqMeta(req));
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
