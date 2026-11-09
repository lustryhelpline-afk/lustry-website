import { readdir, readFile, writeFile, mkdir, rm, lstat, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const preview = process.argv.includes('--preview');
const pages = ['index.html', '404.html', 'about.html', 'cart.html', 'clients.html', 'contact.html', 'custom.html', 'design.html', 'gallery.html', 'product.html', 'shop.html'];
const publicDirectories = {
  css: new Set(['.css']),
  js: new Set(['.js']),
  assets: new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.webm'])
};
let copied = 0;

async function copyPublic(relative, allowedExtensions) {
  const source = path.join(root, relative);
  const stat = await lstat(source);
  if (stat.isSymbolicLink()) throw new Error(`Public assets must not be symbolic links: ${relative}`);
  if (stat.isDirectory()) {
    for (const entry of await readdir(source)) {
      if (entry.startsWith('.')) continue;
      await copyPublic(path.join(relative, entry), allowedExtensions);
    }
    return;
  }
  if (!stat.isFile() || (allowedExtensions && !allowedExtensions.has(path.extname(relative).toLowerCase()))) return;
  await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
  await copyFile(source, path.join(output, relative));
  copied++;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of [...pages, 'robots.txt', 'sitemap.xml', 'favicon.ico', 'favicon-192.png']) await copyPublic(file);
for (const [directory, extensions] of Object.entries(publicDirectories)) await copyPublic(directory, extensions);

// Cloudflare serves this file at the original missing URL, including nested paths.
// Root-relative 404 links work there; the source retains relative GitHub Pages links.
const missingPage = await readFile(path.join(output, '404.html'), 'utf8');
await writeFile(path.join(output, '404.html'), missingPage.replace(/(href|src)="(?![a-z]+:|\/|#)([^"]+)"/gi, '$1="/$2"'));

const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
  "  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  ...(preview ? ['  X-Robots-Tag: noindex, nofollow, noarchive'] : []),
  ''
];
await writeFile(path.join(output, '_headers'), headers.join('\n'));
// With html_handling:none, Workers serves exact filenames; explicitly rewrite
// only the site root to index.html without redirecting existing .html URLs.
await writeFile(path.join(output, '_redirects'), '/ /index.html 200\n');
if (preview) await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Built ${copied} public files into dist/ (${preview ? 'preview; search indexing disabled' : 'production assets'}).`);
