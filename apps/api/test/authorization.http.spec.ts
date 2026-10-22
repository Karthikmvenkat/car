import 'reflect-metadata';
import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { VehiclesController } from '../src/modules/vehicles/vehicles.controller';
import { VehiclesService } from '../src/modules/vehicles/vehicles.service';
import { BrandsController } from '../src/modules/brands/brands.controller';
import { BrandsService } from '../src/modules/brands/brands.service';
import { ContentController } from '../src/modules/content/content.controller';
import { ContentService } from '../src/modules/content/content.service';
import { EnquiriesController } from '../src/modules/enquiries/enquiries.controller';
import { EnquiriesService } from '../src/modules/enquiries/enquiries.service';
import { BookingsController } from '../src/modules/bookings/bookings.controller';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

const accounts = new Map<string, any>();
let unavailable = false;
const passwordHash = bcrypt.hashSync('Fixture-Only-Password-9', 4);
const prisma = { user: {
  findUnique: jest.fn(async ({ where }: any) => {
    if (unavailable) throw new Error('synthetic-private-database-details');
    return where.id ? accounts.get(where.id) ?? null : [...accounts.values()].find(u => u.email === where.email) ?? null;
  }),
  create: jest.fn(async ({ data }: any) => ({ id: 'new-customer', ...data, createdAt: new Date(0) })),
} };
const stub = (methods: string[]) => Object.fromEntries(methods.map(method => [method, jest.fn(async () => ({ ok: true }))]));
const users = stub(['findAll', 'findOne', 'updateRole', 'toggleStatus']);
const vehicles = stub(['search', 'getFeatured', 'findAll', 'findBySlug', 'create', 'update', 'remove']);
const brands = stub(['findAll', 'findOne', 'create', 'update', 'remove', 'createModel', 'removeModel']);
const content = stub(['getPageContent', 'upsertPageContent', 'getSeoMetadata', 'upsertSeoMetadata', 'getTestimonials', 'createTestimonial', 'updateTestimonial', 'deleteTestimonial', 'getFaqs', 'getFaqCategories', 'createFaq', 'updateFaq', 'deleteFaq']);
const enquiries = stub(['create', 'findAll', 'findOne', 'updateStatus']);
const bookings = stub(['create', 'findAll', 'findOne', 'updateStatus']);

@Global()
@Module({ providers: [{ provide: PrismaService, useValue: prisma }], exports: [PrismaService] })
class FixturePersistence {}

@Module({
  imports: [FixturePersistence, AuthModule],
  controllers: [UsersController, VehiclesController, BrandsController, ContentController, EnquiriesController, BookingsController],
  providers: [
    { provide: UsersService, useValue: users }, { provide: VehiclesService, useValue: vehicles },
    { provide: BrandsService, useValue: brands }, { provide: ContentService, useValue: content },
    { provide: EnquiriesService, useValue: enquiries }, { provide: BookingsService, useValue: bookings },
  ],
})
class FixtureApplication {}

