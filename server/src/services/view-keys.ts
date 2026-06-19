import { randomBytes } from 'node:crypto';

/**
 * Per-(user,lesson) ephemeral AES keys for encrypting page images in transit.
 * A key is minted when the user opens a lesson (/view) and required to fetch
 * pages, so the Network tab only ever sees ciphertext. In-memory + sliding TTL
 * (move to Redis if we ever run multiple API instances).
 */
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours, refreshed on each page fetch
const store = new Map<string, { key: Buffer; expiresAt: number }>();

const keyOf = (userId: string, lessonId: string) => `${userId}:${lessonId}`;

export function issueViewKey(userId: string, lessonId: string): Buffer {
  const key = randomBytes(32);
  store.set(keyOf(userId, lessonId), { key, expiresAt: Date.now() + TTL_MS });
  return key;
}

export function getViewKey(userId: string, lessonId: string): Buffer | null {
  const entry = store.get(keyOf(userId, lessonId));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(keyOf(userId, lessonId));
    return null;
  }
  entry.expiresAt = Date.now() + TTL_MS; // sliding window while actively reading
  return entry.key;
}
