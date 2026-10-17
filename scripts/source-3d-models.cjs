// Read-only source audit. Does not purchase, download, import, or publish assets.
const fs = require('node:fs');
const path = require('node:path');
const { SketchfabProvider } = require('../apps/api/dist/modules/configurator/discovery/sketchfab.provider.js');
const { scoreCandidate } = require('../apps/api/dist/modules/configurator/discovery/match-scoring.js');
const catalogue = require('../apps/web/lib/india-vehicle-catalog.json');
const makes = ['Hyundai', 'Mahindra', 'Tata', 'Kia', 'Honda', 'Skoda', 'MG Motor', 'Volkswagen', 'Jaguar', 'BMW', 'Audi', 'Nissan', 'Toyota'];
const targets = catalogue.makes.filter((m) => makes.includes(m.name)).flatMap((m) => (m.name === 'MG Motor' ? ['Hector'] : m.models).map((model) => ({ make: m.name, model, year: 2026 })));
const provider = new SketchfabProvider();
const entries = [];
let next = 0;
async function worker() {
  while (next < targets.length) {
    const target = targets[next++];
    const query = { ...target, make: target.make === 'MG Motor' ? 'MG' : target.make, market: 'India' };
    try {
      const results = await provider.search(query, 3);
      const candidates = results.map((candidate) => ({ candidate, match: scoreCandidate(query, candidate) })).filter(({match}) => !match.modelNameMissing && match.score >= 0.3).sort((a,b) => b.match.score - a.match.score).slice(0,3).map(({candidate:c,match}) => ({name:c.name,url:c.sourceUrl,thumbnail:c.thumbnailUrl || null,licence:c.licence.label,commercialUse:c.licence.allowsCommercialUse,modification:c.licence.allowsDerivatives,downloadable:c.downloadable,matchScore:match.score,reasons:match.reasons,yearVerified:false}));
      entries.push({...target,status:candidates.some(c=>c.commercialUse&&c.modification)?'candidate_review':candidates.length?'licence_review':'not_found',candidates});
    } catch(e) { entries.push({...target,status:'search_failed',error:e.message,candidates:[]}); }
    console.log(`${entries.length}/${targets.length}: ${target.make} ${target.model}`);
  }
}
(async()=>{await Promise.all([worker(),worker(),worker()]);entries.sort((a,b)=>a.make.localeCompare(b.make)||a.model.localeCompare(b.model));const result={checkedAt:new Date().toISOString(),targetYear:2026,downloadConfigured:provider.canDownload(),note:'Candidates only. Exact model year, Indian body shape, trim, licence and paint materials require review. No assets downloaded.',entries};fs.writeFileSync(path.join(__dirname,'../apps/web/lib/three-d-sourcing.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({total:entries.length,candidates:entries.filter(e=>e.candidates.length).length,failed:entries.filter(e=>e.status==='search_failed').length}));})().catch(e=>{console.error(e);process.exit(1)});
