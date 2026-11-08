import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deploymentBranch } from './deployment-branch.mjs';

const mode = process.env.LUSTRY_WRANGLER_MODE;
const command = process.env.WRANGLER_COMMAND;
const branch = deploymentBranch();
const permitted = (
  (mode === 'preview-version' && command === 'versions upload' && branch === 'v8-preview')
  || (mode === 'production-approved' && command === 'deploy' && branch === 'main')
  || (mode === 'dry-run' && command === 'deploy')
  || (mode === 'local-preview' && command === 'dev')
);
if (!permitted) {
  console.error('Lustry release guard: direct Wrangler invocation is blocked before asset build/upload.');
  console.error('For v8-preview, configure the Cloudflare preview command as npm run deploy:preview.');
  console.error('Use npm run deploy:dry-run or npm run preview for local checks. Production requires main plus explicit owner approval.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['scripts/build.mjs', ...(mode === 'production-approved' ? [] : ['--preview'])], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  stdio: 'inherit'
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
