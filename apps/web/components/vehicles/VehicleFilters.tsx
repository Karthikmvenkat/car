'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const bodyStyles = [
  '',
  'Sedan',
  'SUV',
  'Coupe',
  'Truck',
  'Hatchback',
  'Convertible',
  'Wagon',
];

const fuelTypes = ['', 'Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'];
const conditions = ['', 'New', 'Used', 'Certified'];
const sortOptions = [
  { value: 'newest', label: 'Recently Added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'year-desc', label: 'Year: Newest First' },
  { value: 'mileage-asc', label: 'Mileage: Lowest First' },
];

export function VehicleFilters({ makes }: { makes: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      params.delete('page');
      router.push(`/vehicles?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selectClass =
    'px-3 py-2.5 bg-white border border-primary-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/30 transition-colors cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get('make') || ''}
        onChange={(e) => updateFilter('make', e.target.value)}
        className={selectClass}
      >
        <option value="">All Makes</option>
        {makes.map((make) => (
          <option key={make} value={make}>
            {make}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('bodyStyle') || ''}
        onChange={(e) => updateFilter('bodyStyle', e.target.value)}
        className={selectClass}
      >
        {bodyStyles.map((bs) => (
          <option key={bs} value={bs}>
            {bs || 'All Body Styles'}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('fuelType') || ''}
        onChange={(e) => updateFilter('fuelType', e.target.value)}
        className={selectClass}
      >
        {fuelTypes.map((ft) => (
          <option key={ft} value={ft}>
            {ft || 'All Fuel Types'}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('condition') || ''}
        onChange={(e) => updateFilter('condition', e.target.value)}
        className={selectClass}
      >
        {conditions.map((c) => (
          <option key={c} value={c}>
            {c || 'Any Condition'}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('sortBy') || 'newest'}
        onChange={(e) => updateFilter('sortBy', e.target.value)}
        className={selectClass}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