const inventory = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'];
const sales = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'];
const editors = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_EDITOR'];
type Route = { method: string; path: string; roles: string[]; body?: object };
const routes: Route[] = [
  { method: 'GET', path: '/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { method: 'GET', path: '/users/target', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { method: 'POST', path: '/users/target/role', roles: ['SUPER_ADMIN'], body: { role: 'SALES_MANAGER' } },
  { method: 'POST', path: '/users/target/toggle-status', roles: ['SUPER_ADMIN'] },
  { method: 'GET', path: '/vehicles/all', roles: inventory },
  { method: 'POST', path: '/vehicles', roles: inventory, body: { brandSlug: 'fixture', modelSlug: 'fixture', variant: 'base', year: 2026, price: 1000000 } },
  { method: 'PUT', path: '/vehicles/target', roles: inventory, body: { price: 1100000 } },
  { method: 'DELETE', path: '/vehicles/target', roles: inventory },
  { method: 'POST', path: '/brands', roles: inventory, body: { name: 'Fixture', slug: 'fixture' } },
  { method: 'PUT', path: '/brands/target', roles: inventory, body: { name: 'Fixture' } },
  { method: 'DELETE', path: '/brands/target', roles: inventory },
  { method: 'POST', path: '/brands/target/models', roles: inventory, body: { name: 'Fixture', slug: 'fixture' } },
  { method: 'DELETE', path: '/brands/models/target', roles: inventory },
  { method: 'POST', path: '/content/pages/home', roles: editors, body: { title: 'Fixture', content: 'Synthetic page body' } },
  { method: 'POST', path: '/content/seo/home', roles: editors, body: { title: 'Fixture', description: 'Fixture' } },
  { method: 'POST', path: '/content/testimonials', roles: editors, body: { name: 'Fixture', quote: 'Fixture', rating: 5 } },
  { method: 'PUT', path: '/content/testimonials/target', roles: editors, body: { quote: 'Fixture' } },
  { method: 'DELETE', path: '/content/testimonials/target', roles: editors },
  { method: 'POST', path: '/content/faqs', roles: editors, body: { question: 'Fixture?', answer: 'Fixture' } },
  { method: 'PUT', path: '/content/faqs/target', roles: editors, body: { answer: 'Fixture' } },
  { method: 'DELETE', path: '/content/faqs/target', roles: editors },
  { method: 'GET', path: '/enquiries', roles: sales },
  { method: 'GET', path: '/enquiries/target', roles: sales },
  { method: 'POST', path: '/enquiries/target/status', roles: sales, body: { status: 'CONTACTED' } },
  { method: 'GET', path: '/bookings', roles: sales },
  { method: 'GET', path: '/bookings/target', roles: sales },
  { method: 'POST', path: '/bookings/target/status', roles: sales, body: { status: 'CONFIRMED' } },
];

describe('HTTP authentication and legacy role policy', () => {
  let app: INestApplication;
  let origin: string;
  const signer = new JwtService({ secret: process.env.JWT_SECRET });
  const token = (role: string, overrides: object = {}) => signer.sign({ sub: role, role, ...overrides }, { expiresIn: '5m' });
  const request = (route: Route, auth?: string) => fetch(origin + '/api' + route.path, {
    method: route.method,
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer ' + auth } : {}) },
    ...(route.body ? { body: JSON.stringify(route.body) } : {}),
  });

  beforeAll(async () => {
    for (const role of Object.values(Role)) accounts.set(role, { id: role, email: `${role.toLowerCase()}@example.invalid`, name: 'Synthetic Fixture', role, status: 'ACTIVE', passwordHash });
    app = await NestFactory.create(FixtureApplication, { logger: false, abortOnError: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); });
  afterEach(() => { unavailable = false; accounts.get('ADMIN').role = 'ADMIN'; accounts.get('CUSTOMER').status = 'ACTIVE'; });

  describe.each(routes)('$method $path', route => {
    it('rejects anonymous callers', async () => { expect((await request(route)).status).toBe(401); });
    it.each(Object.values(Role))('applies current persisted %s permissions', async role => {
      const response = await request(route, token(role));
      expect(response.status).toBe(route.roles.includes(role) ? (route.method === 'POST' ? 201 : 200) : 403);
    });
  });

  it('does not trust a forged or stale privileged role claim', async () => {
    expect((await request(routes[0], token('CUSTOMER', { role: 'SUPER_ADMIN' }))).status).toBe(403);
    const stale = token('ADMIN');
    accounts.get('ADMIN').role = 'CUSTOMER';
    expect((await request(routes[0], stale)).status).toBe(403);
  });
  it.each(['INACTIVE', 'SUSPENDED'])('rejects %s accounts', async status => {
    accounts.get('CUSTOMER').status = status;
    expect((await request({ method: 'GET', path: '/auth/me', roles: [] }, token('CUSTOMER'))).status).toBe(401);
  });
  it('rejects deleted accounts and malformed subjects', async () => {
    expect((await request(routes[0], token('missing'))).status).toBe(401);
    expect((await request(routes[0], token('ADMIN', { sub: 42 }))).status).toBe(401);
  });
  it('rejects expired, malformed and incorrectly signed tokens', async () => {
    const expired = signer.sign({ sub: 'ADMIN' }, { expiresIn: -1 });
    const wrong = new JwtService({ secret: 'different-synthetic-key' }).sign({ sub: 'ADMIN' });
    for (const invalid of [expired, wrong, 'not-a-token']) expect((await request(routes[0], invalid)).status).toBe(401);
  });
  it('fails closed on database errors and recovers on the next request', async () => {
    unavailable = true;
    const response = await request(routes[0], token('ADMIN'));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('synthetic-private-database-details');
    unavailable = false;
    expect((await request(routes[0], token('ADMIN'))).status).toBe(200);
  });
  it('does not issue demo authentication when the store is down', async () => {
    unavailable = true;
    for (const path of ['/auth/login', '/auth/register']) {
      const response = await request({ method: 'POST', path, roles: [], body: { email: 'customer@example.invalid', password: 'Fixture-Only-Password-9', ...(path.endsWith('register') ? { name: 'Fixture' } : {}) } });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('token');
    }
  });
  it('rejects invalid roles and unknown privilege fields before user mutation', async () => {
    for (const body of [{ role: 'OWNER' }, { role: 'ADMIN', status: 'ACTIVE' }]) {
      expect((await request({ ...routes[2], body }, token('SUPER_ADMIN'))).status).toBe(400);
    }
  });
  it('rejects invalid lead statuses and records the real staff actor', async () => {
    expect((await request({ method: 'POST', path: '/enquiries/target/status', roles: [], body: { status: 'INVENTED' } }, token('SALES_MANAGER'))).status).toBe(400);
    await request({ method: 'POST', path: '/enquiries/target/status', roles: [], body: { status: 'CONTACTED' } }, token('SALES_MANAGER'));
    expect(enquiries.updateStatus).toHaveBeenCalledWith('target', 'CONTACTED', 'SALES_MANAGER');
  });
  it('caps public search page size', async () => {
    expect((await request({ method: 'GET', path: '/vehicles?limit=100000', roles: [] })).status).toBe(400);
  });
  it.each(['/vehicles', '/vehicles/featured', '/vehicles/public-slug', '/brands', '/content/faqs'])('preserves public GET %s', async path => {
    expect((await request({ method: 'GET', path, roles: [] })).status).toBe(200);
  });
  it('preserves public enquiry/test-drive submission', async () => {
    expect((await request({ method: 'POST', path: '/enquiries', roles: [], body: { name: 'Fixture', email: 'fixture@example.invalid', message: 'Question', vehicleSlug: 'fixture' } })).status).toBe(201);
    expect((await request({ method: 'POST', path: '/bookings', roles: [], body: { customerName: 'Fixture', customerEmail: 'fixture@example.invalid', customerPhone: '0000000000', vehicleSlug: 'fixture', preferredDate: '2027-01-01', preferredTime: '10:00' } })).status).toBe(201);
  });
  it('rejects registration privilege fields', async () => {
    expect((await request({ method: 'POST', path: '/auth/register', roles: [], body: { email: 'fixture@example.invalid', name: 'Fixture', password: 'Fixture-Only-Password-9', role: 'SUPER_ADMIN' } })).status).toBe(400);
  });
  it('does not expose unexpected service error details', async () => {
    users.findAll.mockRejectedValueOnce(new Error('synthetic-private-database-details'));
    const response = await request(routes[0], token('ADMIN'));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('synthetic-private-database-details');
  });
});
