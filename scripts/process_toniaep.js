import sharp from 'sharp';
import fs from 'fs';

async function processExactLogo() {
  // Let's check the images available
  const candidates = [
    './src/assets/images/toniaep_uploaded_1787499547116.jpg',
    './src/assets/images/toniaep_direct_logo_1787499696214.jpg',
    './src/assets/images/toniaep_logo_1787497998481.jpg',
    './src/assets/images/toniaep_transparent_logo_1787499323605.jpg'
  ];

  for (const src of candidates) {
    if (fs.existsSync(src)) {
      console.log(`Processing candidate: ${src}`);
      const image = sharp(src);
      const metadata = await image.metadata();
      console.log(`Dimensions: ${metadata.width}x${metadata.height}`);

      const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const { width, height, channels } = info;

      // Extract background with smooth alpha
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const min = Math.min(r, g, b);
        const avg = (r + g + b) / 3;

        if (min > 235 && avg > 240) {
          data[i + 3] = 0; // Pure transparent
        } else if (min > 195 && avg > 215) {
          const factor = (avg - 215) / (255 - 215);
          data[i + 3] = Math.round(255 * (1 - factor));
        }
      }

      await sharp(data, {
        raw: {
          width,
          height,
          channels: 4
        }
      })
      .trim()
      .png({ quality: 100, compressionLevel: 8 })
      .toFile('./src/assets/images/toniaep_creator_logo.png');

      console.log('Saved to ./src/assets/images/toniaep_creator_logo.png');
      break;
    }
  }
}

processExactLogo().catch(console.error);
