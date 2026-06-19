import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { authConfig } from '../../config/auth.js';
import { HttpError } from '../../middleware/error.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../../services/mail.js';
import { verifyGoogleIdToken } from '../../services/google.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import {
  hashToken,
  newDeviceId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth.tokens.js';
import { PasswordResetModel } from './password-reset.model.js';
import { PendingRegistrationModel } from './pending-registration.model.js';
import { SessionModel } from './session.model.js';
import { UserModel, type UserDoc } from './user.model.js';
import type { SignupInput } from './auth.validation.js';

type RequestMeta = { ip?: string; userAgent?: string };
type TokenBundle = { accessToken: string; refreshToken: string };

function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function signupExpiry(): Date {
  return new Date(Date.now() + authConfig.signupTtlSec * 1000);
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

/** Single-device: drop the user's other sessions, then create one. */
async function createSession(user: UserDoc, meta: RequestMeta): Promise<TokenBundle> {
  const deviceId = newDeviceId();
  const accessToken = signAccessToken({ sub: user.id as string, role: user.role, deviceId });
  const refreshToken = signRefreshToken({ sub: user.id as string, deviceId });

  await SessionModel.deleteMany({ userId: user.id });
  await SessionModel.create({
    userId: user.id,
    deviceId,
    refreshTokenHash: hashToken(refreshToken),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt: new Date(Date.now() + authConfig.refreshTtlSec * 1000),
  });

  return { accessToken, refreshToken };
}

/**
 * Start signup. No User is created yet — we store a pending registration bound
 * to a fresh session token (returned, to be set as the pf_signup cookie).
 */
export async function signup(input: SignupInput): Promise<{ signupToken: string }> {
  const email = input.email.toLowerCase();
  if (await UserModel.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const code = generateOtp();
  const signupToken = randomUUID();
  await PendingRegistrationModel.create({
    email,
    name: input.name,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    otpHash: await bcrypt.hash(code, 10),
    sessionTokenHash: hashToken(signupToken),
    expiresAt: signupExpiry(),
  });
  await sendOtpEmail(email, code);
  return { signupToken };
}

/** Resend the code for the pending registration tied to this signup session. */
export async function resendOtp(signupToken: string | undefined) {
  const pending = await findPending(signupToken);
  const code = generateOtp();
  pending.otpHash = await bcrypt.hash(code, 10);
  pending.otpAttempts = 0;
  pending.expiresAt = signupExpiry();
  await pending.save();
  await sendOtpEmail(pending.email, code);
  return { message: 'A new code has been sent' };
}

async function findPending(signupToken: string | undefined) {
  if (!signupToken) {
    throw new HttpError(400, 'Your signup session expired. Please sign up or log in again.');
  }
  const pending = await PendingRegistrationModel.findOne({
    sessionTokenHash: hashToken(signupToken),
  });
  if (!pending) {
    throw new HttpError(400, 'Your signup session expired. Please sign up or log in again.');
  }
  return pending;
}

/** Verify the OTP for THIS browser's pending registration, then create the user. */
export async function verifyOtp(signupToken: string | undefined, code: string, meta: RequestMeta) {
  const pending = await findPending(signupToken);

  if (pending.otpAttempts >= authConfig.otpMaxAttempts) {
    await pending.deleteOne();
    throw new HttpError(429, 'Too many attempts. Please sign up again.');
  }

  const matches = await bcrypt.compare(code, pending.otpHash);
  if (!matches) {
    pending.otpAttempts += 1;
    await pending.save();
    throw new HttpError(400, 'Invalid code');
  }

  if (await UserModel.exists({ email: pending.email })) {
    await pending.deleteOne();
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await UserModel.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    emailVerified: true,
  });
  await PendingRegistrationModel.deleteMany({ email: pending.email });

  const tokens = await createSession(user, meta);
  return { user: publicUser(user), tokens };
}

type LoginResult =
  | { status: 'ok'; user: ReturnType<typeof publicUser>; tokens: TokenBundle }
  | { status: 'unverified'; signupToken: string };

export async function login(rawEmail: string, password: string, meta: RequestMeta): Promise<LoginResult> {
  const email = rawEmail.toLowerCase();
  const user = await UserModel.findOne({ email });

  if (user) {
    if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const tokens = await createSession(user, meta);
    return { status: 'ok', user: publicUser(user), tokens };
  }

  // No verified account. If a pending registration matches this password,
  // rebind it to this browser and resend a code (safe: gated by the password).
  const pendings = await PendingRegistrationModel.find({ email });
  for (const pending of pendings) {
    if (await verifyPassword(password, pending.passwordHash)) {
      const code = generateOtp();
      const signupToken = randomUUID();
      pending.otpHash = await bcrypt.hash(code, 10);
      pending.otpAttempts = 0;
      pending.sessionTokenHash = hashToken(signupToken);
      pending.expiresAt = signupExpiry();
      await pending.save();
      await sendOtpEmail(email, code);
      return { status: 'unverified', signupToken };
    }
  }

  throw new HttpError(401, 'Invalid email or password');
}

/** Sign in (or sign up) via a verified Google ID token. */
export async function googleLogin(credential: string, meta: RequestMeta) {
  const profile = await verifyGoogleIdToken(credential);

  let user = await UserModel.findOne({
    $or: [{ googleId: profile.googleId }, { email: profile.email }],
  });

  if (!user) {
    user = await UserModel.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      emailVerified: true, // Google has verified the address
    });
  } else {
    // Link the Google identity to an existing email account on first use.
    let changed = false;
    if (!user.googleId) {
      user.googleId = profile.googleId;
      changed = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      changed = true;
    }
    if (changed) await user.save();
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

/** Always returns success (never reveals whether the email exists). */
export async function forgotPassword(rawEmail: string) {
  const email = rawEmail.toLowerCase();
  const user = await UserModel.findOne({ email });
  if (user?.passwordHash) {
    const code = generateOtp();
    await PasswordResetModel.findOneAndUpdate(
      { email },
      {
        email,
        codeHash: await bcrypt.hash(code, 10),
        attempts: 0,
        expiresAt: new Date(Date.now() + authConfig.passwordResetTtlSec * 1000),
      },
      { upsert: true },
    );
    await sendPasswordResetEmail(email, code);
  }
  return { message: 'If an account exists for that email, a reset code has been sent.' };
}

export async function resetPassword(rawEmail: string, code: string, newPassword: string) {
  const email = rawEmail.toLowerCase();
  const reset = await PasswordResetModel.findOne({ email });
  if (!reset) throw new HttpError(400, 'Invalid or expired reset code');

  if (reset.attempts >= authConfig.otpMaxAttempts) {
    await reset.deleteOne();
    throw new HttpError(429, 'Too many attempts. Please request a new reset code.');
  }

  const matches = await bcrypt.compare(code, reset.codeHash);
  if (!matches) {
    reset.attempts += 1;
    await reset.save();
    throw new HttpError(400, 'Invalid code');
  }

  await reset.deleteOne();
  const user = await UserModel.findOne({ email });
  if (!user) throw new HttpError(400, 'Invalid or expired reset code');

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  // Force re-login everywhere after a password change.
  await SessionModel.deleteMany({ userId: user.id });

  return { message: 'Password updated. Please log in with your new password.' };
}
