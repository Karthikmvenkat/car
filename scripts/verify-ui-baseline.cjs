const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const workspace = path.resolve(__dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(workspace, 'specs/001-production-baseline/ui-baseline.json'), 'utf8'));
const failures = [];
for (const file of baseline.files) {
  const absolute = path.join(workspace, file.path);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing: ${file.path}`);
  } else if (crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') !== file.sha256) {
    failures.push(`Changed: ${file.path}`);
  }
}
const known = new Set(baseline.files.map(file => file.path));
const current = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'apps/web'], { cwd: workspace, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of current) if (!known.has(file)) failures.push(`Added: ${file}`);
if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(`UI source baseline unchanged: ${baseline.files.length} files (source integrity, not visual rendering).\n`);
