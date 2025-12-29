import { Buffer } from 'node:buffer';
import { createCanvas, Image } from '@napi-rs/canvas';
import { loadImageSafe, fitTextSize } from '../utils/canvas.js';

export interface ProfileCardOptions {
  avatarURL: string;
  decorationURL?: string;
  backgroundURL?: string;
  userName: string;
  userDisplayname?: string;
  backgroundBlur?: number;
  usernameColor?: string;
  borderColor?: string | string[];
  squareAvatar?: boolean;
}

const ASSET_URLS = {
  FRAME_URL: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/Zarco/zarco-bg.png',
};

export class ProfileCard {
  private options: ProfileCardOptions;

  constructor(options: ProfileCardOptions) {
    const required: (keyof ProfileCardOptions)[] = ['avatarURL', 'userName'];
    const missing = required.filter(key => !options || !options[key]);

    if (missing.length > 0) {
      const errorMsg = `[ZarCanvas] ⚠️ ProfileCard Error: Missing required values: ${missing.join(', ')}.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.options = {
      backgroundBlur: 20,
      usernameColor: '#b8e7ff',
      ...options
    };
  }

  private parseHex(hex: string): string {
    if (!hex || typeof hex !== 'string') return '#FFFFFF';
    const cleaned = hex.length === 9 ? hex.slice(0, 7) : hex;
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(cleaned)) return '#FFFFFF';
    return cleaned;
  }

  async build(): Promise<Buffer> {
    const { 
      avatarURL, decorationURL, backgroundURL, userName, 
      userDisplayname, backgroundBlur, usernameColor, 
      borderColor, squareAvatar 
    } = this.options;

    const W = 885;
    const H = 303;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Default userDisplayname to userName if not provided
    const mainName = userDisplayname || userName;

    // 1. CLIP ROUNDED CARD
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, [34]);
    ctx.clip();

    // 2. GENERATE BASE (Background with Blur)
    const baseCanvas = createCanvas(W, H);
    const baseCtx = baseCanvas.getContext('2d');
    
    let bgImg = await loadImageSafe(backgroundURL || avatarURL);
    baseCtx.fillStyle = '#0f1720';
    baseCtx.fillRect(0, 0, W, H);

    if (bgImg) {
      const pct = typeof backgroundBlur === 'number' ? backgroundBlur : 20;
      const pctClamped = Math.max(0, Math.min(100, Math.round(pct)));
      const MAX_BLUR_PX = 40;
      const blurPx = Math.round((pctClamped / 100) * MAX_BLUR_PX);
      baseCtx.filter = `blur(${blurPx}px)`;
      (baseCtx as any).drawImage(bgImg, 0, 0, W, H);
      baseCtx.filter = 'none';
    }

    baseCtx.globalAlpha = 0.18;
    baseCtx.fillStyle = '#111318';
    baseCtx.fillRect(0, 0, W, H);
    baseCtx.globalAlpha = 1;
    ctx.drawImage(baseCanvas, 0, 0);

    // 3. GENERATE FRAME
    const frameCanvas = createCanvas(W, H);
    const frameCtx = frameCanvas.getContext('2d');
    const cardFrame = await loadImageSafe(ASSET_URLS.FRAME_URL);

    if (cardFrame) {
      frameCtx.globalCompositeOperation = 'source-out';
      frameCtx.globalAlpha = 0.5;
      (frameCtx as any).drawImage(cardFrame, 0, 0, W, H);
      frameCtx.globalCompositeOperation = 'source-over';
      frameCtx.globalAlpha = 1;
    } else {
      frameCtx.globalAlpha = 0.5;
      frameCtx.fillStyle = '#000';
      frameCtx.fillRect(0, 0, W, H);
      frameCtx.globalAlpha = 1;
    }
    ctx.drawImage(frameCanvas, 0, 0);

    // 4. GENERATE CONTENT (Text & Avatar)
    const contentCanvas = createCanvas(W, H);
    const contentCtx = contentCanvas.getContext('2d');

    const tagText = `@${userName}`;
    const avatarLeft = 47, avatarTop = 39, avatarSize = 225;
    const textStartX = avatarLeft + avatarSize + 40;
    const maxTextWidth = W - textStartX - 20;

    const avImg = await loadImageSafe(avatarURL);
    contentCtx.save();
    contentCtx.beginPath();
    contentCtx.roundRect(avatarLeft, avatarTop, avatarSize, avatarSize, [squareAvatar ? 30 : 225]);
    contentCtx.clip();
    contentCtx.fillStyle = '#222428';
    contentCtx.fillRect(avatarLeft, avatarTop, avatarSize, avatarSize);
    if (avImg) (contentCtx as any).drawImage(avImg, avatarLeft, avatarTop, avatarSize, avatarSize);
    contentCtx.restore();

    // Decoration
    if (decorationURL) {
      const decImg = await loadImageSafe(decorationURL.replace(/\?size=\d+/, '') + '?size=512');
      if (decImg) {
        const p = 21;
        (contentCtx as any).drawImage(decImg, avatarLeft - p, avatarTop - p, avatarSize + p * 2, avatarSize + p * 2);
      }
    }

    // Name - Strictly using Knewave
    const { size: mainSize } = fitTextSize(contentCtx, mainName, 'Knewave', 64, maxTextWidth);
    contentCtx.font = `${mainSize}px Knewave`;
    contentCtx.fillStyle = this.parseHex(usernameColor!);
    contentCtx.textAlign = 'left';
    contentCtx.textBaseline = 'alphabetic';
    const avatarCenterY = avatarTop + Math.round(avatarSize / 2);
    const mainNameY = avatarCenterY - 8;
    contentCtx.fillText(mainName, textStartX, mainNameY);

    // Tag - Strictly using Unkempt
    const { size: tagSize } = fitTextSize(contentCtx, tagText, 'Unkempt', 36, maxTextWidth);
    contentCtx.font = `${tagSize}px Unkempt`;
    contentCtx.fillStyle = '#FFFFFF';
    contentCtx.fillText(tagText, textStartX, mainNameY + Math.round(tagSize * 1.4));

    // 5. APPLY SHADOW & DRAW CONTENT
    const shadowCanvas = createCanvas(W, H);
    const shadowCtx = shadowCanvas.getContext('2d');
    shadowCtx.filter = 'drop-shadow(0px 6px 8px rgba(0,0,0,0.8))';
    shadowCtx.globalAlpha = 0.4;
    shadowCtx.drawImage(contentCanvas, 0, 0);
    
    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.drawImage(contentCanvas, 0, 0);

    // 6. GENERATE BORDER
    if (borderColor && (typeof borderColor === 'string' || (Array.isArray(borderColor) && borderColor.length > 0))) {
      const borderCanvas = createCanvas(W, H);
      const borderCtx = borderCanvas.getContext('2d');
      
      let colors: string[] = Array.isArray(borderColor) ? borderColor.slice(0, 5) : [borderColor];
      const grd = borderCtx.createLinearGradient(0, 0, W, 0);
      if (colors.length === 1) {
        const c = this.parseHex(colors[0]);
        grd.addColorStop(0, c);
        grd.addColorStop(1, c);
      } else {
        colors.forEach((c, i) => grd.addColorStop(i / (colors.length - 1 || 1), this.parseHex(c)));
      }

      borderCtx.fillStyle = grd;
      borderCtx.fillRect(0, 0, W, H);
      
      borderCtx.globalCompositeOperation = 'destination-out';
      borderCtx.beginPath();
      borderCtx.roundRect(9, 9, W - 18, H - 18, [25]);
      borderCtx.fill();
      
      ctx.drawImage(borderCanvas, 0, 0);
    }

    return canvas.toBuffer('image/png');
  }
}