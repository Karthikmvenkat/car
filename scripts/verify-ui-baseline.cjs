const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const workspace = path.resolve(__dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(workspace, 'specs/001-production-baseline/ui-baseline.json'), 'utf8'));
const failures = [];
const approved = new Map();
for (const manifest of ['specs/004-playwright-regression/ui-functional-fixes.json','specs/005-quotation-requests/ui-changes.json']) {
  const corrections = JSON.parse(fs.readFileSync(path.join(workspace, manifest), 'utf8'));
  for (const file of corrections.files) {
    if (approved.has(file.path) && file.previousSha256 !== approved.get(file.path).sha256) failures.push(`Broken correction history: ${file.path}`);
    approved.set(file.path, file);
  }
}
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
for (const [file, entry] of approved) {
  if (!known.has(file) && !entry.added) failures.push(`Unknown correction: ${file}`);
  if (entry.added && (known.has(file) || !fs.existsSync(path.join(workspace,file)) || !matches(path.join(workspace,file),entry.sha256))) failures.push(`Invalid addition: ${file}`);
}
const current = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'apps/web'], { cwd: workspace, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of current) if (!known.has(file) && !approved.get(file)?.added) failures.push(`Added: ${file}`);
if (failures.length) {
  process.stderr.write(failures.join('\n') + '\n');
  process.exit(1);
}
const additions=[...approved.values()].filter(file=>file.added).length;
const corrections=approved.size-additions;
process.stdout.write(`UI source integrity: ${baseline.files.length-corrections} original files preserved; ${corrections} recorded corrections; ${additions} recorded additions (not visual rendering).\n`);
