import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Private object storage for lesson PDFs. The raw file is NEVER served to
 * clients — only watermarked page images are (Phase 3b). Cloudflare R2
 * (S3-compatible) plugs in behind this interface when R2_* env is set.
 */
export interface Storage {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

class LocalStorage implements Storage {
  constructor(private readonly baseDir: string) {}

  private toPath(key: string): string {
    return join(this.baseDir, key);
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.toPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.toPath(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.toPath(key)).catch(() => undefined);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.toPath(key));
      return true;
    } catch {
      return false;
    }
  }
}

function createStorage(): Storage {
  // TODO(Phase 3): when R2_* env is configured, return an S3-compatible R2 store here.
  const dir = resolve(env.STORAGE_DIR ?? 'storage');
  logger.info({ dir }, 'Storage backend: local disk');
  return new LocalStorage(dir);
}

export const storage = createStorage();
