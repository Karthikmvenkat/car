import { Injectable } from '@nestjs/common';
import { TransientError } from '../pipeline/stages';
import { GeneratedImage, ImageGenerationRequest, ImageProvider } from './image-provider';

/** Rough per-image list prices (USD) used for cost tracking only. */
const COST_TABLE: Record<string, Record<string, number>> = {
  low: { '1024x1024': 0.011, '1536x1024': 0.016, '1024x1536': 0.016 },
  medium: { '1024x1024': 0.042, '1536x1024': 0.063, '1024x1536': 0.063 },
  high: { '1024x1024': 0.167, '1536x1024': 0.25, '1024x1536': 0.25 },
};

/**
 * OpenAI Images adapter (server-side only; the key never reaches the browser).
 * Env: OPENAI_API_KEY (required), OPENAI_IMAGE_MODEL (default gpt-image-1),
 *      OPENAI_IMAGE_QUALITY low|medium|high (default medium).
 */
@Injectable()
export class OpenAIImageProvider implements ImageProvider {
  readonly id = 'openai';

  private get apiKey() {
    return process.env.OPENAI_API_KEY || '';
  }
  private get model() {
    return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  }
  private get quality() {
    const q = process.env.OPENAI_IMAGE_QUALITY || 'medium';
    return ['low', 'medium', 'high'].includes(q) ? q : 'medium';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 10;
  }

  async generate(req: ImageGenerationRequest): Promise<GeneratedImage> {
    if (!this.isConfigured()) throw new Error('OPENAI_API_KEY is not configured');
    const size = req.size || '1536x1024';
    const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    let res: Response;
    try {
      if (req.referenceImages?.length) {
        const form = new FormData();
        form.append('model', this.model);
        form.append('prompt', req.prompt);
        form.append('size', size);
        form.append('quality', this.quality);
        form.append('n', '1');
        for (const img of req.referenceImages.slice(0, 4)) {
          form.append('image[]', new Blob([new Uint8Array(img.buffer)], { type: img.mimeType }), img.filename);
        }
        res = await fetch(`${base}/images/edits`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}` },
          body: form,
          signal: AbortSignal.timeout(180_000),
        });
      } else {
        res = await fetch(`${base}/images/generations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.model, prompt: req.prompt, size, quality: this.quality, n: 1 }),
          signal: AbortSignal.timeout(180_000),
        });
      }
    } catch (err) {
      throw new TransientError(`OpenAI request failed: ${(err as Error).message}`);
    }

    if (res.status === 429 || res.status >= 500) {
      throw new TransientError(`OpenAI responded ${res.status}`);
    }
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(`OpenAI image error ${res.status}: ${body?.error?.message || 'unknown error'}`);
    }
    const item = body?.data?.[0];
    if (!item?.b64_json) throw new Error('OpenAI returned no image data');

    return {
      buffer: Buffer.from(item.b64_json, 'base64'),
      mimeType: 'image/png',
      model: this.model,
      revisedPrompt: item.revised_prompt,
      estimatedUsd: COST_TABLE[this.quality]?.[size] ?? 0.06,
    };
  }
}
