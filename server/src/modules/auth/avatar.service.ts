import { createCanvas, loadImage } from '@napi-rs/canvas';
import { HttpError } from '../../middleware/error.js';
import { storage } from '../../services/storage.js';
import { UserModel } from './user.model.js';
import { publicUser } from './auth.service.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_SIDE = 200; // px
const MAX_SIDE = 6000; // px — reject before decode
const MAX_PIXELS = 24_000_000; // ~24 MP — decompression-bomb guard
const OUT_SIZE = 512; // stored square size
const keyFor = (userId: string): string => `avatars/${userId}.jpg`;

/**
 * Read pixel dimensions from an image header WITHOUT decoding the bitmap.
 * A ~2 MB file can declare 25000×25000 px (≈2.5 GB decoded) and OOM the single
 * instance, so we reject on declared size before loadImage() allocates anything.
 * Returns null if the header can't be parsed (caller then relies on loadImage).
 */
function probeDimensions(buf: Buffer, mime: string): { w: number; h: number } | null {
  try {
    if (mime === 'image/png') {
      // 8-byte signature, then IHDR: len(4) 'IHDR'(4) width(4) height(4)
      if (buf.length < 24) return null;
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if (mime === 'image/jpeg') {
      let off = 2; // skip SOI
      while (off + 9 < buf.length) {
        if (buf.readUInt8(off) !== 0xff) {
          off += 1;
          continue;
        }
        const marker = buf.readUInt8(off + 1);
        // SOF0–SOF15 carry the frame size (skip DHT/JPG/DAC: C4/C8/CC)
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7) };
        }
        off += 2 + buf.readUInt16BE(off + 2); // skip this segment
      }
      return null;
    }
    if (mime === 'image/webp') {
      if (buf.length < 30 || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
      const fourcc = buf.toString('ascii', 12, 16);
      if (fourcc === 'VP8X') {
        const w = 1 + (buf.readUInt8(24) | (buf.readUInt8(25) << 8) | (buf.readUInt8(26) << 16));
        const h = 1 + (buf.readUInt8(27) | (buf.readUInt8(28) << 8) | (buf.readUInt8(29) << 16));
        return { w, h };
      }
      if (fourcc === 'VP8 ') {
        const w = (buf.readUInt8(26) | (buf.readUInt8(27) << 8)) & 0x3fff;
        const h = (buf.readUInt8(28) | (buf.readUInt8(29) << 8)) & 0x3fff;
        return { w, h };
      }
      if (fourcc === 'VP8L') {
        const b0 = buf.readUInt8(21);
        const b1 = buf.readUInt8(22);
        const b2 = buf.readUInt8(23);
        const b3 = buf.readUInt8(24);
        return {
          w: 1 + (((b1 & 0x3f) << 8) | b0),
          h: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Validate strictly (format, size, min dimensions, sane aspect ratio), then
 * centre-crop to a square and resize to 512×512 JPEG before storing. This
 * normalises every avatar and rejects hostile/oversized uploads.
 */
export async function uploadAvatar(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new HttpError(400, 'Choose an image to upload.');
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new HttpError(400, 'Unsupported format — use a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_BYTES) throw new HttpError(400, 'Image must be 5 MB or smaller.');

  const probed = probeDimensions(file.buffer, file.mimetype);
  if (probed && (probed.w > MAX_SIDE || probed.h > MAX_SIDE || probed.w * probed.h > MAX_PIXELS)) {
    throw new HttpError(400, `Image is too large — max ${MAX_SIDE}×${MAX_SIDE} pixels.`);
  }

  let img;
  try {
    img = await loadImage(file.buffer);
  } catch {
    throw new HttpError(400, 'That image could not be read — try a different file.');
  }

  const w = img.width;
  const h = img.height;
  if (w < MIN_SIDE || h < MIN_SIDE) {
    throw new HttpError(400, `Image must be at least ${MIN_SIDE}×${MIN_SIDE} pixels.`);
  }
  const ratio = w / h;
  if (ratio < 0.5 || ratio > 2) {
    throw new HttpError(400, 'Image is too wide or too tall — use a roughly square photo.');
  }

  const side = Math.min(w, h);
  const canvas = createCanvas(OUT_SIZE, OUT_SIZE);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, OUT_SIZE, OUT_SIZE);
  const out = canvas.toBuffer('image/jpeg', 82);

  await storage.put(keyFor(userId), out, 'image/jpeg');
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { hasAvatar: true, avatarUpdatedAt: new Date() },
    { new: true },
  );
  if (!user) throw new HttpError(404, 'Account not found');
  return publicUser(user);
}

export async function removeAvatar(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'Account not found');
  if (user.hasAvatar) {
    await storage.delete(keyFor(userId)).catch(() => undefined);
    user.hasAvatar = false;
    user.avatarUpdatedAt = new Date();
    await user.save();
  }
  return publicUser(user);
}

/** Bytes for a stored avatar, a redirect to the Google picture, or null (none). */
export async function getAvatar(
  userId: string,
): Promise<{ buffer: Buffer } | { redirect: string } | null> {
  const user = await UserModel.findById(userId).select('hasAvatar googleAvatarUrl').lean();
  if (!user) return null;
  if (user.hasAvatar) {
    try {
      return { buffer: await storage.get(keyFor(userId)) };
    } catch {
      return null;
    }
  }
  if (user.googleAvatarUrl) return { redirect: user.googleAvatarUrl };
  return null;
}
