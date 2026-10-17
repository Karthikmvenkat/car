import { MaterialStat } from './gltf-inspector';

export type MaterialCategory =
  | 'BODY_PAINT' | 'GLASS' | 'TYRE' | 'WHEEL' | 'LIGHT' | 'TRIM'
  | 'INTERIOR' | 'BADGE' | 'UNDERBODY' | 'OTHER';

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'BODY_PAINT', 'GLASS', 'TYRE', 'WHEEL', 'LIGHT', 'TRIM', 'INTERIOR', 'BADGE', 'UNDERBODY', 'OTHER',
];

export interface MaterialMappingEntry {
  name: string;
  index: number;
  category: MaterialCategory;
  confidence: number;
  reason: string;
  triangleShare: number;
  hasBaseColorTexture: boolean;
  confirmedByAdmin: boolean;
}

export interface MaterialMapping {
  status: 'ok' | 'needs_confirmation' | 'needs_preparation';
  bodyPaintMaterials: string[];
  entries: MaterialMappingEntry[];
  issues: string[];
  classifiedAt: string;
  method: 'heuristic' | 'admin';
}

/**
 * Ordered rules: non-paint categories are checked first so that names such as
 * "body_glass" or "door_handle_chrome" never end up recoloured.
 */
const RULES: Array<[MaterialCategory, RegExp]> = [
  ['GLASS', /glass|window|windshield|windscreen|vidrio|cristal|sunroof_glass/i],
  ['INTERIOR', /interior|\bint_|_int\b|seat|dash|steering|leather|fabric|carpet|cabin|console|headliner|pedal|gauge|cluster|upholster/i],
  ['LIGHT', /head ?light|headlamp|tail ?light|taillamp|lamp|\blight|_light|light_|\bled\b|_led|lens|indicator|blinker|\bdrl\b|reflector|brake_?light|emissi/i],
  ['TYRE', /tyre|tire|rubber(?!_?seal)|reifen/i],
  ['WHEEL', /wheel|\brim|_rim|rim_|alloy|hubcap|\bhub|caliper|brake_?disc|rotor|spoke/i],
  ['BADGE', /badge|logo|emblem|licen[cs]e|number_?plate|\bplate\b|lettering|decal/i],
  ['UNDERBODY', /under|chassis|exhaust|engine|suspension|floorpan|\bfloor|undercarriage|axle|muffler/i],
  ['TRIM', /chrome|trim|grill|grille|plastic|black_?matte|matte_?black|\bseal|wiper|cladding|mesh|mirror_?glass|moulding|molding|handle|antenna|garnish|skid/i],
  ['BODY_PAINT', /paint|carpaint|car_?paint|\bbody|body_|_body|exterior|\bext_|shell|panel|\bdoor|bonnet|\bhood|bumper|fender|\broof|trunk|\bboot|coat|lacquer|\bcar\b/i],
];

function classifyName(text: string): MaterialCategory | null {
  for (const [category, re] of RULES) if (re.test(text)) return category;
  return null;
}

/**
 * Heuristic + PBR-hint classifier. Produces a mapping the admin reviews; it
 * never "guesses" body paint silently — low-confidence picks require
 * confirmation, and models without a separable paint material are flagged.
 */
