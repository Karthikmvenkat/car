import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface StoredObject {
  storageKey: string;
  /** Public URL path. Relative ("/uploads/...") for local disk; absolute for CDN-backed providers. */
  url: string;
  sizeBytes: number;
  contentHash: string;
}

/**
 * Object storage adapter. The default implementation writes to local disk and
 * is served by Express at /uploads. Swap for an S3/CDN implementation in
 * production (local disk on Koyeb/Render is ephemeral).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  readonly rootDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
  readonly publicPrefix = '/uploads';

  static hash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  async put(folder: string, filename: string, buffer: Buffer): Promise<StoredObject> {
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/\.\./g, '_');
    const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const base = path
      .basename(filename, path.extname(filename))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 60);
    const storageKey = `${safeFolder}/${base || 'file'}-${randomBytes(4).toString('hex')}${ext}`;
    const absolute = this.resolveKey(storageKey);

    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, buffer);

    return {
      storageKey,
      url: `${this.publicPrefix}/${storageKey}`,
      sizeBytes: buffer.length,
      contentHash: StorageService.hash(buffer),
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(storageKey));
    } catch (err) {
      this.logger.warn(`Could not delete ${storageKey}: ${(err as Error).message}`);
    }
  }

  /** Resolve a key to an absolute path, refusing anything that escapes the storage root. */
  private resolveKey(storageKey: string): string {
    const absolute = path.resolve(this.rootDir, storageKey);
    if (!absolute.startsWith(this.rootDir + path.sep)) {
      throw new Error('Invalid storage key');
    }
    return absolute;
  }
}
