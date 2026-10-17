import { safeFetch } from '../security/safe-fetch';
import { INDIA_MODEL_PAGES } from '../discovery/india-model-pages';
import { fullSizePhoto } from './photo-quality';

const cache = new Map<string, { expires: number; result: any }>();
export async function discoverManufacturerPhotos(make: string, model: string, year: number) {
  const name = model.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (['tata', 'tata-motors'].includes(make.trim().toLowerCase().replace(/\s+/g, '-')) && name === 'tiago') return discoverTiagoPhotos(year);
  if (make.trim().toLowerCase() !== 'kia' || !['sonet', 'seltos', 'syros', 'carens', 'carnival', 'ev6', 'ev9'].includes(name)) {
    return discoverDirectoryPhotos(make, model, year);
  }
  if (!Number.isInteger(year) || year < 1950 || year > 2100) return { colours: [], message: 'Enter a valid model year.' };
  const key = `${name}:${year}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const sourceUrl = `https://www.kia.com/in/our-vehicles/${name}/showroom.html`;
  const html = (await safeFetch(sourceUrl, { allowedHosts: ['www.kia.com'], maxBytes: 3_000_000, timeoutMs: 15000 })).toString('utf8');
  const colours: any[] = [];
  for (const match of html.matchAll(/<button\b[^>]*data-selectedcolor="[^"]+"[^>]*>/gi)) {
    const attr = (key: string) => new RegExp(`${key}="([^"]+)"`, 'i').exec(match[0])?.[1];
    const code = attr('data-code');
    const paint = attr('data-exterior');
    const assetModel = attr('data-model');
    const colour = attr('data-selectedcolor');
    if (!code || !paint || !assetModel || !colour || ![code, paint, assetModel].every((s) => /^[a-z0-9_-]+$/i.test(s)) || colours.some((c) => c.name === colour)) continue;
    const imageUrl = `https://www.kia.com/content/dam/kia2/in/en/images/360vr/${assetModel}/${code}/exterior/${paint}/09-d.png`;
    colours.push({ name: colour.replace(/&amp;/g, '&'), manufacturerPaintCode: '', previewHex: /blue/i.test(colour) ? '#203b69' : /white/i.test(colour) ? '#f1f1ed' : /red/i.test(colour) ? '#a3262c' : /olive/i.test(colour) ? '#777966' : /black/i.test(colour) ? '#18191c' : '#53585c', finish: /matte/i.test(colour) ? 'matte' : 'metallic', availabilityStatus: 'UNVERIFIED', imageUrl });
  }
  const sourceYear = Number(/<title>[^<]*?\b(20\d{2})\b/i.exec(html)?.[1]) || null;
  const result = { colours, sourceUrl, requestedYear: year, sourceYear, message: colours.length ? `Found ${colours.length} manufacturer colour photos. ${sourceYear === year ? 'Model year matches the current showroom.' : `These are current showroom images${sourceYear ? ` (${sourceYear})` : ''}; exact ${year} body shape is not verified.`} Variant equipment may differ.` : 'No manufacturer colour photos were found. Try another model or use manual photos.' };
  cache.set(key, { expires: Date.now() + 3600000, result });
  return result;
}

