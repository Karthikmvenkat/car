'use client';

import Link from 'next/link';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePublishedVehicles } from '@/lib/use-published-vehicles';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { formatPrice } from '@/lib/utils';

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();

  const {vehicles,loading,error}=usePublishedVehicles();
  const savedVehicles = vehicles.filter((v) => favorites.includes(v.id));
  if(loading)return <div className="page-shell container-main" role="status">Loading saved vehicles…</div>;
  if(error)return <div className="page-shell container-main" role="alert">{error}</div>;

  return (
    <div className="page-shell min-h-screen">
      <div className="container-main">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-display-md font-bold text-primary-text tracking-tight mb-2">
            Saved Vehicles
          </h1>
          <p className="text-body-md text-primary-muted">
            {savedVehicles.length === 0
              ? 'You haven\'t saved any vehicles yet'
              : `${savedVehicles.length} vehicle${savedVehicles.length === 1 ? '' : 's'} saved`}
          </p>
        </div>

        {savedVehicles.length === 0 ? (
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-surface flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p className="text-body-md text-primary-muted mb-6">
              Browse our collection and tap the heart icon to save vehicles you love.
            </p>
            <Link href="/vehicles" className="btn-primary inline-flex px-8 py-3">
              Discover Vehicles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {savedVehicles.map((vehicle, i) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
