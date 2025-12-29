import { InstagramCard } from '../dist/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runInstagramTests() {
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('--- Starting InstagramCard Tests ---');

  // 1. Required Only
  try {
    const card = new InstagramCard({
      username: "ZarScape",
      avatar: "https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png",
      postImage: "https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png",
      likeCount: 4500
    });
    const buffer = await card.generate();
    fs.writeFileSync(path.join(imagesDir, 'minimal-instagram-card.png'), buffer);
    console.log('✅ Instagram Minimal Success');
  } catch (err) {
    console.error('❌ Instagram Minimal Error:', err.message);
  }

  // 2. Full Options
  try {
    const card = new InstagramCard({
      username: "ZarScape",
      avatar: "https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png",
      postImage: "https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png",
      likeCount: 125000,
      verified: true,
      postDate: new Date(Date.now() - 86400000) // 1 day ago
    });
    const buffer = await card.generate();
    fs.writeFileSync(path.join(imagesDir, 'instagram-card.png'), buffer);
    console.log('✅ Instagram Full Success');
  } catch (err) {
    console.error('❌ Instagram Full Error:', err.message);
  }
}

runInstagramTests();