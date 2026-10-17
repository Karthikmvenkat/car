'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (vehicleId: string) => boolean;
  toggleFavorite: (vehicleId: string) => void;
  addFavorite: (vehicleId: string) => void;
  removeFavorite: (vehicleId: string) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'car_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed:unknown=JSON.parse(stored);
        if(Array.isArray(parsed))setFavorites(parsed.filter((id):id is string=>typeof id==='string'));
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if(hydrated)localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites,hydrated]);

  const isFavorite = (vehicleId: string) => favorites.includes(vehicleId);

  const addFavorite = (vehicleId: string) => {
    setFavorites((prev) => (prev.includes(vehicleId) ? prev : [...prev, vehicleId]));
  };

  const removeFavorite = (vehicleId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== vehicleId));
  };

  const toggleFavorite = (vehicleId: string) => {
    if (isFavorite(vehicleId)) {
      removeFavorite(vehicleId);
    } else {
      addFavorite(vehicleId);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite, count: favorites.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
