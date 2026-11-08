import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function deploymentBranch() {
  const cwd = fileURLToPath(new URL('../', import.meta.url));
  const result = spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' });
  return result.stdout?.trim()
    || (process.env.WORKERS_CI === '1' ? process.env.WORKERS_CI_BRANCH : '')
    || (process.env.GITHUB_ACTIONS === 'true' ? (process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME) : '')
    || '';
}
