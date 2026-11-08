import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
const failures = [];

async function validateReference(file, reference) {
  if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) return;
  const relative = decodeURIComponent(reference.split(/[?#]/)[0]);
  const target = relative.startsWith('/') ? path.join(root, relative.slice(1)) : path.resolve(path.dirname(path.join(root, file)), relative);
  if (!target.startsWith(root)) { failures.push(`${file}: reference escapes the public root: ${reference}`); return; }
  try { await stat(target); } catch { failures.push(`${file}: missing local reference: ${reference}`); }
}

for (const file of pages) {
  const content = await readFile(path.join(root, file), 'utf8');
  for (const match of content.matchAll(/\b(?:src|href|action)=["']([^"']*)["']/gi)) await validateReference(file, match[1]);
}
for (const file of (await readdir(path.join(root, 'css'))).filter(name => name.endsWith('.css'))) {
  const relative = `css/${file}`;
  const content = await readFile(path.join(root, relative), 'utf8');
  for (const match of content.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) await validateReference(relative, match[1]);
}
for (const file of (await readdir(path.join(root, 'js'))).filter(name => name.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'js', file)], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(result.stderr || `Syntax check failed: js/${file}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${pages.length} HTML pages, CSS local references and public JavaScript syntax.`);
