import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { inputHash, isFresh, normalizeFacts, referenceUrl } from '../src/modules/catalog-intake/catalog-normalization';
import { CreateCatalogSourceDto, PrepareCatalogCandidateDto } from '../src/modules/catalog-intake/catalog-intake.dto';
import { sourceFixture, candidateFixture } from './catalog-fixtures';

const now = new Date('2026-10-17T12:00:00Z');
const fact = (overrides = {}) => ({ field: 'maxPowerKw', value: 100, unit: 'PS', rawText: '100 PS', evidenceUrl: 'https://fixture.example.invalid/spec', observedAt: now.toISOString(), ...overrides });
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } });
const validate = (value: unknown, metatype: any) => pipe.transform(value, { type: 'body', metatype });

describe('Catalog evidence normalization and DTO boundaries', () => {
  it('normalizes units while preserving original evidence', () => {
    expect(normalizeFacts([fact()], 'fixture.example.invalid', now)[0]).toEqual({ ...fact(), normalizedValue: 73.549875, normalizedUnit: 'kW' });
    expect(normalizeFacts([fact({ field: 'lengthMm', value: 4.2, unit: 'm' })], 'fixture.example.invalid', now)[0].normalizedValue).toBe(4200);
  });
  it.each([{ unit: 'hp' }, { value: 0 }, { value: Infinity }, { value: -1 }, { field: 'seats', unit: 'count', value: 2.5 }, { field: 'seats', unit: 'count', value: 21 }, { field: 'unknown' }, { field: '__proto__' }, { unit: 'toString' }, { value: 0.00000001 }])('rejects invalid field/value/unit %j', overrides => {
    expect(() => normalizeFacts([fact(overrides)], 'fixture.example.invalid', now)).toThrow();
  });
  it('rejects duplicate facts', () => { expect(() => normalizeFacts([fact(), fact()], 'fixture.example.invalid', now)).toThrow(); });
  it.each(['http://fixture.example.invalid/x', 'https://user:pass@fixture.example.invalid/x', 'https://fixture.example.invalid/x?token=secret', 'https://fixture.example.invalid/x#x', 'https://other.example.invalid/x', 'https://fixture.example.invalid.evil/x', 'https://fixture.example.invalid:8443/x', 'https://fixture.example.invalid/\nx', 'https://fixture.example.invalid\\x'])('rejects unsafe/mismatched evidence reference %s', url => {
    expect(() => referenceUrl(url, 'fixture.example.invalid')).toThrow();
  });
  it('handles exact evidence age and future boundaries', () => {
    expect(isFresh(new Date(now.getTime() - 90 * 86400000), now)).toBe(true);
    expect(isFresh(new Date(now.getTime() - 90 * 86400000 - 1), now)).toBe(false);
    expect(isFresh(new Date(now.getTime() + 1), now)).toBe(false);
    expect(isFresh('invalid', now)).toBe(false);
  });
  it('hashes object keys canonically without erasing content differences', () => {
    expect(inputHash({ a: 1, b: { c: 2 } })).toBe(inputHash({ b: { c: 2 }, a: 1 }));
    expect(inputHash({ a: 1 })).not.toBe(inputHash({ a: 2 }));
  });
  it('rejects unknown nested properties and nonnumeric numbers', async () => {
    const value = candidateFixture('source');
    await expect(validate({ ...value, identity: { ...value.identity, approved: true } }, PrepareCatalogCandidateDto)).rejects.toThrow();
    await expect(validate({ ...value, facts: [{ ...value.facts[0], normalizedValue: 500 }] }, PrepareCatalogCandidateDto)).rejects.toThrow();
    await expect(validate({ ...value, facts: [{ ...value.facts[0], value: '50' }] }, PrepareCatalogCandidateDto)).rejects.toThrow();
    await expect(validate({ ...value, identity: { ...value.identity, market: 'US' } }, PrepareCatalogCandidateDto)).rejects.toThrow();
    await expect(validate({ ...value, facts: [] }, PrepareCatalogCandidateDto)).rejects.toThrow();
    await expect(validate({ ...value, facts: Array(17).fill(value.facts[0]) }, PrepareCatalogCandidateDto)).rejects.toThrow();
  });
  it('requires actual true JSON permission flags and meaningful text', async () => {
    for (const commercialUse of [false, 'true', 'false', 1, null]) await expect(validate({ ...sourceFixture(), commercialUse }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), evidenceRef: '  ' }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), attribution: 123 }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), validUntil: '2026-10-18' }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), validUntil: '2026-10-18T12:00:00' }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), license: 'CC_BY_NC' }, CreateCatalogSourceDto)).rejects.toThrow();
    await expect(validate({ ...sourceFixture(), name: '  Synthetic  ' }, CreateCatalogSourceDto)).resolves.toMatchObject({ name: 'Synthetic' });
  });
});
