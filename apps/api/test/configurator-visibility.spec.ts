import 'reflect-metadata';
// Prevent unrelated GLB/provider imports and external worker initialization.
jest.mock('../src/modules/configurator/configurator-admin.service', () => ({ ConfiguratorAdminService: class {} }));
jest.mock('../src/modules/configurator/pipeline/pipeline.service', () => ({ AI_DISCLAIMER: 'Synthetic preview disclaimer' }));
import { ConfiguratorPublicService } from '../src/modules/configurator/configurator-public.service';

describe('Configurator public visibility', () => {
  const visibility = { status: 'AVAILABLE', publicationStatus: 'PUBLISHED' };
  it('hides unavailable or unpublished listings in list/detail/save', async () => {
    const db: any = { vehicle: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) }, savedConfiguration: { create: jest.fn() } };
    const service = new ConfiguratorPublicService(db, {} as any);
    await expect(service.listPublished()).resolves.toEqual([]);
    expect(db.vehicle.findMany.mock.calls[0][0].where).toEqual(visibility);
    await expect(service.getBySlug('hidden')).rejects.toThrow('Vehicle not found');
    await expect(service.saveConfiguration({ vehicleSlug: 'hidden' })).rejects.toThrow('Vehicle not found');
    for (const [query] of db.vehicle.findFirst.mock.calls) expect(query.where).toEqual({ slug: 'hidden', ...visibility });
    expect(db.savedConfiguration.create).not.toHaveBeenCalled();
  });
  it.each([
    { status: 'SOLD', publicationStatus: 'PUBLISHED' },
    { status: 'AVAILABLE', publicationStatus: 'UNPUBLISHED' },
    { status: 'ARCHIVED', publicationStatus: 'PUBLISHED' },
  ])('does not load shared configuration for $status / $publicationStatus', async vehicle => {
    const db: any = { savedConfiguration: { findUnique: jest.fn().mockResolvedValue({ vehicle: { slug: 'hidden', ...vehicle } }) } };
    await expect(new ConfiguratorPublicService(db, {} as any).getConfiguration('synthetic-share')).rejects.toThrow('Configuration not found');
  });
});
