'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { VehicleFilters } from '@/components/vehicles/VehicleFilters';
import { searchVehicles, getAllMakes } from '@/lib/demo-data';

function VehiclesContent() {
  const searchParams = useSearchParams();
  const makes = useMemo(() => getAllMakes(), []);

  const filters: Parameters<typeof searchVehicles>[0] = {
    query: searchParams.get('query') || undefined,
    bodyStyle: searchParams.get('bodyStyle') || undefined,
    fuelType: searchParams.get('fuelType') || undefined,
    condition: searchParams.get('condition') || undefined,
    make: searchParams.get('make') || undefined,
    sortBy: searchParams.get('sortBy') || 'newest',
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: 12,
  };

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  if (minPrice) filters.minPrice = parseInt(minPrice);
  if (maxPrice) filters.maxPrice = parseInt(maxPrice);

  const result = searchVehicles(filters);
  const queryValue = searchParams.get('query') || '';

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-display-md font-bold text-primary-text tracking-tight">
          Browse Vehicles
        </h1>
        <p className="text-body-lg text-primary-muted mt-2">
          {result.total} vehicle{result.total !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-primary-border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <form>
            <input
              type="text"
              name="query"
              placeholder="Search make, model..."
              defaultValue={queryValue}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-primary-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
            />
          </form>
        </div>

        {/* Filters & Sort */}
        <Suspense fallback={<div className="text-body-sm text-primary-muted">Loading filters...</div>}>
          <VehicleFilters makes={makes} />
        </Suspense>
      </div>

      {/* Results */}
      {result.vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {result.vehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary-surface flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className="text-heading-md font-semibold text-primary-text mb-2">
            No vehicles found
          </h2>
          <p className="text-body-md text-primary-muted mb-6">
            Try adjusting your filters or search terms.
          </p>
          <Link href="/vehicles" className="btn-primary">
            Clear Filters
          </Link>
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: result.totalPages }, (_, i) => (
            <Link
              key={i + 1}
              href={`/vehicles?page=${i + 1}`}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-body-sm font-medium transition-colors ${
                result.page === i + 1
                  ? 'bg-primary-text text-white'
                  : 'bg-white border border-primary-border text-primary-text hover:border-primary-accent'
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function VehiclesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-main">
        <Suspense fallback={
          <div className="text-center py-20">
            <p className="text-body-md text-primary-muted">Loading vehicles...</p>
          </div>
        }>
          <VehiclesContent />
        </Suspense>
      </div>
    </div>
  );
}
