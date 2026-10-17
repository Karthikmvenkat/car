'use client';

import Link from 'next/link';
import { Vehicle } from '@/lib/types';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

interface PopularVehiclesProps {
  vehicles: Vehicle[];
}

export function PopularVehicles({ vehicles }: PopularVehiclesProps) {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.popular-animate', {
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      start: 'top 82%',
    });

  }, [vehicles]);

  return (
    <section ref={sectionRef} className="section-padding">
      <div className="container-main">
        {/* Section Header */}
        <div className="popular-animate flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8" >
          <div>
            <p className="text-caption text-primary-accent mb-2">
              Curated Selection
            </p>
            <h2 className="text-display-md font-bold text-primary-text tracking-tight">
              Popular Vehicles
            </h2>
            <p className="text-body-lg text-primary-muted mt-3 max-w-lg">
              Hand-picked vehicles from our premium collection, ready for
              discovery.
            </p>
          </div>
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 text-body-md font-medium text-primary-accent hover:text-primary-text transition-colors group shrink-0"
          >
            View all vehicles
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Vehicle Grid */}
        <div className="vehicle-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle, index) => (
            <div
              key={vehicle.id}
              className="vehicle-card-animate"

            >
              <VehicleCard vehicle={vehicle} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