export function classifyMaterials(materials: MaterialStat[]): MaterialMapping {
  const issues: string[] = [];
  const visible = materials.filter((m) => m.triangles > 0);

  const entries: MaterialMappingEntry[] = visible.map((m) => {
    let category = classifyName(m.name);
    let confidence = category ? 0.85 : 0;
    let reason = category ? `Material name "${m.name}"` : '';

    if (!category) {
      const meshHits = m.meshNames.map(classifyName).filter(Boolean) as MaterialCategory[];
      if (meshHits.length) {
        const counts = new Map<MaterialCategory, number>();
        meshHits.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
        const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        category = best;
        confidence = 0.55 + 0.25 * (n / m.meshNames.length);
        reason = `Mesh names (${m.meshNames.slice(0, 3).join(', ')})`;
      }
    }

    // PBR hints override / support names.
    if (m.transmission > 0.2 || (m.alphaMode === 'BLEND' && m.baseColorFactor[3] < 0.7)) {
      if (category !== 'GLASS' && category !== 'LIGHT') {
        category = 'GLASS';
        confidence = 0.75;
        reason = 'Transparent material (transmission/alpha)';
      }
    } else if (m.emissiveStrength > 0.3 && category !== 'LIGHT') {
      category = 'LIGHT';
      confidence = 0.7;
      reason = 'Emissive material';
    }

    if (!category) {
      category = 'OTHER';
      confidence = 0.2;
      reason = 'No name or property signal';
    }

    return {
      name: m.name,
      index: m.index,
      category,
      confidence: Number(confidence.toFixed(2)),
      reason,
      triangleShare: m.triangleShare,
      hasBaseColorTexture: m.hasBaseColorTexture,
      confirmedByAdmin: false,
    };
  });

  let body = entries.filter((e) => e.category === 'BODY_PAINT');
  let status: MaterialMapping['status'] = 'ok';

  if (body.length === 0) {
    // Fallback: largest opaque, untextured "OTHER" material — proposed but unconfirmed.
    const candidate = entries
      .filter((e) => e.category === 'OTHER')
      .map((e) => ({ e, m: visible.find((m) => m.index === e.index)! }))
      .filter(({ m }) => m.alphaMode === 'OPAQUE' && m.triangleShare >= 0.05)
      .sort((a, b) => b.m.triangleShare - a.m.triangleShare)[0];
    if (candidate) {
      candidate.e.category = 'BODY_PAINT';
      candidate.e.confidence = 0.3;
      candidate.e.reason = `Largest opaque unclassified material (${Math.round(candidate.m.triangleShare * 100)}% of triangles) — please confirm`;
      body = [candidate.e];
      status = 'needs_confirmation';
      issues.push('Body paint was not identified by name; a candidate was proposed and needs admin confirmation');
    } else {
      status = 'needs_preparation';
      issues.push('No separable body-paint material found — the model needs material preparation before colours can be applied');
    }
  }

  const visibleCount = entries.length;
  const bodyShare = body.reduce((s, e) => s + e.triangleShare, 0);
  if (visibleCount <= 2 || body.some((e) => e.triangleShare > 0.9)) {
    status = 'needs_preparation';
    issues.push('One material covers almost the whole vehicle — recolouring would also tint glass, tyres or trim');
  }
  if (bodyShare > 0.85 && status === 'ok') {
    status = 'needs_confirmation';
    issues.push(`Body-paint materials cover ${Math.round(bodyShare * 100)}% of the model — verify trim/glass are not included`);
  }
  const textured = body.filter((e) => e.hasBaseColorTexture);
  if (textured.length) {
    if (status === 'ok') status = 'needs_confirmation';
    issues.push(`Body material(s) ${textured.map((e) => e.name).join(', ')} use a base-colour texture; recolour replaces it — check for baked decals or dirt`);
  }
  if (status === 'ok' && body.some((e) => e.confidence < 0.6)) status = 'needs_confirmation';

  return {
    status,
    bodyPaintMaterials: body.map((e) => e.name),
    entries,
    issues,
    classifiedAt: new Date().toISOString(),
    method: 'heuristic',
  };
}

/** Rebuild status after an admin edits categories. Admin-confirmed mappings are authoritative. */
export function applyAdminMapping(
  base: MaterialMapping,
  updates: Array<{ name: string; category: MaterialCategory }>,
): MaterialMapping {
  const byName = new Map(updates.map((u) => [u.name, u.category]));
  const entries = base.entries.map((e) =>
    byName.has(e.name)
      ? { ...e, category: byName.get(e.name)!, confidence: 1, reason: 'Set by admin', confirmedByAdmin: true }
      : { ...e, confirmedByAdmin: true },
  );
  const body = entries.filter((e) => e.category === 'BODY_PAINT');
  const issues: string[] = [];
  let status: MaterialMapping['status'] = 'ok';
  if (body.length === 0) {
    status = 'needs_preparation';
    issues.push('No material is assigned to BODY_PAINT');
  } else if (body.some((e) => e.triangleShare > 0.9) && entries.length <= 2) {
    status = 'needs_preparation';
    issues.push('Body paint shares a material with the whole model — prepare the model with separate materials');
  }
  return { ...base, entries, bodyPaintMaterials: body.map((e) => e.name), status, issues, method: 'admin', classifiedAt: new Date().toISOString() };
}
