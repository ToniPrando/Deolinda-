import sharp from 'sharp';
import fs from 'fs';

async function makeTransparent(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const minVal = Math.min(r, g, b);
    const avg = (r + g + b) / 3;

    // Detect pure white/off-white background
    if (minVal > 230 && avg > 238) {
      data[i + 3] = 0; // completely transparent
    } else if (minVal > 190 && avg > 210) {
      const alpha = Math.max(0, 255 - ((avg - 210) / 35) * 255);
      data[i + 3] = Math.round(alpha);
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
  .png()
  .toFile(outputPath);

  console.log(`Saved transparent PNG: ${outputPath}`);
}

async function main() {
  await makeTransparent('./src/assets/images/toniaep_transparent_logo_1787499323605.jpg', './src/assets/images/toniaep_logo_transparent.png');
}

main().catch(console.error);
