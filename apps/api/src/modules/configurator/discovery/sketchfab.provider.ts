import { Injectable, Logger } from '@nestjs/common';
import { TransientError } from '../pipeline/stages';
import { safeFetch } from '../security/safe-fetch';
import {
  classifyLicence,
  DownloadedModel,
  ModelCandidate,
  ModelSourceProvider,
  VehicleQuery,
} from './model-source';

const API = 'https://api.sketchfab.com/v3';

const LICENCE_URLS: Record<string, string> = {
  'CC Attribution': 'https://creativecommons.org/licenses/by/4.0/',
  'CC Attribution-ShareAlike': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC Attribution-NoDerivs': 'https://creativecommons.org/licenses/by-nd/4.0/',
  'CC Attribution-NonCommercial': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'CC Attribution-NonCommercial-ShareAlike': 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  'CC Attribution-NonCommercial-NoDerivs': 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  'CC0 Public Domain': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Free Standard': 'https://sketchfab.com/licenses',
  Standard: 'https://sketchfab.com/licenses',
  Editorial: 'https://sketchfab.com/licenses',
};

/**
 * Sketchfab Data API v3 adapter.
 * - Search is public (no token needed).
 * - Download requires SKETCHFAB_API_TOKEN (user API token from
 *   https://sketchfab.com/settings/password) and the model must be downloadable.
 */
@Injectable()
export class SketchfabProvider implements ModelSourceProvider {
  readonly id = 'sketchfab';
  private readonly logger = new Logger(SketchfabProvider.name);

  private get token(): string | undefined {
    return process.env.SKETCHFAB_API_TOKEN || undefined;
  }

  isConfigured(): boolean {
    return process.env.SKETCHFAB_DISABLED !== 'true';
  }

  canDownload(): boolean {
    return !!this.token;
  }

  async search(query: VehicleQuery, limit: number): Promise<ModelCandidate[]> {
    const queries = [
      `${query.make} ${query.model} ${query.year}`,
      `${query.make} ${query.model}`,
    ];
    const seen = new Map<string, ModelCandidate>();

    for (const q of queries) {
      const url = new URL(`${API}/search`);
      url.searchParams.set('type', 'models');
      url.searchParams.set('q', q);
      url.searchParams.set('downloadable', 'true');
      url.searchParams.set('count', String(Math.min(24, limit * 2)));
      url.searchParams.set('categories', 'cars-vehicles');

      const res = await this.request(url.toString());
      const body = (await res.json()) as { results?: any[] };
      for (const r of body.results || []) {
        if (!seen.has(r.uid)) seen.set(r.uid, this.toCandidate(r));
      }
      if (seen.size >= limit * 2) break;
    }
    return [...seen.values()];
  }

  async download(uid: string, maxBytes: number): Promise<DownloadedModel> {
    if (!this.token) {
      throw new Error('SKETCHFAB_API_TOKEN is not configured — downloads are disabled');
    }
    if (!/^[a-f0-9]{32}$/.test(uid)) throw new Error('Invalid Sketchfab model id');

    const res = await this.request(`${API}/models/${uid}/download`, {
      headers: { Authorization: `Token ${this.token}` },
    });
    const links = (await res.json()) as Record<string, { url: string; size: number } | undefined>;

    const choice = links.glb
      ? { ...links.glb, format: 'glb' as const }
      : links.gltf
        ? { ...links.gltf, format: 'gltf-zip' as const }
        : null;
    if (!choice) throw new Error('Model has no GLB or glTF download');
    if (choice.size > maxBytes) {
      throw new Error(
        `Archive is ${(choice.size / 1e6).toFixed(1)} MB, above the ${(maxBytes / 1e6).toFixed(0)} MB limit`,
      );
    }

    const file = await safeFetch(choice.url, {
      maxBytes,
      allowedHosts: ['sketchfab-prod-media.s3.amazonaws.com', '.sketchfab.com', '.amazonaws.com', '.cloudfront.net'],
    });
    return {
      buffer: file,
      format: choice.format,
      filename: `sketchfab-${uid}.${choice.format === 'glb' ? 'glb' : 'zip'}`,
    };
  }

  private toCandidate(r: any): ModelCandidate {
    const label: string = r.license?.label || 'Unknown licence';
    const licence = classifyLicence(label, LICENCE_URLS[label]);
    const author = r.user?.displayName || r.user?.username;
    if (licence.requiresAttribution) {
      licence.attributionText = `"${r.name}" by ${author} (${r.viewerUrl}) is licensed under ${label}${
        licence.url ? ` (${licence.url})` : ''
      }`;
    }
    const thumbs: any[] = r.thumbnails?.images || [];
    const thumb =
      thumbs.find((t) => t.width >= 640 && t.width <= 1024) ||
      thumbs.sort((a, b) => b.width - a.width)[0];
    const archive = (a: any) =>
      a ? { sizeBytes: a.size, faceCount: a.faceCount ?? undefined, textureCount: a.textureCount ?? undefined } : undefined;

    return {
      provider: this.id,
      externalId: r.uid,
      name: r.name,
      description: (r.description || '').slice(0, 600),
      tags: (r.tags || []).map((t: any) => t.name),
      sourceUrl: r.viewerUrl,
      thumbnailUrl: thumb?.url,
      author,
      authorUrl: r.user?.profileUrl,
      licence,
      faceCount: r.faceCount,
      vertexCount: r.vertexCount,
      archives: { glb: archive(r.archives?.glb), gltf: archive(r.archives?.gltf) },
      downloadable: !!r.isDownloadable,
      publishedAt: r.publishedAt,
    };
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      throw new TransientError(`Sketchfab request failed: ${(err as Error).message}`);
    }
    if (res.status === 429 || res.status >= 500) {
      throw new TransientError(`Sketchfab responded ${res.status}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sketchfab rejected the API token or the model is not downloadable');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Sketchfab responded ${res.status}: ${text.slice(0, 200)}`);
    }
    return res;
  }
}
