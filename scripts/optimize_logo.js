import sharp from 'sharp';
import fs from 'fs';

async function optimizeLogoForWeb() {
  const inputPath = './src/assets/images/toniaep_uploaded_1787499547116.jpg';
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found');
    return;
  }

  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Process pixel-by-pixel for transparent background
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const min = Math.min(r, g, b);
    const avg = (r + g + b) / 3;

    // Detect white/light background with smooth anti-aliased edge
    if (min > 235 && avg > 240) {
      data[i + 3] = 0; // Pure transparent
    } else if (min > 195 && avg > 215) {
      const factor = (avg - 215) / (255 - 215);
      data[i + 3] = Math.round(255 * (1 - factor));
    }
  }

  // Convert raw data to PNG buffer with trim
  const pngBuffer = await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .trim()
  .png()
  .toBuffer();

  // Resize to optimal web resolution (600px width for retina 2x display at ~250px css width)
  await sharp(pngBuffer)
    .resize({ width: 600, withoutEnlargement: true })
    .png({ quality: 90, compressionLevel: 9, effort: 8 })
    .toFile('./src/assets/images/toniaep_logo_web.png');

  // Also create a modern WebP version for maximum speed and small file size
  await sharp(pngBuffer)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toFile('./src/assets/images/toniaep_logo_web.webp');

  const pngStats = fs.statSync('./src/assets/images/toniaep_logo_web.png');
  const webpStats = fs.statSync('./src/assets/images/toniaep_logo_web.webp');
  console.log(`Generated toniaep_logo_web.png: ${(pngStats.size / 1024).toFixed(1)} KB`);
  console.log(`Generated toniaep_logo_web.webp: ${(webpStats.size / 1024).toFixed(1)} KB`);
}

optimizeLogoForWeb().catch(console.error);
