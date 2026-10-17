import { Document, getBounds, Material, Node, Primitive } from '@gltf-transform/core';
import { checkGlbHeader, getGltfIO } from './gltf-io';

export interface MaterialStat {
  index: number;
  name: string;
  triangles: number;
  /** Share of all rendered triangles using this material (0–1). */
  triangleShare: number;
  meshNames: string[];
  hasBaseColorTexture: boolean;
  baseColorFactor: [number, number, number, number];
  metallic: number;
  roughness: number;
  alphaMode: 'OPAQUE' | 'MASK' | 'BLEND';
  transmission: number;
  emissiveStrength: number;
  doubleSided: boolean;
}

export interface InspectionReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  sizeBytes: number;
  counts: {
    scenes: number; nodes: number; meshes: number; primitives: number;
    materials: number; textures: number; triangles: number; vertices: number; animations: number;
  };
  materials: MaterialStat[];
  missingTextures: string[];
  extensionsUsed: string[];
  bounds: { min: number[]; max: number[]; size: number[] } | null;
  orientation: { upAxis: 'Y'; lengthAxis: 'X' | 'Y' | 'Z'; ok: boolean; note: string };
  scale: { lengthUnits: number; unitGuess: 'm' | 'cm' | 'mm' | 'unknown'; lengthMeters: number | null; plausible: boolean };
  polygonBudget: { triangles: number; budget: number; withinBudget: boolean };
  inspectedAt: string;
}

export const TRIANGLE_BUDGET = Number(process.env.MODEL_TRIANGLE_BUDGET || 300_000);
const AXES = ['X', 'Y', 'Z'] as const;

function primitiveTriangles(prim: Primitive): number {
  const mode = prim.getMode();
  const indices = prim.getIndices();
  const count = indices ? indices.getCount() : prim.getAttribute('POSITION')?.getCount() || 0;
  if (mode === Primitive.Mode.TRIANGLES) return Math.floor(count / 3);
  if (mode === Primitive.Mode.TRIANGLE_STRIP || mode === Primitive.Mode.TRIANGLE_FAN) return Math.max(0, count - 2);
  return 0;
}

function materialTransmission(material: Material): number {
  const ext = material.getExtension<any>('KHR_materials_transmission');
  return ext ? Number(ext.getTransmissionFactor?.() ?? 0) : 0;
}

