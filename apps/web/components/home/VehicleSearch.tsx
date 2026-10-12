'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

const bodyStyles = [
  { value: '', label: 'Any Body Style' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'truck', label: 'Truck' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'wagon', label: 'Wagon' },
];

const priceRanges = [
  { value: '', label: 'Any Price' },
  { value: '0-25000', label: 'Under $25,000' },
  { value: '25000-50000', label: '$25,000 - $50,000' },
  { value: '50000-75000', label: '$50,000 - $75,000' },
  { value: '75000-100000', label: '$75,000 - $100,000' },
  { value: '100000-999999', label: '$100,000+' },
];

const fuelTypes = [
  { value: '', label: 'Any Fuel Type' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plug-in-hybrid', label: 'Plug-in Hybrid' },
];

export function VehicleSearch() {
  const router = useRouter();
  const [bodyStyle, setBodyStyle] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [query, setQuery] = useState('');

  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;
    createScrollReveal('.search-animate', {
      y: 25,
      duration: 0.6,
      stagger: 0.08,
      start: 'top 85%',
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (bodyStyle) params.set('bodyStyle', bodyStyle);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      params.set('minPrice', min);
      params.set('maxPrice', max);
    }
    if (fuelType) params.set('fuelType', fuelType);

    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 z-20 pb-20"
    >
      <div className="container-main">
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-xl border border-primary-border p-6 md:p-8"
        >
          <div className="search-animate mb-6" style={{ opacity: 0 }}>
            <h2 className="text-heading-md font-semibold text-primary-text mb-1">
              Find Your Perfect Car
            </h2>
            <p className="text-body-sm text-primary-muted">
              Search from our curated collection of premium vehicles
            </p>
          </div>

          {/* Search Input */}
          <div className="search-animate mb-6" style={{ opacity: 0 }}>
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-primary-bg border border-primary-border rounded-xl text-body-md text-primary-text placeholder:text-primary-muted/60 focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="search-animate" style={{ opacity: 0 }}>
              <label className="block text-caption text-primary-muted mb-1.5">
                Body Style
              </label>
              <select
                value={bodyStyle}
                onChange={(e) => setBodyStyle(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all appearance-none cursor-pointer"
              >
                {bodyStyles.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-animate" style={{ opacity: 0 }}>
              <label className="block text-caption text-primary-muted mb-1.5">
                Price Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all appearance-none cursor-pointer"
              >
                {priceRanges.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-animate" style={{ opacity: 0 }}>
              <label className="block text-caption text-primary-muted mb-1.5">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all appearance-none cursor-pointer"
              >
                {fuelTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="search-animate flex flex-col sm:flex-row items-center justify-between gap-4" style={{ opacity: 0 }}>
            <p className="text-caption text-primary-muted">
              Over 500 vehicles available nationwide
            </p>
            <button type="submit" className="btn-primary px-10 py-3.5">
              Search Vehicles
              <svg
                className="ml-2 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
