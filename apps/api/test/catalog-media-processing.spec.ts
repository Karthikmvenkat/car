import 'reflect-metadata';
const sharp: typeof import('sharp')['default'] = require('sharp');
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { CatalogImageProcessor } from '../src/modules/catalog-media/image-processor';
import { PrivateMediaStorage } from '../src/modules/catalog-media/private-media-storage';

const scratch = path.resolve(__dirname, '../../../.cache/media-tests');
const photo = () => sharp({ create: { width: 200, height: 100, channels: 3, background: '#123456' } }).png().toBuffer();
describe('Private image decoding and storage boundaries', () => {
  let image: Buffer;
  beforeAll(async () => { image = await photo(); await fs.mkdir(scratch, { recursive: true }); });
  it('retains original hash and produces bounded metadata-free WebP without enlargement', async () => {
    const oriented = await sharp(image).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await new CatalogImageProcessor().process(oriented);
    expect(result.originalHash).toBe(createHash('sha256').update(oriented).digest('hex'));
    expect(result.derivatives).toHaveLength(2);
    for (const derivative of result.derivatives) {
      const metadata = await sharp(derivative.data).metadata();
      expect(metadata).toMatchObject({ format: 'webp', width: 100, height: 200 });
      expect(metadata.exif).toBeUndefined(); expect(metadata.icc).toBeUndefined();
      expect(derivative.hash).toBe(createHash('sha256').update(derivative.data).digest('hex'));
    }
  });
  it.each(['<svg xmlns="http://www.w3.org/2000/svg"/>', 'GIF89a', 'not a photo'])('rejects unsupported input %s', async bytes => {
    await expect(new CatalogImageProcessor().process(Buffer.from(bytes))).rejects.toThrow();
  });
  it('rejects corrupt, excessive-byte and excessive-pixel inputs', async () => {
    const processor = new CatalogImageProcessor();
    await expect(processor.process(image.subarray(0, 40))).rejects.toThrow();
    await expect(processor.process(Buffer.alloc(8 * 1024 * 1024 + 1))).rejects.toThrow();
    const bomb = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: '#fff' } }).png().toBuffer();
    await expect(processor.process(bomb)).rejects.toThrow();
  });
  it('rejects animated PNG control chunks before decoding', async () => {
    const chunk = Buffer.alloc(20); chunk.writeUInt32BE(8); chunk.write('acTL', 4);
    const animated = Buffer.concat([image.subarray(0, 33), chunk, image.subarray(33)]);
    await expect(new CatalogImageProcessor().process(animated)).rejects.toThrow();
  });
  it('kills timed-out workers and recovers its processing slots', async () => {
    class StalledProcessor extends CatalogImageProcessor { protected workerScript = 'setInterval(() => {}, 1000)'; protected deadlineMs = 80; }
    const processor = new StalledProcessor();
    const results = await Promise.allSettled([processor.process(image), processor.process(image), processor.process(image)]);
    expect(results.every(result => result.status === 'rejected')).toBe(true);
    expect((results[2] as PromiseRejectedResult).reason.getStatus()).toBe(429);
    await expect(processor.process(image)).rejects.toMatchObject({ status: 400 });
  });
  it('rejects animated WebP and overlong edges even below pixel limit', async () => {
    const frames = Buffer.concat([Buffer.alloc(300, 0), Buffer.alloc(300, 255)]);
    const animated = await sharp(frames, { raw: { width: 10, height: 20, pageHeight: 10, channels: 3 } }).webp({ loop: 0, delay: [100,100] }).toBuffer();
    expect((await sharp(animated).metadata()).pages).toBe(2);
    await expect(new CatalogImageProcessor().process(animated)).rejects.toThrow();
    const long = await sharp({ create: { width: 9000, height: 1, channels: 3, background: '#fff' } }).png().toBuffer();
    await expect(new CatalogImageProcessor().process(long)).rejects.toThrow();
  });
  it('kills an aborted worker and releases capacity after exit', async () => {
    class Stalled extends CatalogImageProcessor { protected workerScript = 'setInterval(() => {}, 1000)'; }
    const abort = new AbortController(); const processor = new Stalled();
    const pending = processor.process(image, abort.signal); abort.abort();
    await expect(pending).rejects.toMatchObject({ status: 400 });
    await expect(processor.process(image, abort.signal)).rejects.toMatchObject({ status: 400 });
  });
  it('requires private configuration and rejects public roots and traversal keys', async () => {
    const storage = new PrivateMediaStorage(); const previous = process.env.CATALOG_MEDIA_ROOT;
    try {
      delete process.env.CATALOG_MEDIA_ROOT;
      await expect(storage.write(image, await new CatalogImageProcessor().process(image))).rejects.toThrow();
      process.env.CATALOG_MEDIA_ROOT = path.join(scratch, 'public', 'bad');
      await expect(storage.write(image, await new CatalogImageProcessor().process(image))).rejects.toThrow();
      await expect(storage.read('../escape', 'preview', 'x', 1)).rejects.toThrow();
    } finally { if (previous === undefined) delete process.env.CATALOG_MEDIA_ROOT; else process.env.CATALOG_MEDIA_ROOT = previous; }
  });
  it('stores immutable private sets, verifies hashes and rejects junction aliases', async () => {
    const root = await fs.mkdtemp(path.join(scratch, 'private-')); const previous = process.env.CATALOG_MEDIA_ROOT;
    try {
      process.env.CATALOG_MEDIA_ROOT = root;
      const storage = new PrivateMediaStorage(); const processed = await new CatalogImageProcessor().process(image);
      const key = await storage.write(image, processed);
      const preview = processed.derivatives[0];
      expect(await storage.read(key, preview.variant, preview.hash, preview.data.length)).toEqual(preview.data);
      expect(await fs.readFile(path.join(root, key, 'original.bin'))).toEqual(image);
      await fs.writeFile(path.join(root, key, 'preview.webp'), Buffer.from('tampered fixture'));
      await expect(storage.read(key, 'preview', preview.hash, preview.data.length)).rejects.toThrow();
      const alias = root + '-alias'; await fs.symlink(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
      process.env.CATALOG_MEDIA_ROOT = alias;
      await expect(storage.write(image, processed)).rejects.toThrow();
    } finally { if (previous === undefined) delete process.env.CATALOG_MEDIA_ROOT; else process.env.CATALOG_MEDIA_ROOT = previous; }
  });
});
