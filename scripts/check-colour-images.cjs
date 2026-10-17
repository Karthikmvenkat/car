const fs = require('node:fs');
const sharp = require('sharp');
const { discoverManufacturerPhotos } = require('../apps/api/dist/modules/configurator/images/manufacturer-photos.js');
const catalog = require('../apps/web/lib/india-vehicle-catalog.json');
const targets = catalog.makes.flatMap(b => b.models.map(model => ({ make: b.name, model })));
const imageCache = new Map();
const entries = [];
let next = 0;
async function inspect(url) {
  if (!imageCache.has(url)) imageCache.set(url, (async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) return { status: 'broken', http: response.status };
      const bytes = Buffer.from(await response.arrayBuffer());
      const m = await sharp(bytes).metadata();
      return { status: m.width >= 900 ? 'ok' : 'low_resolution', http: response.status, width: m.width, height: m.height, bytes: bytes.length };
    } catch (e) { return { status: 'failed', error: e.message }; }
  })());
  return imageCache.get(url);
}
async function worker() {
  while (next < targets.length) {
    const target = targets[next++];
    try {
      const found = await discoverManufacturerPhotos(target.make, target.model, 2026);
      const photos = [];
      // Six model workers, one image request each, to bound network load.
      for (const c of found.colours) photos.push({ colour: c.name, url: c.imageUrl, ...await inspect(c.imageUrl) });
      entries.push({ ...target, source: found.sourceUrl, photos, status: photos.length ? (photos.every(p => p.status === 'ok') ? 'ok' : 'needs_review') : 'no_photos' });
    } catch(e) { entries.push({ ...target, status: 'lookup_failed', error: e.message, photos: [] }); }
    if (entries.length % 25 === 0) console.log(`${entries.length}/${targets.length} models checked`);
  }
}
(async () => {
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  entries.sort((a,b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model));
  const images = entries.flatMap(e => e.photos);
  const summary = { models: entries.length, modelsWithPhotos: entries.filter(e => e.photos.length).length, noPhotos: entries.filter(e => e.status === 'no_photos').length, lookupFailed: entries.filter(e => e.status === 'lookup_failed').length, images: images.length, uniqueImages: imageCache.size, clear: images.filter(p => p.status === 'ok').length, lowResolution: images.filter(p => p.status === 'low_resolution').length, broken: images.filter(p => p.status === 'broken').length, failed: images.filter(p => p.status === 'failed').length };
  const report = { checkedAt: new Date().toISOString(), minimumPreviewWidth: 900, note: 'Checks image availability, decoding and pixel dimensions. Does not verify trim/year identity or subjective photographic sharpness.', summary, entries };
  fs.writeFileSync('colour-image-audit.json', JSON.stringify(report, null, 2) + '\n');
  const issues = entries.filter(e => e.status !== 'ok');
  const lines = ['# Vehicle colour image audit', '', `Checked: ${report.checkedAt}`, '', report.note, '', ...Object.entries(summary).map(([k,v]) => `- ${k}: ${v}`), '', '## Models requiring attention', '', '| Make | Model | Issue |', '| --- | --- | --- |', ...issues.map(e => `| ${e.make} | ${e.model} | ${e.photos.length ? e.photos.filter(p => p.status !== 'ok').map(p => `${p.colour}: ${p.status}${p.width ? ` (${p.width} × ${p.height})` : ''}`).join('; ') : e.status} |`)];
  fs.writeFileSync('colour-image-audit.md', lines.join('\n') + '\n');
  console.log(JSON.stringify(summary));
})().catch(e => { console.error(e); process.exit(1); });
