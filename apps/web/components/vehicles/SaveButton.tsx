'use client';

import { useFavorites } from '@/contexts/FavoritesContext';

interface SaveButtonProps {
  vehicleId: string;
  vehicleName: string;
}

export function SaveButton({ vehicleId, vehicleName }: SaveButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(vehicleId);

  return (
    <button
      onClick={() => toggleFavorite(vehicleId)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-lg text-body-sm font-medium transition-colors ${
        saved
          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-primary-border text-primary-text hover:bg-primary-surface'
      }`}
      aria-label={saved ? `Remove ${vehicleName} from saved` : `Save ${vehicleName}`}
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
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
