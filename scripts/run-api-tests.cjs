const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const workspace = path.resolve(__dirname, '..');
const scratch = path.join(workspace, '.cache', 'api-tests');
mkdirSync(scratch, { recursive: true });
const result = spawnSync(process.execPath, [
  require.resolve('jest/bin/jest'), '--config', process.env.CAR_API_DATABASE_TESTS === '1' ? 'jest.database.config.cjs' : 'jest.config.cjs', '--runInBand', ...process.argv.slice(2),
], {
  cwd: path.join(workspace, 'apps', 'api'),
  env: { ...process.env, TEMP: scratch, TMP: scratch },
  stdio: 'inherit',
});
if (result.error) {
  process.stderr.write(`Unable to start API tests: ${result.error.message}\n`);
}
process.exit(result.status ?? 1);
