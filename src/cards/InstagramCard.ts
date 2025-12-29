import { Buffer } from 'node:buffer';
import { createCanvas } from '@napi-rs/canvas';
import { INSTAGRAM_ICON } from '../constants/svgs.js';
import { loadSvg } from '../utils/assets.js';
import { loadImageSafe, formatCount, truncateText } from '../utils/canvas.js';

export interface InstagramCardOptions {
  username: string;
  avatar: string;
  postImage: string;
  likeCount: number;
  postDate?: number | Date;
  verified?: boolean;
  fontName?: string;
}

export class InstagramCard {
  private options: InstagramCardOptions;

  constructor(options: InstagramCardOptions) {
    const required: (keyof InstagramCardOptions)[] = ['username', 'avatar', 'postImage', 'likeCount'];
    const missing = required.filter(key => options[key] === undefined || options[key] === null || options[key] === '');

    if (missing.length > 0) {
      const errorMsg = `[ZarCanvas] ⚠️ InstagramCard Error: Missing required values: ${missing.join(', ')}.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.options = {
      verified: true,
      fontName: 'Instagram Sans',
      ...options,
      postDate: options.postDate ?? Date.now()
    };
  }

  private timeAgo(date: number | Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const intervals: Record<string, number> = {
      year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60
    };
    for (const [name, val] of Object.entries(intervals)) {
      const count = Math.floor(seconds / val);
      if (count >= 1) return `${count} ${name}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  }

  async generate(): Promise<Buffer> {
    const { username, avatar, postImage, likeCount, postDate, verified, fontName } = this.options;
    const canvas = createCanvas(1080, 1450);
    const ctx = canvas.getContext('2d');
    const FONT = fontName!;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const [
      ringImg, likeImg, commentImg, shareImg, saveImg, optionsImg, verifiedImg,
      postImg, avatarImg
    ] = await Promise.all([
      loadSvg(INSTAGRAM_ICON.STORY_RING, true),
      loadSvg(INSTAGRAM_ICON.LIKE, true),
      loadSvg(INSTAGRAM_ICON.COMMENT, true),
      loadSvg(INSTAGRAM_ICON.SHARE, true),
      loadSvg(INSTAGRAM_ICON.SAVE, true),
      loadSvg(INSTAGRAM_ICON.OPTIONS, true),
      loadSvg(INSTAGRAM_ICON.VERIFIED, true),
      loadImageSafe(postImage),
      loadImageSafe(avatar)
    ]);

    if (!postImg) throw new Error('InstagramCard: Failed to load post image');
    if (!avatarImg) throw new Error('InstagramCard: Failed to load avatar image');

    (ctx as any).drawImage(postImg, 0, 170, 1080, 980);

    ctx.fillStyle = '#fff';
    const displayUser = truncateText(ctx, username, 600, `bold 50px ${FONT}`);
    ctx.font = `bold 50px ${FONT}`;
    ctx.fillText(displayUser, 155, 105);

    if (verified && verifiedImg) {
      const tw = ctx.measureText(displayUser).width;
      (ctx as any).drawImage(verifiedImg, 155 + tw + 15, 60, 55, 55);
    }

    if (optionsImg) (ctx as any).drawImage(optionsImg, canvas.width - 95, 65, 60, 60);

    const iconY = canvas.height - 265;
    const iconSize = 80;
    if (likeImg) (ctx as any).drawImage(likeImg, 40, iconY - 5, iconSize, iconSize);
    if (commentImg) (ctx as any).drawImage(commentImg, 145, iconY - 5, iconSize, iconSize);
    if (shareImg) (ctx as any).drawImage(shareImg, 250, iconY - 5, iconSize, iconSize);
    if (saveImg) (ctx as any).drawImage(saveImg, canvas.width - 120, iconY - 5, iconSize, iconSize);

    ctx.font = `bold 45px ${FONT}`;
    ctx.fillText(`${formatCount(likeCount)} likes`, 50, canvas.height - 120);

    ctx.fillStyle = '#afafaf';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(this.timeAgo(postDate!), 50, canvas.height - 65);

    const avX = 80, avY = 87, avR = 50;
    if (ringImg) (ctx as any).drawImage(ringImg, avX - 55, avY - 55, 110, 110);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.clip();
    (ctx as any).drawImage(avatarImg, avX - 52.5, avY - 52.5, 105, 105);
    ctx.restore();

    return canvas.toBuffer('image/png');
  }
}