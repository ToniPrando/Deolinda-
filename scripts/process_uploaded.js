import sharp from 'sharp';
import fs from 'fs';

async function processOriginalUploadedLogo(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Exact chroma background removal for pure transparent output
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    const minColor = Math.min(r, g, b);

    // If pure or near white background
    if (minColor > 240 && brightness > 242) {
      data[i + 3] = 0; // 100% transparent
    } else if (minColor > 210 && brightness > 220) {
      // Linear antialiasing edge transition
      const alpha = ((255 - brightness) / 35) * 255;
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
  .png({ quality: 100 })
  .toFile(outputPath);

  console.log(`Saved exact transparent logo at: ${outputPath}`);
}

async function run() {
  const file1 = './src/assets/images/toniaep_uploaded_1787499547116.jpg';
  const file2 = './src/assets/images/toniaep_transparent_logo_1787499323605.jpg';
  
  const target = fs.existsSync(file1) ? file1 : file2;
  await processOriginalUploadedLogo(target, './src/assets/images/toniaep_original_transparent.png');
}

run().catch(console.error);
