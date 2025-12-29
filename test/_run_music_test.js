
import { MusicCard } from '../dist/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMusicTests() {
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('--- Starting MusicCard Tests ---');

  // 1. Full Featured Card
  try {
    console.log('Generating Flagship Music Card...');
    const card = new MusicCard({
      trackName: 'MONTAGEM ZAR',
      artistName: 'ZarScape',
      albumArt: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png',
      backgroundColor: '#082131ff',
      gradientColor: '#467ca0ff',
      progressBar: 75,
      progressTime: '2:30 / 3:12',
      trackNameColor: '#bacfddff',
      artistNameColor: '#abc2d1ff',
      progressTimeColor: '#9cb4c4ff',
      progressBarColor: ['#2a4a5aff', '#68b3d8']
    });

    const buffer = await card.build();
    fs.writeFileSync(path.join(imagesDir, 'music-card.png'), buffer);
    console.log('✅ Flagship Music Card Success');
  } catch (err) {
    console.error('❌ Flagship Music Test Error:', err.message);
  }

  // 2. Minimalist Card (No Progress)
  try {
    console.log('Generating Simple Music Card (No Progress)...');
    const simpleCard = new MusicCard({
      trackName: 'MONTAGEM ZAR',
      artistName: 'ZarScape',
      albumArt: 'https://raw.githubusercontent.com/ZarScape/ZarScape/refs/heads/main/images/ZarScape/logo-with-background.png',
      backgroundColor: '#082131ff',
      gradientColor: '#467ca0ff',
      trackNameColor: '#bacfddff',
      artistNameColor: '#abc2d1ff'
    });

    const buffer = await simpleCard.build();
    fs.writeFileSync(path.join(imagesDir, 'minimal-music-card.png'), buffer);
    console.log('✅ Minimal Music Card Success');
  } catch (err) {
    console.error('❌ Minimal Music Test Error:', err.message);
  }
}

runMusicTests();
