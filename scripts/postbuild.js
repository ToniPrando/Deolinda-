import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const htaccessSource = path.join(process.cwd(), 'public', '.htaccess');
const htaccessDest = path.join(distDir, '.htaccess');

if (!fs.existsSync(distDir) || !fs.existsSync(indexHtmlPath)) {
  console.log('[Postbuild] dist/ or index.html not found, skipping postbuild.');
  process.exit(0);
}

// 1. Ensure .htaccess is in dist for Apache / LiteSpeed / Hostinger
if (fs.existsSync(htaccessSource)) {
  fs.copyFileSync(htaccessSource, htaccessDest);
  console.log('[Postbuild] Copied .htaccess to dist/.htaccess');
}

// 2. Clean up any route subdirectories in dist/ so Apache mod_dir doesn't cause trailing-slash 301 redirect loops
const routeDirs = [
  'cardapio',
  'cardápio',
  'historia',
  'história',
  'galeria',
  'localizacao',
  'localização',
  'admin'
];

for (const dirName of routeDirs) {
  const targetDir = path.join(distDir, dirName);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log(`[Postbuild] Cleaned route directory dist/${dirName} (handled via .htaccess rewrite)`);
  }
}

console.log('[Postbuild] Postbuild completed successfully.');
