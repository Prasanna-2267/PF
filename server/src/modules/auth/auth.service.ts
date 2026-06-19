import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { authConfig } from '../../config/auth.js';
import { HttpError } from '../../middleware/error.js';
import { sendOtpEmail } from '../../services/mail.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import {
  hashToken,
  newDeviceId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth.tokens.js';
import { OtpModel } from './otp.model.js';
import { SessionModel } from './session.model.js';
import { UserModel, type UserDoc } from './user.model.js';
import type { SignupInput } from './auth.validation.js';

type RequestMeta = { ip?: string; userAgent?: string };
type TokenBundle = { accessToken: string; refreshToken: string };

function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function publicUser(user: UserDoc) {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    emailVerified: user.emailVerified,
    activeStageId: user.activeStageId ? String(user.activeStageId) : null,
  };
}

async function issueOtp(email: string): Promise<void> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + authConfig.otpTtlMinutes * 60_000);
  await OtpModel.findOneAndUpdate(
    { email },
    { email, codeHash, attempts: 0, expiresAt, purpose: 'email_verify' },
    { upsert: true },
  );
  await sendOtpEmail(email, code);
}

/** Single-device: drop the user's other sessions, then create one. */
async function createSession(user: UserDoc, meta: RequestMeta): Promise<TokenBundle> {
  const deviceId = newDeviceId();
  const accessToken = signAccessToken({ sub: user.id as string, role: user.role, deviceId });
  const refreshToken = signRefreshToken({ sub: user.id as string, deviceId });
  const expiresAt = new Date(Date.now() + authConfig.refreshTtlSec * 1000);

  await SessionModel.deleteMany({ userId: user.id });
  await SessionModel.create({
    userId: user.id,
    deviceId,
    refreshTokenHash: hashToken(refreshToken),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function signup(input: SignupInput) {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing?.emailVerified) {
    throw new HttpError(409, 'An account with this email already exists');
  }
  const passwordHash = await hashPassword(input.password);

  if (existing) {
    // Unverified account re-registering: refresh details and re-send OTP.
    existing.name = input.name;
    existing.phone = input.phone;
    existing.passwordHash = passwordHash;
    await existing.save();
  } else {
    await UserModel.create({
      name: input.name,
      email,
      phone: input.phone,
      passwordHash,
      emailVerified: false,
    });
  }

  await issueOtp(email);
  return { message: 'Verification code sent to your email' };
}

export async function resendOtp(rawEmail: string) {
  const email = rawEmail.toLowerCase();
  const user = await UserModel.findOne({ email });
  if (!user) throw new HttpError(404, 'No account found for this email');
  if (user.emailVerified) throw new HttpError(400, 'Email is already verified');
  await issueOtp(email);
  return { message: 'Verification code resent' };
}

export async function verifyOtp(rawEmail: string, code: string, meta: RequestMeta) {
  const email = rawEmail.toLowerCase();
  const otp = await OtpModel.findOne({ email });
  if (!otp) throw new HttpError(400, 'No active code. Please request a new one.');

  if (otp.attempts >= authConfig.otpMaxAttempts) {
    await otp.deleteOne();
    throw new HttpError(429, 'Too many attempts. Please request a new code.');
  }

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    otp.attempts += 1;
    await otp.save();
    throw new HttpError(400, 'Invalid code');
  }

  await otp.deleteOne();
  const user = await UserModel.findOne({ email });
  if (!user) throw new HttpError(404, 'Account not found');

  user.emailVerified = true;
  await user.save();

  const tokens = await createSession(user, meta);
  return { user: publicUser(user), tokens };
}

export async function login(rawEmail: string, password: string, meta: RequestMeta) {
  const email = rawEmail.toLowerCase();
  const user = await UserModel.findOne({ email });
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  if (!user.emailVerified) {
    await issueOtp(email);
    throw new HttpError(403, 'Email not verified. We sent you a new verification code.');
  }

  const tokens = await createSession(user, meta);
  return { user: publicUser(user), tokens };
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) throw new HttpError(401, 'Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const session = await SessionModel.findOne({ userId: payload.sub, deviceId: payload.deviceId });
  if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
    throw new HttpError(401, 'Session no longer valid (signed out or logged in elsewhere)');
  }

  const user = await UserModel.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found');

  // Rotate both tokens.
  const accessToken = signAccessToken({
    sub: user.id as string,
    role: user.role,
    deviceId: payload.deviceId,
  });
  const newRefreshToken = signRefreshToken({ sub: user.id as string, deviceId: payload.deviceId });
  session.refreshTokenHash = hashToken(newRefreshToken);
  session.lastActiveAt = new Date();
  await session.save();

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, deviceId: string): Promise<void> {
  await SessionModel.deleteOne({ userId, deviceId });
}
