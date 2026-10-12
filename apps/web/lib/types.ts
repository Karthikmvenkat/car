export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  condition: 'new' | 'used' | 'certified';
  price: number;
  currency: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  drivetrain?: string;
  bodyStyle: string;
  exteriorColor: string;
  interiorColor?: string;
  availableColors?: ColorOption[];
  description?: string;
  status: 'available' | 'reserved' | 'sold' | 'draft';
  featured: boolean;
  locationId: string;
  location?: Location;
  images: VehicleImage[];
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  isPrimary: boolean;
}

export interface ColorOption {
  name: string;
  hex: string;
  type: 'exterior' | 'interior';
  price?: number;
  imageUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  phone?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface SearchFilters {
  query?: string;
  make?: string;
  model?: string;
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  condition?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Enquiry {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact?: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  createdAt: string;
}

export interface TestDriveBooking {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  name: string;
  email: string;
  phone: string;
  requestedDate: string;
  requestedTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'super_admin';
  createdAt: string;
}

export interface HeroContent {
  eyebrow: string;
  headline1: string;
  headline2: string;
  supportingText: string;
  primaryCta: string;
  primaryCtaLink: string;
  secondaryCta: string;
  secondaryCtaLink: string;
  heroImage: string;
}
