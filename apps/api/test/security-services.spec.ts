import 'reflect-metadata';
import { ConflictException, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AuthService } from '../src/modules/auth/auth.service';
import { getJwtSecret } from '../src/modules/auth/jwt-config';
import { UsersService } from '../src/modules/users/users.service';
import { VehiclesService } from '../src/modules/vehicles/vehicles.service';
import { EnquiriesService } from '../src/modules/enquiries/enquiries.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { BrandsService } from '../src/modules/brands/brands.service';

describe('Signing configuration', () => {
  const originalMode = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.NODE_ENV = originalMode;
    if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
  });
  it.each([undefined, 'short', 'car-dev-secret-change-in-production', 'your-jwt-secret-replace-with-a-real-secret'])('rejects unsafe production configuration %#', secret => {
    process.env.NODE_ENV = 'production';
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
    expect(getJwtSecret).toThrow('Production requires a strong JWT_SECRET');
  });
  it('uses a consistent ephemeral development key rather than the known fallback', () => {
    delete process.env.JWT_SECRET;
    const key = getJwtSecret();
    expect(key.length).toBeGreaterThanOrEqual(32);
    expect(getJwtSecret()).toBe(key);
  });
  it('fails closed when role guard has no policy', () => {
    const guard = new RolesGuard(new Reflector());
    expect(guard.canActivate({ getHandler: () => (() => {}), getClass: () => class {}, switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }) }) } as any)).toBe(false);
  });
});

