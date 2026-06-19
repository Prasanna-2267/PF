import * as mupdf from 'mupdf';
import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';

const SCALE = 2; // render at 2x for readable, screenshot-resistant resolution

/**
 * Render a single PDF page to a PNG with a per-user watermark baked into the
 * pixels (not a removable overlay). The raw PDF never leaves the server.
 */
export async function renderWatermarkedPage(
  pdf: Buffer,
  pageNumber: number, // 1-based
  watermarkLines: string[],
): Promise<Buffer> {
  const doc = mupdf.Document.openDocument(new Uint8Array(pdf), 'application/pdf');
  const page = doc.loadPage(pageNumber - 1);
  const pixmap = page.toPixmap(mupdf.Matrix.scale(SCALE, SCALE), mupdf.ColorSpace.DeviceRGB, false);
  const basePng = Buffer.from(pixmap.asPNG());

  const img = await loadImage(basePng);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  drawWatermark(ctx, img.width, img.height, watermarkLines);

  return canvas.toBuffer('image/png');
}

/** Tiled, diagonal, semi-transparent watermark covering the whole page. */
function drawWatermark(ctx: SKRSContext2D, width: number, height: number, lines: string[]): void {
  const text = lines.filter(Boolean).join('   •   ');
  if (!text) return;

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#b91c1c';
  const fontSize = Math.max(13, Math.round(width / 48));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const diag = Math.ceil(Math.sqrt(width * width + height * height));
  const stepY = fontSize * 7;
  const stepX = ctx.measureText(text).width + fontSize * 6;
  for (let y = -diag; y <= diag; y += stepY) {
    for (let x = -diag; x <= diag; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}
