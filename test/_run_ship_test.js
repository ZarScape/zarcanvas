import { ShipCard } from '../dist/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runShipTests() {
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('--- Starting ShipCard Tests ---');

  try {
    const card = new ShipCard()
      .setAvatar1('https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png')
      .setAvatar2('https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png')
      .setPercentage(95);

    const buffer = await card.build();
    fs.writeFileSync(path.join(imagesDir, 'ship-card.png'), buffer);
    console.log('✅ Ship Card Success');
  } catch (err) {
    console.error('❌ Ship Test Error:', err.message);
  }
}

runShipTests();