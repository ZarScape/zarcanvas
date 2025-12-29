
import { Buffer } from 'node:buffer';
import { loadImage, Image } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads an SVG from a file path or content string into an Image object.
 */
export async function loadSvg(input: string, isPath: boolean = false): Promise<Image | null> {
  try {
    let content = input;
    if (isPath) {
      const resolvedPath = path.resolve(input);
      if (fs.existsSync(resolvedPath)) {
        content = fs.readFileSync(resolvedPath, 'utf-8');
      } else {
        console.warn(`[ZarCanvas] SVG path not found: ${resolvedPath}`);
        return null;
      }
    }

    if (!content || content.trim().length === 0) return null;

    const buffer = Buffer.from(content, 'utf-8');
    return await loadImage(buffer);
  } catch (err) {
    console.error(`[ZarCanvas] Failed to load SVG (isPath: ${isPath})`, err);
    return null;
  }
}

/**
 * Loads SVG content from a file path.
 */
export function readSvgFile(filePath: string): string {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) return '';
    return fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    console.error(`[ZarCanvas] Failed to read SVG file: ${filePath}`, err);
    return '';
  }
}

/**
 * Injects a fill color into an SVG string by wrapping content in a group.
 */
export function injectFill(svgString: string, color: string): string {
  if (!svgString) return '';
  
  const svgMatch = svgString.match(/<svg[^>]*>/i);
  if (!svgMatch) return svgString;

  const openingTag = svgMatch[0];
  const restOfSvg = svgString.slice(openingTag.length).replace(/<\/svg>/i, '');
  
  return `${openingTag}<g fill="${color}">${restOfSvg}</g></svg>`;
}
