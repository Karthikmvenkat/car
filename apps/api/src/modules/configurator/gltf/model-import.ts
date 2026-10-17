import AdmZip = require('adm-zip');
import * as path from 'path';
import { checkGlbHeader, getGltfIO } from './gltf-io';

const MAX_ZIP_ENTRIES = 600;
const MAX_UNCOMPRESSED_RATIO = 8;
const ALLOWED_ZIP_EXT = new Set(['.gltf', '.bin', '.png', '.jpg', '.jpeg', '.webp', '.ktx2', '.txt', '.md', '.json']);

/**
 * Convert a glTF .zip archive (gltf + bin + textures) into a single GLB.
 * Guards against path traversal, zip bombs and unexpected file types.
 */
export async function gltfZipToGlb(zipBuffer: Buffer, maxUncompressedBytes: number): Promise<Buffer> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  if (entries.length > MAX_ZIP_ENTRIES) throw new Error(`Archive has too many files (${entries.length})`);

  let declaredTotal = 0;
  for (const e of entries) {
    const name = e.entryName.replace(/\\/g, '/');
    if (name.startsWith('/') || name.split('/').includes('..') || /^[a-z]:/i.test(name)) {
      throw new Error(`Unsafe path in archive: ${name}`);
    }
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_ZIP_EXT.has(ext) && !name.startsWith('__MACOSX/')) {
      throw new Error(`Unexpected file type in archive: ${name}`);
    }
    declaredTotal += e.header.size;
  }
  const cap = Math.min(maxUncompressedBytes, zipBuffer.length * MAX_UNCOMPRESSED_RATIO + 50_000_000);
  if (declaredTotal > cap) throw new Error('Archive expands beyond the allowed size');

  const gltfEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.gltf') && !e.entryName.startsWith('__MACOSX/'));
  if (gltfEntries.length === 0) throw new Error('Archive contains no .gltf file');
  // Prefer the shallowest .gltf (Sketchfab ships scene.gltf at the root).
  gltfEntries.sort((a, b) => a.entryName.split('/').length - b.entryName.split('/').length);
  const main = gltfEntries[0];
  const baseDir = path.posix.dirname(main.entryName.replace(/\\/g, '/'));

  let actualTotal = 0;
  const resources: Record<string, Uint8Array<ArrayBuffer>> = {};
  for (const e of entries) {
    const name = e.entryName.replace(/\\/g, '/');
    if (e === main || name.startsWith('__MACOSX/')) continue;
    const data = e.getData();
    actualTotal += data.length;
    if (actualTotal > cap) throw new Error('Archive expands beyond the allowed size');
    const rel = baseDir === '.' ? name : path.posix.relative(baseDir, name);
    resources[rel] = new Uint8Array(data);
  }

  const json = JSON.parse(main.getData().toString('utf8'));
  // Map URI-encoded references (e.g. "textures/Body%20Paint.png") onto archive entries.
  for (const list of [json.buffers || [], json.images || []]) {
    for (const item of list) {
      if (typeof item.uri === 'string' && !item.uri.startsWith('data:')) {
        const decoded = decodeURIComponent(item.uri);
        if (!resources[item.uri] && resources[decoded]) resources[item.uri] = resources[decoded];
      }
    }
  }

  const io = await getGltfIO();
  const doc = await io.readJSON({ json, resources });
  return Buffer.from(await io.writeBinary(doc));
}

/** Normalise any supported download/upload to a validated GLB buffer. */
export async function toGlb(buffer: Buffer, format: 'glb' | 'gltf-zip', maxBytes: number): Promise<Buffer> {
  const glb = format === 'glb' ? buffer : await gltfZipToGlb(buffer, maxBytes * 4);
  const header = checkGlbHeader(glb);
  if (!header.ok) throw new Error(header.error);
  return glb;
}
