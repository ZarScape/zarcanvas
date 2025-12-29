import { Buffer } from 'node:buffer';
import { CanvasRenderingContext2D, loadImage, Image, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Registers all fonts from the local fonts directory.
 */
export function registerFonts(customDir?: string): void {
  const pathsToTry = [];
  
  if (customDir) pathsToTry.push(path.resolve(customDir));
  
  pathsToTry.push(path.resolve('fonts'));
  
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    pathsToTry.push(path.resolve(__dirname, '..', 'fonts'));
    pathsToTry.push(path.resolve(__dirname, '..', '..', 'fonts'));
  } catch {}

  let foundDir = '';
  for (const p of pathsToTry) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      foundDir = p;
      break;
    }
  }

  if (!foundDir) return;

  const fontFiles = fs.readdirSync(foundDir);
  
  fontFiles.forEach(file => {
    const fullPath = path.join(foundDir, file);
    const lowFile = file.toLowerCase();
    
    if (lowFile.includes('instagramsansheadline')) {
      GlobalFonts.registerFromPath(fullPath, 'Instagram Sans Headline');
    } else if (lowFile.includes('instagramsans')) {
      GlobalFonts.registerFromPath(fullPath, 'Instagram Sans');
    } else if (lowFile.includes('plusjakartasans')) {
      GlobalFonts.registerFromPath(fullPath, 'Plus Jakarta Sans');
    } else if (lowFile.includes('knewave')) {
      GlobalFonts.registerFromPath(fullPath, 'Knewave');
    } else if (lowFile.includes('unkempt')) {
      GlobalFonts.registerFromPath(fullPath, 'Unkempt');
    } else if (lowFile.includes('chirpbold')) {
      GlobalFonts.registerFromPath(fullPath, 'Chirp Bold');
    } else if (lowFile.includes('chirpregular')) {
      GlobalFonts.registerFromPath(fullPath, 'Chirp Regular');
    } else if (lowFile.includes('inter')) {
      GlobalFonts.registerFromPath(fullPath, 'Inter');
    }
  });
}

/**
 * Fits text size within a maximum width by reducing font size.
 */
export function fitTextSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  startSize: number,
  pixelLength: number
): { size: number; width: number } {
  let size = startSize || 32;
  ctx.font = `${size}px "${fontFamily}"`;
  let width = ctx.measureText(text).width;
  while (width > pixelLength && size > 8) {
    size--;
    ctx.font = `${size}px "${fontFamily}"`;
    width = ctx.measureText(text).width;
  }
  return { size, width };
}

/**
 * Truncates text with an ellipsis if it exceeds the maximum width.
 */
export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string {
  ctx.font = font;
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  
  const ellipsis = '...';
  let len = text.length;
  while (len > 0 && ctx.measureText(text.substring(0, len) + ellipsis).width > maxWidth) {
    len--;
  }
  return text.substring(0, len) + ellipsis;
}

/**
 * Loads an image from a URL or local file path safely.
 */
export async function loadImageSafe(source?: string): Promise<Image | null> {
  if (!source) return null;
  try {
    if (/^https?:\/\//.test(source)) {
      const res = await fetch(source);
      const arrayBuffer = await res.arrayBuffer();
      return await loadImage(Buffer.from(arrayBuffer));
    }
    return await loadImage(source);
  } catch (err) {
    console.error(`[ZarCanvas] Failed to load image: ${source}`, err);
    return null;
  }
}

/**
 * Draws a rounded rectangle path.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draws a circular avatar with optional border and glow.
 */
export async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: Image | null,
  centerX: number,
  centerY: number,
  radius: number,
  borderColor: string | null = null
): Promise<void> {
  if (!img) return;

  if (borderColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  (ctx as any).drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Formats large numbers into social-media style strings (e.g., 1.2K).
 */
export function formatCount(value: string | number): string {
  if (typeof value === 'string') return value;
  const n = Number(value || 0);
  if (isNaN(n)) return String(value);
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1000000) return Math.round(n / 1000) + 'K';
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

/**
 * Wraps text based on maximum width.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine.trim());
      currentLine = words[i] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());
  return lines;
}

registerFonts();