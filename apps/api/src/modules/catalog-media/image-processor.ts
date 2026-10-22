import { BadRequestException, HttpException, Injectable, PayloadTooLargeException, ServiceUnavailableException } from '@nestjs/common';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { IMAGE_WORKER } from './image-worker';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const hashBytes = (data: Buffer) => createHash('sha256').update(data).digest('hex');
export type Derivative = { variant: 'preview' | 'thumbnail'; width: number; height: number; hash: string; data: Buffer };
export type ProcessedImage = { originalHash: string; format: string; width: number; height: number; derivatives: Derivative[] };

function validateSignature(input: Buffer) {
  if (!Buffer.isBuffer(input) || !input.length) throw new BadRequestException('An image is required');
  if (input.length > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('Image exceeds 8 MiB');
  const png = input.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  const webp = input.toString('ascii', 0, 4) === 'RIFF' && input.toString('ascii', 8, 12) === 'WEBP';
  if (!png && !jpeg && !webp) throw new BadRequestException('Only static JPEG, PNG and WebP images are supported');
  if (png) {
    let at = 8;
    while (at + 12 <= input.length) {
      const length = input.readUInt32BE(at);
      if (at + 12 + length > input.length) throw new BadRequestException('Invalid image');
      if (input.toString('ascii', at + 4, at + 8) === 'acTL') throw new BadRequestException('Animated images are not supported');
      at += length + 12;
    }
  }
  // MPO is a multi-picture JPEG container, outside this static-photo recipe.
  if (jpeg && input.includes(Buffer.from('MPF\0', 'ascii'))) throw new BadRequestException('Multi-picture images are not supported');
}

@Injectable()
export class CatalogImageProcessor {
  protected workerScript = IMAGE_WORKER;
  protected deadlineMs = 15000;
  private running = 0;

  async process(input: Buffer, signal?: AbortSignal): Promise<ProcessedImage> {
    validateSignature(input);
    if (signal?.aborted) throw new BadRequestException('Image preparation was cancelled');
    if (this.running >= 2) throw new HttpException('Image processing is busy; retry later', 429);
    this.running++;
    try {
      return await new Promise<ProcessedImage>((resolve, reject) => {
        const child = spawn(process.execPath, ['--max-old-space-size=128', '-e', this.workerScript, require.resolve('sharp')], {
          windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'],
          env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, UV_THREADPOOL_SIZE: '1', NODE_ENV: 'production' },
        });
        let failed = false; let infrastructureFailure = false; let outputBytes = 0;
        const chunks: Buffer[] = [];
        const stop = () => { failed = true; child.kill('SIGKILL'); };
        const timer = setTimeout(stop, this.deadlineMs);
        signal?.addEventListener('abort', stop, { once: true });
        if (signal?.aborted) stop();
        child.on('error', () => { infrastructureFailure = true; stop(); });
        child.stdin.on('error', () => { failed = true; });
        child.stdout.on('data', (chunk: Buffer) => {
          outputBytes += chunk.length;
          if (outputBytes > 6 * 1024 * 1024) stop(); else chunks.push(chunk);
        });
        // Capacity is released only after close: the decoder has actually exited.
        child.on('close', code => {
          clearTimeout(timer);
          signal?.removeEventListener('abort', stop);
          if (infrastructureFailure) return reject(new ServiceUnavailableException('Image processor unavailable'));
          if (failed || code !== 0) return reject(new BadRequestException('Image could not be safely processed'));
          try {
            const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!['jpeg','png','webp'].includes(result.format) || !Number.isInteger(result.width) || !Number.isInteger(result.height) || result.width <= 0 || result.height <= 0 || result.width > 8192 || result.height > 8192 || result.width * result.height > 16000000 || result.derivatives?.length !== 2) throw new Error();
            const derivatives: Derivative[] = result.derivatives.map((item: any, i: number) => {
              const bound = i === 0 ? 1600 : 400;
              if (item.variant !== (i === 0 ? 'preview' : 'thumbnail') || !Number.isInteger(item.width) || !Number.isInteger(item.height) || item.width <= 0 || item.height <= 0 || item.width > bound || item.height > bound || typeof item.data !== 'string') throw new Error();
              const data = Buffer.from(item.data, 'base64');
              if (!data.length || data.length > 2 * 1024 * 1024) throw new Error();
              return { variant: item.variant, width: item.width, height: item.height, hash: hashBytes(data), data };
            });
            resolve({ originalHash: hashBytes(input), format: result.format, width: result.width, height: result.height, derivatives });
          } catch { reject(new BadRequestException('Image could not be safely processed')); }
        });
        child.stdin.end(input);
      });
    } finally { this.running--; }
  }
}
