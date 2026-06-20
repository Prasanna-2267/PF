import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Private object storage for lesson PDFs. The raw file is NEVER served to
 * clients — only watermarked page images are. Backed by Cloudflare R2 when its
 * env is configured, otherwise local disk for development.
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

function isNotFound(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === 'NotFound' || e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404;
}

class R2Storage implements Storage {
  private readonly client: S3Client;
  constructor(
    private readonly bucket: string,
    config: { endpoint: string; accessKeyId: string; secretAccessKey: string },
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      forcePathStyle: true,
    });
  }

  async put(key: string, body: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }
}

function createStorage(): Storage {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT } = env;
  if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && (R2_ENDPOINT || R2_ACCOUNT_ID)) {
    const endpoint = R2_ENDPOINT ?? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    logger.info({ bucket: R2_BUCKET }, 'Storage backend: Cloudflare R2');
    return new R2Storage(R2_BUCKET, {
      endpoint,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    });
  }

  const dir = resolve(env.STORAGE_DIR ?? 'storage');
  logger.info({ dir }, 'Storage backend: local disk');
  return new LocalStorage(dir);
}

export const storage = createStorage();
