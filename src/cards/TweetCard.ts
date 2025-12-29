import { Buffer } from 'node:buffer';
import { createCanvas } from '@napi-rs/canvas';
import { X_ICON } from '../constants/svgs.js';
import { loadSvg, injectFill, readSvgFile } from '../utils/assets.js';
import { loadImageSafe, formatCount, wrapText } from '../utils/canvas.js';
import { CardStats } from '../types.js';

export interface TweetCardOptions {
  user: { displayName: string; username: string };
  message: string;
  stats: CardStats;
  verified?: boolean;
  avatar?: string;
  timestamp?: string;
  fontBold?: string;
  fontRegular?: string;
  width?: number;
}

export class TweetCard {
  private opts: Required<TweetCardOptions>;

  constructor(options: TweetCardOptions) {
    const required: (keyof TweetCardOptions)[] = ['user', 'message', 'stats'];
    const missing = required.filter(key => !options || !options[key]);

    if (missing.length > 0) {
      const errorMsg = `[ZarCanvas] ⚠️ TweetCard Error: Missing required values: ${missing.join(', ')}.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.opts = {
      user: options.user,
      message: options.message,
      stats: options.stats,
      verified: options.verified ?? true,
      avatar: options.avatar ?? 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png',
      timestamp: options.timestamp ?? '1h',
      fontBold: options.fontBold ?? 'Chirp Bold',
      fontRegular: options.fontRegular ?? 'Chirp Regular',
      width: options.width ?? 800
    };
  }

  async build(): Promise<Buffer> {
    const { width, message, fontBold, fontRegular, user, timestamp, stats, verified, avatar } = this.opts;
    const colors = { bg: '#000', text: '#fff', sub: '#8493a2' };
    const PADDING = 20, AV_SIZE = 48, CONTENT_X = PADDING + AV_SIZE + 15;

    const tempCanvas = createCanvas(1, 1);
    const tCtx = tempCanvas.getContext('2d');
    tCtx.font = `16px "${fontRegular}"`;
    const lines = wrapText(tCtx, message, width - CONTENT_X - PADDING);
    const h = Math.max(PADDING * 3 + AV_SIZE + 40, PADDING * 3 + (lines.length * 24) + 60);

    const canvas = createCanvas(width, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, h);

    const [avImg, vIcon, repIcon, retIcon, likIcon, anIcon, optIcon] = await Promise.all([
      loadImageSafe(avatar),
      loadSvg(X_ICON.VERIFIED, true),
      loadSvg(injectFill(readSvgFile(X_ICON.REPLY), colors.sub)),
      loadSvg(injectFill(readSvgFile(X_ICON.RETWEET), colors.sub)),
      loadSvg(injectFill(readSvgFile(X_ICON.LIKE), colors.sub)),
      loadSvg(injectFill(readSvgFile(X_ICON.ANALYTICS), colors.sub)),
      loadSvg(injectFill(readSvgFile(X_ICON.OPTIONS), colors.text))
    ]);

    // Name (Bold)
    ctx.fillStyle = colors.text;
    ctx.font = `16px "${fontBold}"`;
    ctx.fillText(user.displayName, CONTENT_X, PADDING + 15);
    const nw = ctx.measureText(user.displayName).width;

    if (verified && vIcon) (ctx as any).drawImage(vIcon, CONTENT_X + nw + 5, PADDING, 18, 18);

    // Handle & Time (Regular)
    ctx.fillStyle = colors.sub;
    ctx.font = `16px "${fontRegular}"`;
    const handleText = `@${user.username} · ${timestamp}`;
    ctx.fillText(handleText, CONTENT_X + ((verified && vIcon) ? nw + 28 : nw + 5), PADDING + 15);

    if (optIcon) (ctx as any).drawImage(optIcon, width - PADDING - 20, PADDING, 20, 20);

    // Body (Regular)
    ctx.fillStyle = colors.text;
    ctx.font = `16px "${fontRegular}"`;
    lines.forEach((line, i) => ctx.fillText(line, CONTENT_X, PADDING + 45 + i * 24));

    // Stats
    const rowY = h - PADDING - 10;
    let sx = CONTENT_X;
    const drawStat = (icon: any, val: any) => {
      if (icon) (ctx as any).drawImage(icon, sx, rowY - 18, 18, 18);
      ctx.fillStyle = colors.sub;
      ctx.font = `14px "${fontRegular}"`;
      const txt = formatCount(val);
      ctx.fillText(txt, sx + 25, rowY - 2);
      sx += ctx.measureText(txt).width + 60;
    };

    drawStat(repIcon, stats.replies);
    drawStat(retIcon, stats.retweets);
    drawStat(likIcon, stats.likes);
    drawStat(anIcon, stats.views);

    if (avImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(PADDING + AV_SIZE / 2, PADDING + AV_SIZE / 2, AV_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      (ctx as any).drawImage(avImg, PADDING, PADDING, AV_SIZE, AV_SIZE);
      ctx.restore();
    }

    return canvas.toBuffer('image/png');
  }
}