import * as mupdf from 'mupdf';
import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';

const SCALE = 2; // render at 2x for readable, screenshot-resistant resolution

/** Best-effort free of a native MuPDF handle — releases WASM memory promptly. */
function free(obj: { destroy?: () => void } | null | undefined): void {
  try {
    obj?.destroy?.();
  } catch {
    // freeing is best-effort; never let cleanup throw
  }
}

/** Storage key for a page's cached BASE render (no watermark). Namespaced by the
 *  immutable per-upload fileKey + scale, so it can never serve a stale page. */
export function basePageKey(fileKey: string, pageNumber: number): string {
  return `rendered/${fileKey}.p${pageNumber}@${SCALE}x.png`;
}

/**
 * Render a single PDF page to a PNG at 2x — NO watermark. This is the expensive
 * step (opens + decodes the whole PDF), so callers cache the result per file+page.
 * MuPDF handles are freed in reverse order so native memory doesn't accumulate.
 */
export function renderBasePage(pdf: Buffer, pageNumber: number): Buffer {
  const doc = mupdf.Document.openDocument(new Uint8Array(pdf), 'application/pdf');
  try {
    const page = doc.loadPage(pageNumber - 1);
    try {
      const pixmap = page.toPixmap(mupdf.Matrix.scale(SCALE, SCALE), mupdf.ColorSpace.DeviceRGB, false);
      try {
        return Buffer.from(pixmap.asPNG());
      } finally {
        free(pixmap);
      }
    } finally {
      free(page);
    }
  } finally {
    free(doc);
  }
}

/**
 * Bake a per-user watermark into a base page PNG. Cheap relative to rendering,
 * and safe to run on a shared cached base since the watermark is applied here.
 */
export async function applyWatermark(basePng: Buffer, watermarkLines: string[]): Promise<Buffer> {
  const img = await loadImage(basePng);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  drawWatermark(ctx, img.width, img.height, watermarkLines);
  return canvas.toBuffer('image/png');
}

/** Heavy tiled, diagonal watermark covering the whole page (rows staggered). */
function drawWatermark(ctx: SKRSContext2D, width: number, height: number, lines: string[]): void {
  const text = lines.filter(Boolean).join('   •   ');
  if (!text) return;

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#9f1239';
  const fontSize = Math.max(14, Math.round(width / 40));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const diag = Math.ceil(Math.sqrt(width * width + height * height));
  const stepY = fontSize * 4.5;
  const stepX = ctx.measureText(text).width + fontSize * 2.5;
  let row = 0;
  for (let y = -diag; y <= diag; y += stepY) {
    const offset = row % 2 === 1 ? stepX / 2 : 0; // stagger alternate rows
    for (let x = -diag - offset; x <= diag; x += stepX) {
      ctx.fillText(text, x + offset, y);
    }
    row += 1;
  }
  ctx.restore();
}
