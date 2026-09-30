import sharp from 'sharp';
import fs from 'fs';

// Accurate SVG recreation of the user's attached 'DEOLINDA' rustic logo
// Color: #254E38 (rustic Neapolitan dark green) and responsive currentColor support
export const deolindaLogotypeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 140" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
  <defs>
    <filter id="deolinda-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <g stroke-width="4.5" stroke="#2D5A40" fill="none" class="deolinda-brand-letters">
    <!-- Letter D -->
    <path d="M 40 38 L 40 118" />
    <path d="M 40 38 C 70 36, 85 52, 85 78 C 85 104, 70 118, 40 118" stroke-width="4.8" />

    <!-- Letter E -->
    <path d="M 112 38 L 112 118" />
    <path d="M 112 40 C 122 39, 136 38, 148 40" stroke-width="4.2" />
    <path d="M 98 77 C 105 74, 110 74, 114 77 C 118 80, 126 80, 135 77 C 141 75, 146 76, 150 78" stroke-width="4" />
    <path d="M 112 117 C 122 118, 136 118, 148 116" stroke-width="4.2" />

    <!-- Letter O -->
    <path d="M 195 38 C 172 38, 156 56, 156 78 C 156 102, 172 118, 195 118 C 218 118, 234 102, 234 78 C 234 56, 218 38, 195 38 Z" stroke-width="4.8" />

    <!-- Letter L -->
    <path d="M 256 38 L 256 118" />
    <path d="M 256 117 C 265 118, 276 118, 286 115" stroke-width="4.5" />

    <!-- Letter Í with authentic pingo -->
    <path d="M 308 42 L 308 118" />
    <!-- Authentic circular pingo / droplet -->
    <circle cx="308" cy="24" r="6" fill="#2D5A40" stroke="none" />

    <!-- Letter N -->
    <path d="M 334 38 L 334 118" />
    <path d="M 335 44 L 378 114" stroke-width="5" />
    <path d="M 378 38 L 378 118" />

    <!-- Letter D -->
    <path d="M 402 38 L 402 118" />
    <path d="M 402 38 C 430 36, 444 52, 444 78 C 444 104, 430 118, 402 118" stroke-width="4.8" />

    <!-- Letter A as Upright Pizza Slice (Apex at top, crust at bottom, crossbar & toppings) -->
    <!-- Outer pizza slice triangle (A shape) -->
    <path d="M 485 36 L 456 116 Q 485 123 514 116 Z" stroke-width="4.8" />
    <!-- Pizza crust rim line at bottom -->
    <path d="M 460 108 Q 485 115 510 108" stroke-width="3.6" />
    <!-- Horizontal Crossbar of the A (melted mozzarella / slice divider) -->
    <path d="M 467 82 L 503 82" stroke-width="4.2" />
    <!-- A inner eye (negative space of letter A) -->
    <path d="M 485 58 L 476 76 L 494 76 Z" stroke-width="2.8" />

    <!-- Topping Pepperoni / Olive Dots inside the slice -->
    <circle cx="485" cy="50" r="3.8" fill="#2D5A40" stroke="none" />
    <circle cx="474" cy="95" r="4.2" fill="#2D5A40" stroke="none" />
    <circle cx="496" cy="95" r="4.2" fill="#2D5A40" stroke="none" />
  </g>
</svg>`;

async function generateAssets() {
  // Write SVG files
  fs.writeFileSync('./public/deolinda_lettering.svg', deolindaLogotypeSvg);
  fs.writeFileSync('./src/assets/images/deolinda_lettering.svg', deolindaLogotypeSvg);

  // Generate PNG version matching user's filename with high DPI for crisp retina display
  const pngBuffer = await sharp(Buffer.from(deolindaLogotypeSvg), { density: 300 })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync('./public/Captura_de_tela_2026-09-28_102904-removebg-preview.png', pngBuffer);
  fs.writeFileSync('./public/deolinda_lettering.png', pngBuffer);
  fs.writeFileSync('./src/assets/images/deolinda_lettering.png', pngBuffer);

  // Also create a version with warm golden cream color for dark backgrounds (#FAF7F2 / #E5A93C)
  const lightSvg = deolindaLogotypeSvg
    .replace(/#2D5A40/g, '#FAF7F2')
    .replace(/stroke="currentColor"/g, 'stroke="#FAF7F2"');
  fs.writeFileSync('./public/deolinda_lettering_light.svg', lightSvg);

  console.log('Successfully created Deolinda lettering SVG and PNG assets!');
}

generateAssets().catch(console.error);
