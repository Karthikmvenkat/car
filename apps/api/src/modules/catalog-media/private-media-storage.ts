import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { hashBytes, MAX_IMAGE_BYTES, ProcessedImage } from './image-processor';

const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const normalized = (value: string) => process.platform === 'win32' ? value.toLowerCase() : value;
const within = (child: string, parent: string) => { const relative = path.relative(normalized(parent), normalized(child)); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); };

@Injectable()
export class PrivateMediaStorage {
  private async root(): Promise<string> {
    const configured = process.env.CATALOG_MEDIA_ROOT;
    if (!configured || !path.isAbsolute(configured)) throw new Error('Private root must be explicitly configured');
    const root = path.resolve(configured);
    if (root.split(/[\\/]/).some(part => ['uploads','public','out','.next'].includes(part.toLowerCase()))) throw new Error('Public path');
    const publicRoots = [path.resolve(process.env.UPLOAD_DIR || 'uploads'), path.resolve('uploads'), path.resolve('apps/api/uploads'), path.resolve('apps/web/public'), path.resolve('apps/web/out')];
    for (const publicRoot of publicRoots) {
      if (within(root, publicRoot) || within(publicRoot, root)) throw new Error('Overlapping public path');
      try { const realPublic = await fs.realpath(publicRoot); if (within(root, realPublic) || within(realPublic, root)) throw new Error('Overlapping real public path'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    // Check existing ancestors before mkdir, then check again after creation.
    const checkAncestors = async () => {
      let current = root;
      while (true) {
        try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Symlink/junction path'); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
        const parent = path.dirname(current); if (parent === current) break; current = parent;
      }
    };
    await checkAncestors();
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    await checkAncestors();
    if (normalized(await fs.realpath(root)) !== normalized(root)) throw new Error('Aliased root');
    return root;
  }

  async write(original: Buffer, processed: ProcessedImage): Promise<string> {
    try {
      const root = await this.root(); const key = randomUUID(); const directory = path.join(root, key);
      await fs.mkdir(directory, { mode: 0o700 });
      // DB references are created only after all exclusive writes succeed. A
      // partial failure leaves an unreferenced private directory for reconciliation.
      const entries = [['original.bin', original], ...processed.derivatives.map(item => [item.variant + '.webp', item.data])] as [string, Buffer][];
      for (const [name, bytes] of entries) {
        const handle = await fs.open(path.join(directory, name), 'wx', 0o600);
        try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      }
      return key;
    } catch { throw new ServiceUnavailableException('Private media storage unavailable'); }
  }

  async read(key: string, variant: string, expectedHash: string, expectedBytes: number): Promise<Buffer> {
    try {
      if (!keyPattern.test(key) || !['preview','thumbnail'].includes(variant) || !/^[a-f0-9]{64}$/.test(expectedHash) || expectedBytes < 1 || expectedBytes > MAX_IMAGE_BYTES) throw new Error();
      const root = await this.root(); const directory = path.join(root, key); const file = path.join(directory, variant + '.webp');
      if ((await fs.lstat(directory)).isSymbolicLink() || (await fs.lstat(file)).isSymbolicLink()) throw new Error();
      const handle = await fs.open(file, 'r');
      try {
        const stat = await handle.stat(); if (!stat.isFile() || stat.size !== expectedBytes) throw new Error();
        const bytes = Buffer.alloc(expectedBytes); const result = await handle.read(bytes, 0, bytes.length, 0);
        if (result.bytesRead !== expectedBytes || hashBytes(bytes) !== expectedHash) throw new Error();
        return bytes;
      } finally { await handle.close(); }
    } catch { throw new ServiceUnavailableException('Private media is unavailable or failed integrity validation'); }
  }
}
