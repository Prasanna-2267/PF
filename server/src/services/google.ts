import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error.js';

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new HttpError(503, 'Google sign-in is not configured');
  }
  client ??= new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return client;
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

/** Verify a Google ID token (the `credential` from Google Identity Services). */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  const oauth = getClient(); // throws 503 (outside try) when unconfigured

  let payload;
  try {
    const ticket = await oauth.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Invalid Google token');
  }

  if (!payload?.sub || !payload.email) {
    throw new HttpError(401, 'Invalid Google token');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    emailVerified: Boolean(payload.email_verified),
  };
}