/** Parse a GLB and produce a structural / plausibility report. Never throws for bad input — returns ok:false. */
export async function inspectGlb(buffer: Buffer): Promise<{ report: InspectionReport; document: Document | null }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const empty: InspectionReport = {
    ok: false, errors, warnings, sizeBytes: buffer.length,
    counts: { scenes: 0, nodes: 0, meshes: 0, primitives: 0, materials: 0, textures: 0, triangles: 0, vertices: 0, animations: 0 },
    materials: [], missingTextures: [], extensionsUsed: [], bounds: null,
    orientation: { upAxis: 'Y', lengthAxis: 'X', ok: false, note: '' },
    scale: { lengthUnits: 0, unitGuess: 'unknown', lengthMeters: null, plausible: false },
    polygonBudget: { triangles: 0, budget: TRIANGLE_BUDGET, withinBudget: false },
    inspectedAt: new Date().toISOString(),
  };

  const header = checkGlbHeader(buffer);
  if (!header.ok) {
    errors.push(header.error!);
    return { report: empty, document: null };
  }

  let doc: Document;
  try {
    const io = await getGltfIO();
    doc = await io.readBinary(new Uint8Array(buffer));
  } catch (err) {
    errors.push(`File integrity check failed: ${(err as Error).message}`);
    return { report: empty, document: null };
  }

  const root = doc.getRoot();
  const materials = root.listMaterials();
  const matTriangles = new Map<Material | null, number>();
  const matMeshes = new Map<Material | null, Set<string>>();
  let triangles = 0;
  let vertices = 0;

  const scene = root.getDefaultScene() || root.listScenes()[0];
  if (!scene) errors.push('File has no scene');

  // Count per rendered instance so instanced wheels etc. are weighted correctly.
  scene?.traverse((node: Node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    for (const prim of mesh.listPrimitives()) {
      const t = primitiveTriangles(prim);
      triangles += t;
      vertices += prim.getAttribute('POSITION')?.getCount() || 0;
      const mat = prim.getMaterial();
      matTriangles.set(mat, (matTriangles.get(mat) || 0) + t);
      if (!matMeshes.has(mat)) matMeshes.set(mat, new Set());
      matMeshes.get(mat)!.add(mesh.getName() || node.getName() || 'unnamed');
    }
  });

  if (triangles === 0) errors.push('Model contains no triangle geometry');
  if (matTriangles.has(null)) warnings.push('Some primitives have no material assigned');

  const materialStats: MaterialStat[] = materials.map((m, index) => {
    const t = matTriangles.get(m) || 0;
    const emissive = m.getEmissiveFactor();
    const strength = (m.getExtension<any>('KHR_materials_emissive_strength')?.getEmissiveStrength?.() ?? 1) as number;
    return {
      index,
      name: m.getName() || `material_${index}`,
      triangles: t,
      triangleShare: triangles ? Number((t / triangles).toFixed(4)) : 0,
      meshNames: [...(matMeshes.get(m) || [])].slice(0, 25),
      hasBaseColorTexture: !!m.getBaseColorTexture(),
      baseColorFactor: m.getBaseColorFactor() as [number, number, number, number],
      metallic: m.getMetallicFactor(),
      roughness: m.getRoughnessFactor(),
      alphaMode: m.getAlphaMode() as MaterialStat['alphaMode'],
      transmission: materialTransmission(m),
      emissiveStrength: Math.max(...emissive) * strength,
      doubleSided: m.getDoubleSided(),
    };
  });

  const unused = materialStats.filter((m) => m.triangles === 0);
  if (unused.length) warnings.push(`${unused.length} material(s) are not used by any visible mesh`);
  const names = materialStats.map((m) => m.name);
  if (new Set(names).size !== names.length) warnings.push('Duplicate material names (will be renamed during optimisation)');

  const missingTextures = root
    .listTextures()
    .filter((t) => !t.getImage() || t.getImage()!.byteLength === 0)
    .map((t, i) => t.getName() || t.getURI() || `texture_${i}`);
  if (missingTextures.length) errors.push(`${missingTextures.length} texture(s) have no image data`);

  let bounds: InspectionReport['bounds'] = null;
  let orientation = empty.orientation;
  let scale = empty.scale;
  if (scene && triangles > 0) {
    const b = getBounds(scene);
    const size = [0, 1, 2].map((i) => Number((b.max[i] - b.min[i]).toFixed(4)));
    bounds = { min: b.min.map((v) => Number(v.toFixed(4))), max: b.max.map((v) => Number(v.toFixed(4))), size };

    const longest = size.indexOf(Math.max(...size));
    const lengthAxis = AXES[longest];
    const okOrientation = lengthAxis !== 'Y';
    orientation = {
      upAxis: 'Y',
      lengthAxis,
      ok: okOrientation,
      note: okOrientation
        ? `Vehicle length runs along ${lengthAxis}; Y is up (glTF convention)`
        : 'Longest dimension is vertical — model is likely exported Z-up or standing on end',
    };
    if (!okOrientation) warnings.push(orientation.note);

    const length = size[longest];
    const guesses: Array<[InspectionReport['scale']['unitGuess'], number]> = [['m', 1], ['cm', 0.01], ['mm', 0.001]];
    const hit = guesses.find(([, f]) => length * f >= 2.5 && length * f <= 7);
    scale = {
      lengthUnits: length,
      unitGuess: hit ? hit[0] : 'unknown',
      lengthMeters: hit ? Number((length * hit[1]).toFixed(3)) : null,
      plausible: !!hit && hit[0] === 'm',
    };
    if (!hit) warnings.push(`Vehicle length ${length.toFixed(2)} units does not match a 2.5–7 m car in m/cm/mm`);
    else if (hit[0] !== 'm') warnings.push(`Model appears to be authored in ${hit[0]} (length ${length.toFixed(1)}); viewer will rescale`);
  }

  if (triangles > TRIANGLE_BUDGET) {
    warnings.push(`${triangles.toLocaleString()} triangles exceeds the web budget of ${TRIANGLE_BUDGET.toLocaleString()} — will be simplified`);
  }
  if (root.listAnimations().length) warnings.push('Model contains animations (ignored by the configurator)');

  const report: InspectionReport = {
    ok: errors.length === 0,
    errors,
    warnings,
    sizeBytes: buffer.length,
    counts: {
      scenes: root.listScenes().length,
      nodes: root.listNodes().length,
      meshes: root.listMeshes().length,
      primitives: root.listMeshes().reduce((n, m) => n + m.listPrimitives().length, 0),
      materials: materials.length,
      textures: root.listTextures().length,
      triangles,
      vertices,
      animations: root.listAnimations().length,
    },
    materials: materialStats,
    missingTextures,
    extensionsUsed: root.listExtensionsUsed().map((e) => e.extensionName),
    bounds,
    orientation,
    scale,
    polygonBudget: { triangles, budget: TRIANGLE_BUDGET, withinBudget: triangles <= TRIANGLE_BUDGET },
    inspectedAt: new Date().toISOString(),
  };
  return { report, document: doc };
}
