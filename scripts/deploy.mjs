import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deploymentBranch } from './deployment-branch.mjs';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2];
if (!['preview', 'production', 'dry-run', 'local'].includes(mode)) throw new Error('Choose preview, production, dry-run or local mode.');
const branch = deploymentBranch();
const extra = process.argv.slice(3);
if (mode !== 'local' && extra.some(argument => !(['preview', 'production'].includes(mode) && argument === '--dry-run') && !(mode === 'production' && argument === '--approve-production'))) {
  throw new Error('Unsupported release option. Preview accepts --dry-run; production accepts --approve-production and --dry-run.');
}
if (mode === 'local' && extra.some(argument => /^(?:--remote(?:=|$)|-r$)/.test(argument))) {
  throw new Error('The local preview wrapper does not permit remote resource access.');
}
const run = (command, args, environment = process.env) => {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (mode === 'production') {
  if (branch !== 'main') throw new Error('Production deployment requires the main branch.');
  if (!process.argv.includes('--approve-production')) throw new Error('Production deployment requires explicit approval: pass --approve-production only after the owner approves this release.');
} else if (mode === 'preview' && branch !== 'v8-preview') {
  throw new Error('Preview version uploads require the v8-preview branch.');
}
run(process.execPath, ['scripts/check.mjs']);
// Build here as well as in the custom hook: hosted builders can skip that hook.
// An approved main release must never reuse a prior preview/noindex bundle.
run(process.execPath, ['scripts/build.mjs', ...(mode === 'production' ? [] : ['--preview'])]);
const marker = { preview: 'preview-version', production: 'production-approved', 'dry-run': 'dry-run', local: 'local-preview' }[mode];
const args = mode === 'preview' ? ['versions', 'upload', ...(extra.includes('--dry-run') ? ['--dry-run', '--outdir', '.wrangler/preview-dry-run'] : [])]
  : mode === 'production' ? ['deploy', '--keep-vars', ...(extra.includes('--dry-run') ? ['--dry-run', '--outdir', '.wrangler/production-dry-run'] : [])]
  : mode === 'dry-run' ? ['deploy', '--dry-run', '--outdir', '.wrangler/dry-run']
  : ['dev', ...(extra.some(argument => /^--port(?:=|$)/.test(argument)) ? [] : ['--port', '8787']), ...extra];
// Only this wrapper provides a mode marker, bound to its fixed Wrangler command.
// The config's custom build validates that marker and creates the matching assets.
run('npx', ['--no-install', 'wrangler', ...args], { ...process.env, LUSTRY_WRANGLER_MODE: marker });
