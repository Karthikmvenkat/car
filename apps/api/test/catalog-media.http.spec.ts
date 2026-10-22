import 'reflect-metadata';
import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Subject } from 'rxjs';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CatalogMediaController } from '../src/modules/catalog-media/catalog-media.controller';
import { CatalogMediaService } from '../src/modules/catalog-media/catalog-media.service';
import { MediaPrivacyHeadersInterceptor, MediaUploadLeaseInterceptor } from '../src/modules/catalog-media/upload-lease.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { mediaMetadata } from './media-fixtures';
const accounts = new Map<string, any>(Object.values(Role).map(role => [role, { id: role, email: `${role}@example.invalid`, role, status: 'ACTIVE' }]));
const media: Record<string, jest.Mock> = Object.fromEntries(['upload','list','find','review','withdraw'].map(method => [method, jest.fn(async () => ({ ok: true }))]));
media.derivative = jest.fn(async () => Buffer.from('synthetic derivative'));
@Global()
@Module({ providers: [{ provide: PrismaService, useValue: { user: { findUnique: async ({ where }: any) => accounts.get(where.id) } } }], exports: [PrismaService] })
class Persistence {}
@Module({ imports: [Persistence, AuthModule], controllers: [CatalogMediaController], providers: [{ provide: CatalogMediaService, useValue: media }, MediaUploadLeaseInterceptor, MediaPrivacyHeadersInterceptor] })
class HttpFixture {}
const inventory = ['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER'];
const routes = [
  { method: 'POST', path: '/candidates/candidate/images', upload: true },
  { method: 'GET', path: '/candidates/candidate/images' },
  { method: 'GET', path: '/images/image' },
  { method: 'GET', path: '/images/image/derivatives/preview' },
  { method: 'POST', path: '/images/image/review', body: { decision: 'ACCEPTED', note: 'Synthetic review', identityConfirmed: true } },
  { method: 'POST', path: '/images/image/withdraw' },
];
const multipart = (values: Record<string,string> = mediaMetadata(), size = 8) => {
  const form = new FormData(); for (const [key, value] of Object.entries(values)) form.set(key, value);
  form.set('image', new Blob([new Uint8Array(size)], { type: 'image/png' }), '../untrusted-client-name.png'); return form;
};
describe('Private media HTTP and admission boundaries', () => {
  let app: INestApplication; let origin: string;
  const signer = new JwtService({ secret: process.env.JWT_SECRET });
  const request = (method: string, path: string, role?: Role, body?: any) => fetch(origin + '/api/catalog-media' + path, {
    method, headers: { ...(role ? { authorization: 'Bearer ' + signer.sign({ sub: role }, { expiresIn: '5m' }) } : {}), ...(body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  });
  beforeAll(async () => {
    app = await NestFactory.create(HttpFixture, { logger: false, abortOnError: false }); app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new AllExceptionsFilter()); await app.listen(0, '127.0.0.1'); origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); });
  describe.each(routes)('$method $path', route => {
    it('denies anonymous access', async () => { expect((await request(route.method, route.path, undefined, route.upload ? multipart() : route.body)).status).toBe(401); });
    it.each(Object.values(Role))('enforces current %s role', async role => {
      expect((await request(route.method, route.path, role, route.upload ? multipart() : route.body)).status).toBe(inventory.includes(role) ? (route.method === 'POST' ? 201 : 200) : 403);
    });
  });
  it('passes authenticated actor and bytes without trusting filename or client actor', async () => {
    expect((await request('POST', '/candidates/candidate/images', 'ADMIN', multipart())).status).toBe(201);
    expect(media.upload).toHaveBeenLastCalledWith('candidate', expect.anything(), expect.any(Buffer), 'ADMIN', expect.any(AbortSignal));
    const form = multipart(); form.set('approvedById', 'forged');
    expect((await request('POST', '/candidates/candidate/images', 'ADMIN', form)).status).toBe(400);
  });
  it('rejects oversized uploads and excessive fields before service invocation', async () => {
    expect((await request('POST', '/candidates/candidate/images', 'ADMIN', multipart(mediaMetadata(), 8 * 1024 * 1024 + 1))).status).toBe(413);
    expect(media.upload).not.toHaveBeenCalled();
    const form = multipart(); form.set('extra', 'invalid');
    expect((await request('POST', '/candidates/candidate/images', 'ADMIN', form)).status).toBe(400);
  });
  it('rejects forged boolean review and excessive pagination', async () => {
    expect((await request('POST', '/images/id/review', 'ADMIN', { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: 'false' })).status).toBe(400);
    expect(media.review).not.toHaveBeenCalled();
    expect((await request('GET', '/candidates/id/images?limit=51', 'ADMIN')).status).toBe(400);
  });
  it('returns authenticated derivative with no-store and nosniff headers', async () => {
    const result = await request('GET', '/images/id/derivatives/preview', 'INVENTORY_MANAGER');
    expect(result.status).toBe(200); expect(result.headers.get('cache-control')).toBe('private, no-store');
    expect(result.headers.get('content-type')).toBe('image/webp'); expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await request('GET', '/images/id/original', 'ADMIN')).status).toBe(404);
    expect((await request('GET', '/images/id', 'ADMIN')).headers.get('cache-control')).toBe('private, no-store');
  });
  it('reserves capacity before invoking the next multipart interceptor', () => {
    const gate = new MediaUploadLeaseInterceptor(); const held = new Subject<unknown>(); const next = { handle: jest.fn(() => held) };
    const first = gate.intercept({} as any, next).subscribe(); const second = gate.intercept({} as any, next).subscribe();
    expect(() => gate.intercept({} as any, next)).toThrow(); expect(next.handle).toHaveBeenCalledTimes(2);
    first.unsubscribe(); const third = gate.intercept({} as any, next).subscribe(); second.unsubscribe(); third.unsubscribe();
  });
});
