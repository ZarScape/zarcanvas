import { TweetCard } from '../dist/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runXTests() {
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('--- Starting TweetCard Tests ---');

  try {
    const card = new TweetCard({
      user: { 
        displayName: 'Muhammad Abuzar', 
        username: 'zarscape' 
      },
      message: 'Testing X (tweet) card using ZarCanvas. Looks awesome! #ZarCanvas #Design #ZarScape',
      verified: true,
      stats: {
        replies: 124,
        retweets: 850,
        likes: '12K',
        views: '250K'
      }
    });

    const buffer = await card.build();
    fs.writeFileSync(path.join(imagesDir, 'tweet-card.png'), buffer);
    console.log('✅ Tweet Card Success (with Chirp fonts)');
  } catch (err) {
    console.error('❌ Tweet Card Error:', err.message);
  }
}

runXTests();