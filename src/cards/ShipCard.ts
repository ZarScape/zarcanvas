import { Buffer } from 'node:buffer';
import { createCanvas } from '@napi-rs/canvas';
import { SHIP_ICON } from '../constants/svgs.js';
import { loadSvg } from '../utils/assets.js';
import { loadImageSafe, drawRoundRect, drawAvatar } from '../utils/canvas.js';

export interface ShipCardOptions {
  avatar1?: string;
  avatar2?: string;
  background?: string;
  percentage?: number;
  font?: string;
}

export class ShipCard {
  private opts: ShipCardOptions;

  constructor(options?: ShipCardOptions) {
    this.opts = {
      font: 'Plus Jakarta Sans',
      background: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/background-image.png',
      ...options
    };
  }

  setAvatar1(url: string) { this.opts.avatar1 = url; return this; }
  setAvatar2(url: string) { this.opts.avatar2 = url; return this; }
  setBackground(url: string) { this.opts.background = url; return this; }
  setPercentage(p: number) { this.opts.percentage = p; return this; }

  async build(): Promise<Buffer> {
    const required: (keyof ShipCardOptions)[] = ['avatar1', 'avatar2', 'percentage'];
    const missing = required.filter(key => this.opts[key] === undefined || this.opts[key] === null);

    if (missing.length > 0) {
      const errorMsg = `[ZarCanvas] ⚠️ ShipCard Error: Missing required values: ${missing.join(', ')}.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const W = 800, H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const fontStack = this.opts.font!;

    const [bgImg, heartImg, av1, av2] = await Promise.all([
      loadImageSafe(this.opts.background),
      loadSvg(SHIP_ICON.HEART, true),
      loadImageSafe(this.opts.avatar1),
      loadImageSafe(this.opts.avatar2)
    ]);

    ctx.save();
    drawRoundRect(ctx, 0, 0, W, H, 25);
    ctx.clip();
    if (bgImg) (ctx as any).drawImage(bgImg, 0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    drawRoundRect(ctx, 10, 10, W - 20, H - 20, 25);
    ctx.strokeStyle = '#007FFF';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    await drawAvatar(ctx, av1, W / 4, H / 2, 75, '#FF8C00');
    await drawAvatar(ctx, av2, (W * 3) / 4, H / 2, 75, '#00BFFF');

    if (heartImg) (ctx as any).drawImage(heartImg, (W - 180) / 2, (H - 180) / 2, 180, 180);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 50px ${fontStack}`;
    ctx.fillText(`${this.opts.percentage}%`, W / 2, H / 2 - 9);

    return canvas.toBuffer('image/png');
  }
}