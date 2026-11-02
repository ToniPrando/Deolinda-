import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const htaccessSource = path.join(process.cwd(), 'public', '.htaccess');
const htaccessDest = path.join(distDir, '.htaccess');

if (!fs.existsSync(distDir) || !fs.existsSync(indexHtmlPath)) {
  console.log('[Postbuild] dist/ or index.html not found, skipping route prerender.');
  process.exit(0);
}

// 1. Ensure .htaccess is in dist
if (fs.existsSync(htaccessSource)) {
  fs.copyFileSync(htaccessSource, htaccessDest);
  console.log('[Postbuild] Copied .htaccess to dist/.htaccess');
}

// 2. Generate physical directory fallbacks for all SPA routes
const routes = [
  'cardapio',
  'cardápio',
  'historia',
  'história',
  'galeria',
  'localizacao',
  'localização',
  'admin'
];

const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent);
  console.log(`[Postbuild] Generated fallback ${route}/index.html`);
}

console.log('[Postbuild] All SPA route directories created successfully.');
