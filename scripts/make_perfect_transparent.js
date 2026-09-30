import sharp from 'sharp';
import fs from 'fs';

async function perfectTransparency(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Pixel-by-pixel background extraction
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const min = Math.min(r, g, b);
    const avg = (r + g + b) / 3;

    // Detect white/light background
    if (min > 232 && avg > 238) {
      data[i + 3] = 0; // 100% transparent
    } else if (min > 190 && avg > 210) {
      const alpha = ((255 - avg) / 45) * 255;
      data[i + 3] = Math.max(0, Math.min(255, Math.round(alpha)));
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
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Successfully converted ${inputPath} to transparent PNG -> ${outputPath}`);
}

async function main() {
  const files = [
    './src/assets/images/toniaep_direct_logo_1787499696214.jpg',
    './src/assets/images/toniaep_uploaded_1787499547116.jpg',
    './src/assets/images/toniaep_transparent_logo_1787499323605.jpg'
  ];

  for (const f of files) {
    if (fs.existsSync(f)) {
      await perfectTransparency(f, './src/assets/images/toniaep_logo.png');
      break;
    }
  }
}

main().catch(console.error);
