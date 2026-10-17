import { Document, PropertyType } from '@gltf-transform/core';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { getGltfIO } from './gltf-io';
import { TRIANGLE_BUDGET } from './gltf-inspector';

export interface OptimizeResult {
  buffer: Buffer;
  steps: string[];
  warnings: string[];
  /** Original material name -> unique name in the web model. */
  renamedMaterials: Record<string, string>;
}

const MAX_TEXTURE_SIZE = Number(process.env.MODEL_MAX_TEXTURE_SIZE || 2048);

function loadSharp(): any | null {
  try {
    // Optional: sharp enables texture resizing + WebP. Without it textures pass through unchanged.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('sharp');
  } catch {
    return null;
  }
}

/**
 * Prepare a source GLB for browser delivery without touching appearance:
 *  - give every material a unique, stable name (paint mapping targets names)
 *  - drop Draco (re-encoded with Meshopt, which three.js decodes via drei)
 *  - prune unused data, deduplicate accessors/meshes/textures (NOT materials,
 *    so paint never gets merged with trim that happens to share settings)
 *  - weld + simplify only when above the triangle budget
 *  - resize textures to <= MAX_TEXTURE_SIZE and encode WebP when sharp exists
 *  - Meshopt geometry compression
 */
export async function optimizeForWeb(document: Document, triangles: number): Promise<OptimizeResult> {
  const steps: string[] = [];
  const warnings: string[] = [];
  const renamedMaterials: Record<string, string> = {};
  const root = document.getRoot();

  const used = new Set<string>();
  root.listMaterials().forEach((m, i) => {
    const original = m.getName() || '';
    let name = (original || `material_${i}`).replace(/[^\w.\- ]+/g, '_').slice(0, 80);
    if (used.has(name)) name = `${name}__${i}`;
    used.add(name);
    if (name !== original) {
      renamedMaterials[original || `#${i}`] = name;
      m.setName(name);
    }
  });
  if (Object.keys(renamedMaterials).length) steps.push(`Renamed ${Object.keys(renamedMaterials).length} material(s) to unique names`);

  for (const ext of root.listExtensionsUsed()) {
    if (ext.extensionName === 'KHR_draco_mesh_compression' || ext.extensionName === 'EXT_meshopt_compression') {
      ext.dispose();
      steps.push(`Decoded ${ext.extensionName}`);
    }
  }

  await document.transform(
    prune({ keepAttributes: false, keepLeaves: false }),
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
  );
  steps.push('Pruned unused nodes/accessors and deduplicated geometry and textures');

  if (triangles > TRIANGLE_BUDGET) {
    await MeshoptSimplifier.ready;
    const ratio = Math.max(0.1, TRIANGLE_BUDGET / triangles);
    await document.transform(
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0008, lockBorder: true }),
    );
    steps.push(`Simplified geometry towards ${Math.round(ratio * 100)}% of ${triangles.toLocaleString()} triangles`);
  } else {
    await document.transform(weld());
    steps.push('Welded duplicate vertices');
  }

  const sharp = loadSharp();
  if (sharp && root.listTextures().length) {
    await document.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [MAX_TEXTURE_SIZE, MAX_TEXTURE_SIZE],
        quality: 85,
      }),
    );
    steps.push(`Resized textures to <= ${MAX_TEXTURE_SIZE}px and encoded WebP`);
  } else if (root.listTextures().length) {
    warnings.push('Texture compression skipped (sharp not installed) — textures delivered at source resolution');
  }

  await MeshoptEncoder.ready;
  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  steps.push('Applied Meshopt geometry compression (quantised, filtered)');

  const io = await getGltfIO();
  const buffer = Buffer.from(await io.writeBinary(document));
  return { buffer, steps, warnings, renamedMaterials };
}
