'use client';

import { Vehicle } from '@/lib/types';
import { formatPrice, formatMileage } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import Link from 'next/link';

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

export function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];
  const saved = isFavorite(vehicle.id);

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      className="card-vehicle group block"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-surface">
        <img
          src={primaryImage?.url || '/images/placeholder-car.svg'}
          alt={primaryImage?.alt || `${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Badge */}
        {vehicle.featured && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-primary-accent text-white text-caption rounded-full">
            Featured
          </div>
        )}

        {vehicle.condition === 'new' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-primary-text text-white text-caption rounded-full">
            New
          </div>
        )}

        {/* Favorite Button */}
        <button
          className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            saved
              ? 'bg-red-500 text-white opacity-100'
              : 'bg-white/80 text-primary-text opacity-0 group-hover:opacity-100 hover:bg-white'
          }`}
          aria-label={saved ? `Remove ${vehicle.make} ${vehicle.model} from saved` : `Save ${vehicle.make} ${vehicle.model}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(vehicle.id);
          }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-heading-sm font-semibold text-primary-text group-hover:text-primary-accent transition-colors">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.variant && (
            <p className="text-body-sm text-primary-muted mt-0.5">
              {vehicle.variant}
            </p>
          )}
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-caption text-primary-muted">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {vehicle.fuelType}
          </span>
          <span className="inline-flex items-center gap-1.5 text-caption text-primary-muted">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {vehicle.transmission}
          </span>
          <span className="inline-flex items-center gap-1.5 text-caption text-primary-muted">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {formatMileage(vehicle.mileage)} mi
          </span>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-primary-border">
          <div>
            <p className="text-caption text-primary-muted">Starting at</p>
            <p className="text-heading-md font-bold text-primary-text">
              {formatPrice(vehicle.price, vehicle.currency)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-body-sm font-medium text-primary-accent group-hover:gap-2 transition-all">
            View
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
