const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const workspace = path.resolve(__dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(workspace, 'specs/001-production-baseline/ui-baseline.json'), 'utf8'));
const corrections = JSON.parse(fs.readFileSync(path.join(workspace, 'specs/004-playwright-regression/ui-functional-fixes.json'), 'utf8'));
const approved = new Map(corrections.files.map(file => [file.path, file]));
const failures = [];
function matches(absolute, expected) {
  const original = fs.readFileSync(absolute, 'utf8');
  const text = original.replace(/\r\n/g, '\n');
  // Git checks out platform-specific newlines; the original capture contained both.
  return [original, text, text.replace(/\n/g, '\r\n')].some(value => crypto.createHash('sha256').update(value).digest('hex') === expected);
}
for (const file of baseline.files) {
  const absolute = path.join(workspace, file.path);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing: ${file.path}`);
  } else if (approved.has(file.path) && approved.get(file.path).baselineSha256 !== file.sha256) {
    failures.push(`Invalid correction baseline: ${file.path}`);
  } else if (!matches(absolute, approved.get(file.path)?.sha256 ?? file.normalizedSha256 ?? file.sha256)) {
    failures.push(`Changed: ${file.path}`);
  }
}
const known = new Set(baseline.files.map(file => file.path));
for (const file of approved.keys()) if (!known.has(file)) failures.push(`Unknown correction: ${file}`);
const current = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'apps/web'], { cwd: workspace, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of current) if (!known.has(file)) failures.push(`Added: ${file}`);
if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(`UI source integrity: ${baseline.files.length - approved.size} original files preserved; ${approved.size} explicitly recorded functional corrections (not visual rendering).\n`);
