import 'reflect-metadata';
import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogIntakeController } from '../src/modules/catalog-intake/catalog-intake.controller';
import { CatalogIntakeService } from '../src/modules/catalog-intake/catalog-intake.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { candidateFixture, sourceFixture } from './catalog-fixtures';

const accounts = new Map(Object.values(Role).map(role => [role, { id: role, email: `${role}@example.invalid`, role, status: 'ACTIVE' }]));
const catalog = Object.fromEntries(['createSource', 'listSources', 'revokeSource', 'prepare', 'listCandidates', 'findCandidate', 'review'].map(method => [method, jest.fn(async () => ({ ok: true }))]));
@Global()
@Module({ providers: [{ provide: PrismaService, useValue: { user: { findUnique: async ({ where }: any) => accounts.get(where.id) } } }], exports: [PrismaService] })
class PersistenceFixture {}
@Module({ imports: [PersistenceFixture, AuthModule], controllers: [CatalogIntakeController], providers: [{ provide: CatalogIntakeService, useValue: catalog }] })
class HttpFixture {}

const inventory = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'];
const routes = [
  { method: 'POST', path: '/sources', roles: ['SUPER_ADMIN', 'ADMIN'], body: sourceFixture() },
  { method: 'GET', path: '/sources', roles: inventory },
  { method: 'POST', path: '/sources/id/revoke', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { method: 'POST', path: '/candidates', roles: inventory, body: candidateFixture('source') },
  { method: 'GET', path: '/candidates', roles: inventory },
  { method: 'GET', path: '/candidates/id', roles: inventory },
  { method: 'POST', path: '/candidates/id/review', roles: inventory, body: { decision: 'ACCEPTED', note: 'Synthetic review' } },
];

describe('Staff catalog request boundaries', () => {
  let app: INestApplication;
  let origin: string;
  const signer = new JwtService({ secret: process.env.JWT_SECRET });
  const request = (method: string, path: string, role?: Role, body?: unknown) => fetch(origin + '/api/catalog-intake' + path, {
    method, headers: { 'content-type': 'application/json', ...(role ? { authorization: 'Bearer ' + signer.sign({ sub: role }, { expiresIn: '5m' }) } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  beforeAll(async () => {
    app = await NestFactory.create(HttpFixture, { logger: false, abortOnError: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1'); origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); });
  describe.each(routes)('$method $path', route => {
    it('rejects anonymous access', async () => { expect((await request(route.method, route.path, undefined, route.body)).status).toBe(401); });
    it.each(Object.values(Role))('enforces current %s role', async role => {
      expect((await request(route.method, route.path, role, route.body)).status).toBe(route.roles.includes(role) ? (route.method === 'POST' ? 201 : 200) : 403);
    });
  });
  it('passes the authenticated actor rather than a client actor ID', async () => {
    await request('POST', '/sources', 'ADMIN', sourceFixture());
    expect(catalog.createSource).toHaveBeenLastCalledWith(expect.anything(), 'ADMIN');
    expect((await request('POST', '/sources', 'ADMIN', { ...sourceFixture(), approvedById: 'SUPER_ADMIN' })).status).toBe(400);
  });
  it('rejects string permission flags despite global implicit conversion', async () => {
    expect((await request('POST', '/sources', 'ADMIN', { ...sourceFixture(), commercialUse: 'false' })).status).toBe(400);
    expect(catalog.createSource).not.toHaveBeenCalled();
  });
  it('rejects nested unauthorized fields and excessive pagination', async () => {
    const body = candidateFixture('source');
    expect((await request('POST', '/candidates', 'ADMIN', { ...body, identity: { ...body.identity, verified: true } })).status).toBe(400);
    expect((await request('GET', '/candidates?limit=51', 'ADMIN')).status).toBe(400);
    expect(catalog.prepare).not.toHaveBeenCalled();
  });
  it('rejects demoted and suspended callers using current persistence', async () => {
    const account = accounts.get('ADMIN')!;
    try {
      account.role = 'CUSTOMER';
      expect((await request('GET', '/sources', 'ADMIN')).status).toBe(403);
      account.role = 'ADMIN'; account.status = 'SUSPENDED';
      expect((await request('GET', '/sources', 'ADMIN')).status).toBe(401);
    } finally { account.role = 'ADMIN'; account.status = 'ACTIVE'; }
  });
});
