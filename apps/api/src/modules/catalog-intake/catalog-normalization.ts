import { BadRequestException, ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { CatalogFactDto } from './catalog-intake.dto';

export const DICTIONARY_VERSION = 1;
const DAY = 86_400_000;
type Definition = { unit: string; max: number; factors: Record<string, number>; integer?: boolean };
const dimensions: Definition = { unit: 'mm', max: 15000, factors: { mm: 1, cm: 10, m: 1000 } };
const dictionary: Record<string, Definition> = {
  engineDisplacementCc: { unit: 'cc', max: 10000, factors: { cc: 1, L: 1000 } },
  maxPowerKw: { unit: 'kW', max: 2000, factors: { kW: 1, PS: 0.73549875, bhp: 0.745699872 } },
  lengthMm: dimensions, widthMm: dimensions, heightMm: dimensions,
  seats: { unit: 'count', max: 20, factors: { count: 1 }, integer: true },
  rangeKm: { unit: 'km', max: 3000, factors: { km: 1 } },
  batteryKwh: { unit: 'kWh', max: 1000, factors: { kWh: 1 } },
};

export function referenceUrl(value: string, expectedHost?: string): URL {
  // No network operation: these URLs are private evidence metadata only.
  try {
    if (value.length > 2048 || /[\s\u0000-\u001f\u007f\\]/.test(value)) throw new Error();
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash ||
        (url.port && url.port !== '443') || (expectedHost && url.hostname !== expectedHost)) throw new Error();
    return url;
  } catch {
    throw new BadRequestException('Evidence must use an HTTPS reference on the approved host without credentials, query or fragment');
  }
}

export function isFresh(value: Date | string, now = new Date()): boolean {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time <= now.getTime() && time >= now.getTime() - 90 * DAY;
}

export function requireFresh(value: Date | string, now: Date) {
  if (!isFresh(value, now)) throw new ConflictException('Evidence must be observed within the last 90 days and not in the future');
}

export function normalizeFacts(facts: CatalogFactDto[], host: string, now: Date) {
  const seen = new Set<string>();
  return facts.map(fact => {
    const definition = Object.prototype.hasOwnProperty.call(dictionary, fact.field) ? dictionary[fact.field] : undefined;
    const factor = definition && Object.prototype.hasOwnProperty.call(definition.factors, fact.unit) ? definition.factors[fact.unit] : undefined;
    if (!definition || factor === undefined || seen.has(fact.field)) throw new BadRequestException('Unsupported or duplicate specification field/unit');
    seen.add(fact.field);
    referenceUrl(fact.evidenceUrl, host);
    requireFresh(fact.observedAt, now);
    const normalizedValue = Math.round(fact.value * factor * 1_000_000) / 1_000_000;
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0 || normalizedValue > definition.max ||
        (definition.integer && !Number.isInteger(normalizedValue))) throw new BadRequestException('Specification value outside supported range');
    return { ...fact, normalizedValue, normalizedUnit: definition.unit };
  });
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}';
  return JSON.stringify(value);
}
export function inputHash(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}
