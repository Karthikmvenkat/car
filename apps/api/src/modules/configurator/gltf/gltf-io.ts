import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

let ioPromise: Promise<NodeIO> | null = null;

/**
 * Shared glTF IO with every Khronos/EXT extension registered, plus Draco
 * decoding and Meshopt encode/decode, so we can read whatever providers ship.
 * Network fetches for external URIs are disabled — only embedded / supplied
 * resources are read.
 */
export function getGltfIO(): Promise<NodeIO> {
  if (!ioPromise) {
    ioPromise = (async () => {
      // draco3dgltf ships no types.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const draco3d = require('draco3dgltf');
      await MeshoptDecoder.ready;
      await MeshoptEncoder.ready;
      return new NodeIO()
        .setAllowNetwork(false)
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({
          'draco3d.decoder': await draco3d.createDecoderModule(),
          'meshopt.decoder': MeshoptDecoder,
          'meshopt.encoder': MeshoptEncoder,
        });
    })().catch((err) => {
      ioPromise = null;
      throw err;
    });
  }
  return ioPromise;
}

/** Validates GLB container header: magic "glTF", version 2, declared length. */
export function checkGlbHeader(buffer: Buffer): { ok: boolean; error?: string } {
  if (buffer.length < 20) return { ok: false, error: 'File too small to be a GLB' };
  if (buffer.toString('ascii', 0, 4) !== 'glTF') return { ok: false, error: 'Not a GLB file (bad magic bytes)' };
  const version = buffer.readUInt32LE(4);
  if (version !== 2) return { ok: false, error: `Unsupported glTF container version ${version}` };
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) {
    return { ok: false, error: `Truncated or padded GLB (header says ${declaredLength} bytes, got ${buffer.length})` };
  }
  const chunkType = buffer.toString('ascii', 16, 20);
  if (chunkType !== 'JSON') return { ok: false, error: 'First GLB chunk is not JSON' };
  return { ok: true };
}
