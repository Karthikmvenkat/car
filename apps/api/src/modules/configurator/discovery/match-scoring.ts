import { ModelCandidate, VehicleQuery } from './model-source';

export interface MatchResult {
  score: number;
  reasons: string[];
  /** True when the model name itself does not appear — never an exact match. */
  modelNameMissing: boolean;
}

/** Below this, a candidate is never imported automatically. Requires an exact year hit. */
export const AUTO_IMPORT_MIN_CONFIDENCE = 0.85;

const GENERIC_TOKENS = new Set([
  'plus', 'the', 'and', 'with', 'new', 'car', 'model', 'edition', 'version', 'auto', 'at', 'mt',
  'petrol', 'diesel', 'gt', 'line',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

function extractYears(text: string): number[] {
  const years = new Set<number>();
  for (const m of text.matchAll(/\b(19[5-9]\d|20[0-4]\d)\b/g)) years.add(Number(m[1]));
  return [...years];
}

/**
 * Score how well a candidate matches the requested vehicle. Exact identity
 * (make, model, year, generation) is weighted far above visual similarity;
 * the model name is mandatory for any meaningful score.
 */
export function scoreCandidate(query: VehicleQuery, candidate: ModelCandidate): MatchResult {
  const reasons: string[] = [];
  const haystackText = [candidate.name, candidate.tags.join(' '), candidate.description || ''].join(' ');
  const hay = new Set(tokenize(haystackText));
  const nameTokens = new Set(tokenize(candidate.name));
  let score = 0;

  const modelTokens = tokenize(query.model).filter((t) => !GENERIC_TOKENS.has(t));
  const modelHit = modelTokens.length > 0 && modelTokens.every((t) => hay.has(t));
  const modelInName = modelTokens.length > 0 && modelTokens.every((t) => nameTokens.has(t));
  if (!modelHit) {
    reasons.push(`Model name "${query.model}" not found`);
    return { score: 0, reasons, modelNameMissing: true };
  }
  score += modelInName ? 0.45 : 0.35;
  reasons.push(modelInName ? 'Model name in title' : 'Model name only in tags/description');

  const makeTokens = tokenize(query.make);
  if (makeTokens.every((t) => hay.has(t))) {
    score += 0.2;
    reasons.push('Make matches');
  } else {
    reasons.push(`Make "${query.make}" not mentioned`);
  }

  const years = extractYears(haystackText);
  if (years.includes(query.year)) {
    score += 0.2;
    reasons.push(`Year ${query.year} matches`);
  } else if (years.some((y) => Math.abs(y - query.year) === 1)) {
    score += 0.1;
    reasons.push(`Year within ±1 (${years.join(', ')})`);
  } else if (years.length > 0) {
    score -= 0.1;
    reasons.push(`Year mismatch (${years.join(', ')}) — likely a different generation or facelift`);
  } else {
    reasons.push('No model year stated');
  }

  const detailTokens = [
    ...tokenize(query.generation || ''),
    ...tokenize(query.variant || ''),
  ].filter((t) => !GENERIC_TOKENS.has(t) && t.length > 1 && !/^\d+$/.test(t));
  if (detailTokens.length > 0) {
    const hits = detailTokens.filter((t) => hay.has(t));
    if (hits.length > 0) {
      score += 0.1 * (hits.length / detailTokens.length);
      reasons.push(`Generation/variant tokens matched: ${hits.join(', ')}`);
    }
  }

  if (candidate.archives.glb) {
    score += 0.05;
    reasons.push('GLB archive available');
  }

  const faces = candidate.faceCount ?? candidate.archives.glb?.faceCount;
  if (faces !== undefined) {
    if (faces < 20_000) {
      score -= 0.1;
      reasons.push(`Low detail (${faces.toLocaleString()} faces)`);
    } else if (faces > 2_000_000) {
      score -= 0.05;
      reasons.push(`Very heavy (${faces.toLocaleString()} faces) — needs decimation`);
    }
  }

  if (/\b(toy|lowpoly|low poly|cartoon|stylized|stylised|lego|minecraft|voxel)\b/i.test(haystackText)) {
    score -= 0.2;
    reasons.push('Stylised / toy model');
  }

  return {
    score: Math.max(0, Math.min(1, Number(score.toFixed(3)))),
    reasons,
    modelNameMissing: false,
  };
}
