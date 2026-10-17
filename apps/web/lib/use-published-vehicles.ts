'use client';

import { useEffect, useState } from 'react';
import { api, assetUrl } from './api-client';
import { Vehicle } from './types';

interface PublishedListing {
  id: string; slug: string; make: string; model: string; variant: string | null;
  year: number; price: number; currency: string; bodyStyle: string;
  fuelType: string; transmission: string; mileage: number;
  condition: Vehicle['condition']; featured: boolean;
  createdAt: string; updatedAt: string; imageUrl: string | null;
}

export function toListingVehicle(v: PublishedListing): Vehicle {
  return { ...v, variant: v.variant || undefined, status: 'available',
    detailsHref: `/configurator?vehicle=${encodeURIComponent(v.slug)}`,
    exteriorColor: '', locationId: '', features: [],
    images: v.imageUrl ? [{ id: `${v.id}-primary`, url: assetUrl(v.imageUrl)!, alt: `${v.year} ${v.make} ${v.model}`, isPrimary: true, order: 0 }] : [],
  };
}

export function usePublishedVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => api.get<PublishedListing[]>('/configurator/vehicles')
      .then((items) => { if (active) { setVehicles(items.map(toListingVehicle)); setError(''); } })
      .catch(() => { if (active) setError('Unable to load vehicles. Please try again shortly.'); })
      .finally(() => { if (active) setLoading(false); });
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, []);
  return { vehicles, loading, error };
}
