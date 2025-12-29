
import { ProfileCard, registerFonts } from '../dist/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runProfileTest() {
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('--- Starting ProfileCard Test ---');
  
  registerFonts();

  try {
    const card = new ProfileCard({
      avatarURL: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png',
      decorationURL: 'https://cdn.discordapp.com/avatar-decoration-presets/a_64c339e0c128dcb279ae201b1190d9d3.png',
      backgroundURL: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/banner-with-text.png',
      userName: 'zarscape',
      userDisplayname: 'ZarScape',
      backgroundBlur: 20,
      usernameColor: '#b8e7ff',
      borderColor: ['#60a5c7', '#193542ff']
    });

    const buffer = await card.build();
    fs.writeFileSync(path.join(imagesDir, 'profile-card.png'), buffer);
    console.log('✅ Profile Card Success (profile-card.png)');
  } catch (err) {
    console.error('❌ Profile Test Error:', err);
  }
}

runProfileTest();