/** Read the structured colour list, without executing scripts from the source page. */
export function extractDirectoryColours(html: string) {
  const marker = /"colors"\s*:\s*\[/g;
  for (const match of html.matchAll(marker)) {
    const start = match.index! + match[0].length - 1;
    let depth = 0, quoted = false, escaped = false;
    for (let i = start; i < html.length; i++) {
      const c = html[i];
      if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
      else if (c === '"') quoted = true;
      else if (c === '[') depth++;
      else if (c === ']' && --depth === 0) {
        try {
          const list = JSON.parse(html.slice(start, i + 1));
          const result: any[] = [];
          for (const item of list) {
            if (typeof item.name !== 'string' || !item.name.trim() || typeof item.image !== 'string') continue;
            const url = new URL(item.popupImage || item.url || item.image);
            if (url.protocol !== 'https:' || url.hostname !== 'stimg.cardekho.com' || result.some((c) => c.name === item.name)) continue;
            result.push({ name: item.name.trim(), manufacturerPaintCode: '', previewHex: /^#[a-f0-9]{6}$/i.test(item.hexCode || '') ? item.hexCode.toLowerCase() : '#777777', finish: /matte/i.test(item.name) ? 'matte' : 'metallic', availabilityStatus: 'UNVERIFIED', imageUrl: fullSizePhoto(url.toString()) });
          }
          if (result.length) return result.slice(0, 24);
        } catch { /* A different widget may also have a colors property. */ }
        break;
      }
    }
  }
  return [];
}

export async function discoverDirectoryPhotos(make: string, model: string, year: number) {
  if (!Number.isInteger(year) || year < 1950 || year > 2100) return { colours: [], message: 'Enter a valid model year.' };
  const identity = `${make.trim()}|${model.trim()}`;
  const pageKey = Object.keys(INDIA_MODEL_PAGES).find((key) => key.toLowerCase() === identity.toLowerCase())
    ?? (['mg', 'mg motor'].includes(make.trim().toLowerCase()) ? Object.keys(INDIA_MODEL_PAGES).find((key) => key.toLowerCase() === `mg motor|mg ${model.trim().replace(/^mg\s+/i, '')}`.toLowerCase()) : undefined);
  if (!pageKey) return { colours: [], message: 'This model is not in the automatic photo catalogue. Select a listed make and model.' };
  const key = `directory:${pageKey}:${year}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const sourceUrl = `https://www.cardekho.com/${INDIA_MODEL_PAGES[pageKey]}/colors`;
  const html = (await safeFetch(sourceUrl, { allowedHosts: ['www.cardekho.com'], maxBytes: 4_000_000, timeoutMs: 15000 })).toString('utf8');
  const colours = extractDirectoryColours(html);
  const result = { colours, sourceUrl, sourceName: 'CarDekho', requestedYear: year, sourceYear: null, message: colours.length ? `Found ${colours.length} ${make} ${model} colour photos. Source: CarDekho. Current-model imagery; exact ${year} trim and colour availability are unverified.` : `No colour photos are currently available for ${make} ${model}.` };
  if (colours.length) cache.set(key, { expires: Date.now() + 3600000, result });
  return result;
}

export async function discoverTiagoPhotos(year: number) {
  if (!Number.isInteger(year) || year < 1950 || year > 2100) return { colours: [], message: 'Enter a valid model year.' };
  const key = `tata:tiago:${year}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const sourceUrl = 'https://tata.cars/tiago/ice.html';
  const html = (await safeFetch(sourceUrl, { allowedHosts: ['tata.cars', 'www.tata.cars'], maxBytes: 3_000_000, timeoutMs: 15000 })).toString('utf8');
  const colours: any[] = [];
  const sourceYears = new Set<number>();
  for (const match of html.matchAll(/ProductOverviewHeroListDataModel\s*\[([^\]]+)\]/g)) {
    const attr = (key: string) => new RegExp(`${key}\\(\\)=([^,]+)`).exec(match[1])?.[1].trim();
    const name = attr('getCarColorLabel');
    const hex = attr('getCarColor')?.split('|')[0].trim();
    const imageUrl = attr('getCardesktopImage')?.replace(/&amp;/g, '&');
    const path = attr('getImagePath360');
    if (!name || !hex || !/^#[a-f0-9]{6}$/i.test(hex) || !imageUrl || colours.some((c) => c.name === name)) continue;
    const url = new URL(imageUrl);
    if (url.protocol !== 'https:' || url.hostname !== 's7ap1.scene7.com' || !url.pathname.startsWith('/is/image/tatamotors/')) continue;
    const assetYear = Number(/\/year-(20\d{2})\//.exec(path || '')?.[1]);
    if (assetYear) sourceYears.add(assetYear);
    colours.push({ name, manufacturerPaintCode: '', previewHex: hex.toLowerCase(), finish: 'metallic', availabilityStatus: 'UNVERIFIED', imageUrl });
  }
  const sourceYear = sourceYears.size === 1 ? [...sourceYears][0] : null;
  const result = { colours, sourceUrl, requestedYear: year, sourceYear, message: colours.length ? `Found ${colours.length} Tata Tiago manufacturer colour photos. ${sourceYear === year ? 'Model year matches the manufacturer image collection.' : `Images are from ${sourceYear || 'the current showroom'}; exact ${year} body shape is unverified.`} Images show dual-tone paint; check availability for your variant.` : 'No Tata Tiago colour photos found. Please retry later.' };
  cache.set(key, { expires: Date.now() + 3600000, result });
  return result;
}
