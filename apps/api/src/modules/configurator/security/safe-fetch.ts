import { promises as dns } from 'dns';
import * as net from 'net';
import { TransientError } from '../pipeline/stages';

export interface SafeFetchOptions {
  maxBytes: number;
  /** Exact hostnames, or suffixes starting with "." (e.g. ".amazonaws.com"). */
  allowedHosts: string[];
  timeoutMs?: number;
  headers?: Record<string, string>;
  maxRedirects?: number;
}

function hostAllowed(host: string, allowed: string[]): boolean {
  const h = host.toLowerCase();
  return allowed.some((a) => (a.startsWith('.') ? h.endsWith(a) || h === a.slice(1) : h === a));
}

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

/** Reject URLs that are not https, not allow-listed, or resolve to private networks (SSRF guard). */
export async function assertSafeUrl(rawUrl: string, allowedHosts: string[]): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (url.protocol !== 'https:') throw new Error('Only https URLs are allowed');
  if (url.username || url.password) throw new Error('Credentials in URLs are not allowed');
  if (!hostAllowed(url.hostname, allowedHosts)) {
    throw new Error(`Host ${url.hostname} is not on the download allow-list`);
  }
  const addresses: Array<{ address: string }> = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new TransientError(`Could not resolve ${url.hostname}`);
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error(`Host ${url.hostname} resolves to a private address`);
  }
  return url;
}

/**
 * Download a remote file with an SSRF guard, redirect re-validation,
 * a timeout and a hard byte limit enforced while streaming.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions): Promise<Buffer> {
  let current = rawUrl;
  const maxRedirects = opts.maxRedirects ?? 3;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertSafeUrl(current, opts.allowedHosts);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: opts.headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
      });
    } catch (err) {
      throw new TransientError(`Download failed: ${(err as Error).message}`);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      current = new URL(location, url).toString();
      continue;
    }
    if (res.status === 429 || res.status >= 500) throw new TransientError(`Download responded ${res.status}`);
    if (!res.ok || !res.body) throw new Error(`Download responded ${res.status}`);

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > opts.maxBytes) throw new Error(`File exceeds ${opts.maxBytes} bytes`);

    const chunks: Buffer[] = [];
    let total = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > opts.maxBytes) {
        await reader.cancel();
        throw new Error(`File exceeds ${opts.maxBytes} bytes`);
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Too many redirects');
}
