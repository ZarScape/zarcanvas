import { Buffer } from 'node:buffer';
import { createCanvas } from '@napi-rs/canvas';
import { loadImageSafe, drawRoundRect, truncateText } from '../utils/canvas.js';

export interface MusicCardOptions {
  albumArt: string;
  artistName: string;
  trackName: string;
  backgroundColor: string;
  gradientColor: string;
  progressBar?: number; // 0 to 100
  progressTime?: string;
  progressBarColor?: string | string[]; // Hex string or array for gradients
  trackNameColor?: string;
  artistNameColor?: string;
  progressTimeColor?: string;
  trackFont?: string;
  artistFont?: string;
}

export class MusicCard {
  private opts: MusicCardOptions;

  constructor(options: MusicCardOptions) {
    const required: (keyof MusicCardOptions)[] = [
      'albumArt',
      'artistName',
      'trackName',
      'backgroundColor',
      'gradientColor'
    ];
    
    const missing = required.filter(key => !options[key]);

    if (missing.length > 0) {
      const errorMsg = `[ZarCanvas] ⚠️ MusicCard Error: Missing required values: ${missing.join(', ')}.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.opts = {
      ...options,
      progressBarColor: options.progressBarColor ?? '#000000',
      trackFont: options.trackFont ?? 'Inter',
      artistFont: options.artistFont ?? 'Inter',
      trackNameColor: options.trackNameColor ?? '#000000',
      artistNameColor: options.artistNameColor ?? '#555555',
      progressTimeColor: options.progressTimeColor ?? '#777777'
    };
  }

  async build(): Promise<Buffer> {
    const scale = 2;
    const [width, height] = [800, 250];
    const canvas = createCanvas(width * scale, height * scale);
    const ctx = canvas.getContext('2d');

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;

    // Background
    ctx.fillStyle = this.opts.backgroundColor;
    drawRoundRect(ctx, 0, 0, width, height, 60);
    ctx.fill();

    // Decorative Glow
    const glow = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, width * 0.7);
    glow.addColorStop(0, this.opts.gradientColor);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    drawRoundRect(ctx, 0, 0, width, height, 60);
    ctx.clip();
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Album Art
    const artSize = 210, artPadding = 20;
    const artImg = await loadImageSafe(this.opts.albumArt);
    if (artImg) {
      ctx.save();
      drawRoundRect(ctx, artPadding, artPadding, artSize, artSize, 40);
      ctx.clip();
      (ctx as any).drawImage(artImg, artPadding, artPadding, artSize, artSize);
      ctx.restore();
    }

    const hasProgress = this.opts.progressBar !== undefined || (!!this.opts.progressTime);
    const textX = artPadding + artSize + 35;
    const maxTextWidth = width - textX - 40;
    const trackFont = this.opts.trackFont!;
    const artistFont = this.opts.artistFont!;

    let trackY = hasProgress ? 85 : height / 2 - 15;
    let artistY = hasProgress ? 130 : height / 2 + 35;
    let progressY = 185, timeY = 220;

    ctx.textBaseline = 'middle';
    
    // Track Name
    ctx.fillStyle = this.opts.trackNameColor!;
    const displayTrack = truncateText(ctx, this.opts.trackName, maxTextWidth, `bold 46px "${trackFont}"`);
    ctx.font = `bold 46px "${trackFont}"`;
    ctx.fillText(displayTrack, textX, trackY);

    // Artist Name
    ctx.fillStyle = this.opts.artistNameColor!;
    const displayArtist = truncateText(ctx, this.opts.artistName, maxTextWidth, `28px "${artistFont}"`);
    ctx.font = `28px "${artistFont}"`;
    ctx.fillText(displayArtist, textX, artistY);

    // Progress Bar
    if (this.opts.progressBar !== undefined && hasProgress) {
      const barWidth = width - textX - 60;
      const progressPercent = Math.max(0, Math.min(1, this.opts.progressBar / 100));
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      drawRoundRect(ctx, textX, progressY - 5, barWidth, 10, 5);
      ctx.fill();

      const fillWidth = barWidth * progressPercent;
      if (fillWidth > 0) {
        if (Array.isArray(this.opts.progressBarColor)) {
          const grd = ctx.createLinearGradient(textX, 0, textX + fillWidth, 0);
          const colors = this.opts.progressBarColor;
          colors.forEach((c, i) => grd.addColorStop(i / (colors.length - 1 || 1), c));
          ctx.fillStyle = grd;
        } else {
          ctx.fillStyle = (this.opts.progressBarColor as string) || '#000000';
        }
        drawRoundRect(ctx, textX, progressY - 5, Math.max(10, fillWidth), 10, 5);
        ctx.fill();
      }
    }

    // Progress Time
    if (this.opts.progressTime && hasProgress) {
      ctx.fillStyle = this.opts.progressTimeColor!;
      ctx.font = `20px "${artistFont}"`;
      ctx.fillText(this.opts.progressTime, textX, timeY);
    }

    return canvas.toBuffer('image/png');
  }
}