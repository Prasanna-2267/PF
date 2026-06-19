import { randomBytes } from 'node:crypto';

/**
 * Per-(user,lesson) view session: an ephemeral AES key for encrypting page
 * images, plus a forensic `code` that's baked into the page watermark and
 * recorded in the access log — so a leaked page traces to the exact view.
 * In-memory + sliding TTL (move to Redis if we ever run multiple API instances).
 */
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours, refreshed on each page fetch
const store = new Map<string, { key: Buffer; code: string; expiresAt: number }>();

const keyOf = (userId: string, lessonId: string) => `${userId}:${lessonId}`;

export type ViewSession = { key: Buffer; code: string };

export function issueViewSession(userId: string, lessonId: string): ViewSession {
  const key = randomBytes(32);
  const code = randomBytes(5).toString('hex').toUpperCase(); // 10-char forensic ref
  store.set(keyOf(userId, lessonId), { key, code, expiresAt: Date.now() + TTL_MS });
  return { key, code };
}

export function getViewSession(userId: string, lessonId: string): ViewSession | null {
  const entry = store.get(keyOf(userId, lessonId));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(keyOf(userId, lessonId));
    return null;
  }
  entry.expiresAt = Date.now() + TTL_MS; // sliding window while actively reading
  return { key: entry.key, code: entry.code };
}
