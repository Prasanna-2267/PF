import type { RequestHandler } from 'express';
import { verifyAccessToken, type AccessPayload } from '../modules/auth/auth.tokens.js';
import { SessionModel } from '../modules/auth/session.model.js';
import { HttpError } from './error.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

/**
 * Require a valid access token AND a live session for the token's device.
 * The session check is what enforces single-device: when the user logs in
 * elsewhere, this device's session is gone and the request is rejected.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  void (async () => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new HttpError(401, 'Authentication required');
      }
      let payload: AccessPayload;
      try {
        payload = verifyAccessToken(header.slice(7));
      } catch {
        throw new HttpError(401, 'Invalid or expired token');
      }

      const session = await SessionModel.exists({
        userId: payload.sub,
        deviceId: payload.deviceId,
      });
      if (!session) {
        throw new HttpError(401, 'Signed out (logged in on another device)');
      }

      req.auth = payload;
      next();
    } catch (err) {
      next(err);
    }
  })();
};