describe('Database-only identity', () => {
  const hash = bcrypt.hashSync('Fixture-Only-Password-9', 4);
  const fixture = { id: 'fixture', name: 'Fixture', email: 'fixture@example.invalid', phone: null, role: 'CUSTOMER', status: 'ACTIVE', passwordHash: hash };
  let db: any;
  let signer: any;
  let service: AuthService;
  beforeEach(() => {
    db = { user: { findUnique: jest.fn().mockResolvedValue({ ...fixture }), create: jest.fn().mockResolvedValue({ ...fixture }), update: jest.fn().mockResolvedValue({ ...fixture }) } };
    signer = { sign: jest.fn().mockReturnValue('synthetic-token') };
    service = new AuthService(db, signer);
  });
  afterEach(() => jest.restoreAllMocks());
  it.each(['INACTIVE', 'SUSPENDED'])('rejects %s password login without issuing a token', async status => {
    db.user.findUnique.mockResolvedValue({ ...fixture, status });
    await expect(service.login({ email: fixture.email, password: 'Fixture-Only-Password-9' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signer.sign).not.toHaveBeenCalled();
  });
  it('registers only a customer and hashes the password', async () => {
    db.user.findUnique.mockResolvedValue(null);
    await service.register({ name: 'Fixture', email: 'new@example.invalid', password: 'Fixture-Only-Password-9' });
    const data = db.user.create.mock.calls[0][0].data;
    expect(data.role).toBe('CUSTOMER');
    expect(data.passwordHash).not.toBe('Fixture-Only-Password-9');
    expect(await bcrypt.compare('Fixture-Only-Password-9', data.passwordHash)).toBe(true);
  });
  it('handles a concurrent unique-email conflict without exposing database details', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('private synthetic constraint', { code: 'P2002', clientVersion: '5.22.0' }));
    await expect(service.register({ name: 'Fixture', email: fixture.email, password: 'Fixture-Only-Password-9' })).rejects.toBeInstanceOf(ConflictException);
    expect(signer.sign).not.toHaveBeenCalled();
  });
  it('never caches an identity-store outage permanently', async () => {
    db.user.findUnique.mockRejectedValueOnce(new Error('private fixture details'));
    await expect(service.validateUser('fixture')).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(service.validateUser('fixture')).resolves.toMatchObject({ id: 'fixture' });
  });
  it('rejects missing and suspended current accounts', async () => {
    db.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...fixture, status: 'SUSPENDED' });
    await expect(service.validateUser('fixture')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.validateUser('fixture')).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('sanitizes profile persistence errors', async () => {
    db.user.update.mockRejectedValue(new Error('private fixture connection details'));
    await expect(service.updateProfile('fixture', { name: 'Updated' })).rejects.toThrow('Authentication is temporarily unavailable');
  });
  it('rejects Google login for a suspended existing account', async () => {
    const previous = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'synthetic-client';
    try {
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation((async () => ({ getPayload: () => ({ email: fixture.email, email_verified: true }) })) as any);
      db.user.findUnique.mockResolvedValue({ ...fixture, status: 'SUSPENDED' });
      await expect(service.googleAuth('synthetic-credential')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(signer.sign).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = previous;
    }
  });
});

describe('Transactional role and status changes', () => {
  let tx: any;
  let db: any;
  let service: UsersService;
  const actor = { id: 'actor', role: 'SUPER_ADMIN', status: 'ACTIVE' };
  const target = { id: 'target', role: 'SUPER_ADMIN', status: 'ACTIVE' };
  beforeEach(() => {
    tx = { user: {
      findUnique: jest.fn(async ({ where }: any) => where.id === 'actor' ? { ...actor } : { ...target }),
      count: jest.fn().mockResolvedValue(2), update: jest.fn().mockResolvedValue({ id: 'target' }),
    }, auditLog: { create: jest.fn().mockResolvedValue({}) } };
    db = { $transaction: jest.fn(async (operation: any) => operation(tx)) };
    service = new UsersService(db);
  });
  it('uses serializable isolation and an atomic redacted audit', async () => {
    await service.updateRole('target', 'CUSTOMER', 'actor');
    expect(db.$transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' });
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'actor', action: 'user.role.change', entityId: 'target', metadata: { fromRole: 'SUPER_ADMIN', toRole: 'CUSTOMER', fromStatus: 'ACTIVE', toStatus: 'ACTIVE' } }) });
  });
  it.each(['role', 'status'])('prevents removing the last active super administrator via %s', async action => {
    tx.user.count.mockResolvedValue(1);
    const operation = action === 'role' ? service.updateRole('target', 'CUSTOMER', 'actor') : service.toggleStatus('target', 'actor');
    await expect(operation).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('prevents self-lockout', async () => {
    await expect(service.updateRole('actor', 'CUSTOMER', 'actor')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.toggleStatus('actor', 'actor')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('revalidates acting super administrator within the transaction', async () => {
    tx.user.findUnique.mockResolvedValue({ ...actor, role: 'ADMIN' });
    await expect(service.updateRole('target', 'CUSTOMER', 'actor')).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('retries a serialization conflict from the beginning', async () => {
    db.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('synthetic serialization conflict', { code: 'P2034', clientVersion: '5.22.0' }));
    await service.updateRole('target', 'CUSTOMER', 'actor');
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(tx.user.update).toHaveBeenCalledTimes(1);
  });
  it('does not write after retry exhaustion', async () => {
    db.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('synthetic serialization conflict', { code: 'P2034', clientVersion: '5.22.0' }));
    await expect(service.updateRole('target', 'CUSTOMER', 'actor')).rejects.toBeInstanceOf(ConflictException);
    expect(db.$transaction).toHaveBeenCalledTimes(3);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('fails safely if the atomic audit write fails', async () => {
    tx.auditLog.create.mockRejectedValue(new Error('synthetic audit outage'));
    await expect(service.updateRole('target', 'CUSTOMER', 'actor')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('Public data boundaries', () => {
  it('filters public brand vehicle relations and counts', async () => {
    const db: any = { brand: { findUnique: jest.fn().mockResolvedValue({ id: 'brand', vehicles: [] }), findMany: jest.fn().mockResolvedValue([]) } };
    const service = new BrandsService(db);
    await service.findOne('brand');
    await service.findAll();
    const visibility = { status: 'AVAILABLE', publicationStatus: 'PUBLISHED' };
    expect(db.brand.findUnique.mock.calls[0][0].include.vehicles.where).toEqual(visibility);
    expect(db.brand.findMany.mock.calls[0][0].include._count.select.vehicles.where).toEqual(visibility);
  });
  it('rejects requests for hidden vehicles before persistence', async () => {
    const db: any = { vehicle: { findFirst: jest.fn().mockResolvedValue(null) }, enquiry: { create: jest.fn() }, testDriveBooking: { create: jest.fn() } };
    await expect(new EnquiriesService(db).create({ name: 'Fixture', email: 'fixture@example.invalid', message: 'Question', vehicleSlug: 'hidden' })).rejects.toThrow('Vehicle not found');
    await expect(new BookingsService(db).create({ customerName: 'Fixture', customerEmail: 'fixture@example.invalid', customerPhone: '0000000000', vehicleSlug: 'hidden', preferredDate: '2027-01-01', preferredTime: '10:00' })).rejects.toThrow('Vehicle not found');
    for (const [query] of db.vehicle.findFirst.mock.calls) expect(query.where).toEqual({ slug: 'hidden', status: 'AVAILABLE', publicationStatus: 'PUBLISHED' });
    expect(db.enquiry.create).not.toHaveBeenCalled();
    expect(db.testDriveBooking.create).not.toHaveBeenCalled();
  });
  it('requires available AND published even with published=false', async () => {
    const db: any = { vehicle: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new VehiclesService(db);
    await service.search({ published: false });
    expect(db.vehicle.findMany.mock.calls[0][0].where).toMatchObject({ status: 'AVAILABLE', publicationStatus: 'PUBLISHED' });
    await expect(service.findBySlug('draft')).rejects.toThrow('Vehicle not found');
    expect(db.vehicle.findFirst.mock.calls[0][0].where).toEqual({ slug: 'draft', status: 'AVAILABLE', publicationStatus: 'PUBLISHED' });
    await service.getFeatured();
    expect(db.vehicle.findMany.mock.calls[1][0].where).toMatchObject({ featured: true, status: 'AVAILABLE', publicationStatus: 'PUBLISHED' });
  });
  it('does not associate guest enquiry or test drive with a supplied userId', async () => {
    const db: any = { vehicle: { findFirst: jest.fn().mockResolvedValue({ id: 'vehicle' }) }, enquiry: { create: jest.fn().mockResolvedValue({}) }, testDriveBooking: { create: jest.fn().mockResolvedValue({}) } };
    await new EnquiriesService(db).create({ name: 'Fixture', email: 'fixture@example.invalid', message: 'Question', vehicleSlug: 'fixture', userId: 'someone-else' });
    await new BookingsService(db).create({ customerName: 'Fixture', customerEmail: 'fixture@example.invalid', customerPhone: '0000000000', vehicleSlug: 'fixture', preferredDate: '2027-01-01', preferredTime: '10:00', userId: 'someone-else' });
    expect(db.enquiry.create.mock.calls[0][0].data.user).toBeUndefined();
    expect(db.testDriveBooking.create.mock.calls[0][0].data.user).toBeUndefined();
  });
});
