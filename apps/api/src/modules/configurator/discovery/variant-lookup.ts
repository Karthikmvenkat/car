import { safeFetch } from '../security/safe-fetch';
import { INDIA_MODEL_PAGES } from './india-model-pages';

const cache = new Map<string, { expires: number; variants: string[] }>();
export function extractVariantNames(html: string): string[] {
  const match = /"variantList"\s*:\s*(\[[^\]]*\])/.exec(html);
  if (!match) return [];
  const list: unknown = JSON.parse(match[1]);
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((v) => v?.variantName).filter((v): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 80))];
}

export async function lookupVariants(make: string, model: string) {
  const key = `${make.trim()}|${model.trim()}`;
  const page = INDIA_MODEL_PAGES[key];
  if (!page) return { variants: [], message: 'No variant directory entry for this model. Use Other variant.' };
  const sourceUrl = `https://www.cardekho.com/${page}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return { variants: cached.variants, sourceUrl, message: 'Current market variants; check availability for your model year.' };
  const html = (await safeFetch(sourceUrl, { allowedHosts: ['www.cardekho.com'], maxBytes: 4_000_000, timeoutMs: 15000 })).toString('utf8');
  const variants = extractVariantNames(html);
  if (variants.length) cache.set(key, { expires: Date.now() + 3600000, variants });
  return { variants, sourceUrl, message: variants.length ? 'Current market variants; check availability for your model year.' : 'Variants are unavailable for this model. Use Other variant.' };
}
