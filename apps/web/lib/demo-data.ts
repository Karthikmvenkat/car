import { Vehicle, ColorOption } from '@/lib/types';

/**
 * Demo vehicle data for development.
 * Clearly labeled as demo content — not real inventory.
 * 26 vehicles across 10 brands including Hyundai, Kia, Tata, Mahindra.
 */
export const demoVehicles: Vehicle[] = [
  // ─── BMW ─────────────────────────────────────────────────────
  {
    id: '1',
    slug: '2024-bmw-m4-competition',
    make: 'BMW',
    model: 'M4 Competition',
    variant: 'xDrive Coupe',
    year: 2024,
    condition: 'new',
    price: 82900,
    currency: 'USD',
    mileage: 12,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'Coupe',
    exteriorColor: 'Isle of Man Green',
    interiorColor: 'Black Merino Leather',
    description:
      'A stunning BMW M4 Competition in Isle of Man Green with the optional Carbon Package.',
    status: 'available',
    featured: true,
    locationId: 'loc-1',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80&auto=format&fit=crop',
        alt: '2024 BMW M4 Competition front view',
        order: 0,
        isPrimary: true,
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop',
        alt: '2024 BMW M4 Competition side view',
        order: 1,
        isPrimary: false,
      },
    ],
    features: [
      'Carbon Fiber Roof',
      'M Sport Exhaust',
      'Head-Up Display',
      'Harman Kardon Sound',
      'Adaptive M Suspension',
    ],
    createdAt: '2024-09-15T10:00:00Z',
    updatedAt: '2024-09-15T10:00:00Z',
  },
  // ─── Mercedes-Benz ───────────────────────────────────────────
  {
    id: '2',
    slug: '2024-mercedes-benz-eqe-suv',
    make: 'Mercedes-Benz',
    model: 'EQE SUV',
    variant: '500 4MATIC',
    year: 2024,
    condition: 'new',
    price: 87500,
    currency: 'USD',
    mileage: 8,
    fuelType: 'Electric',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Obsidian Black',
    interiorColor: 'Macchiato Beige',
    description:
      'The all-electric EQE SUV combines luxury, performance and zero emissions.',
    status: 'available',
    featured: true,
    locationId: 'loc-1',
    images: [
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mercedes-Benz EQE SUV',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'MBUX Hyperscreen',
      'Burmester 4D Sound',
      'Air Suspension',
      'Panoramic Roof',
      'Driver Assistance Plus',
    ],
    createdAt: '2024-09-14T10:00:00Z',
    updatedAt: '2024-09-14T10:00:00Z',
  },
  // ─── Porsche ─────────────────────────────────────────────────
  {
    id: '3',
    slug: '2023-porsche-911-carrera-s',
    make: 'Porsche',
    model: '911 Carrera S',
    variant: 'Cabriolet',
    year: 2023,
    condition: 'certified',
    price: 142000,
    currency: 'USD',
    mileage: 3200,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'RWD',
    bodyStyle: 'Convertible',
    exteriorColor: 'Guards Red',
    interiorColor: 'Black Leather',
    description:
      'An iconic 911 Carrera S Cabriolet in Guards Red — certified pre-owned with full warranty.',
    status: 'available',
    featured: true,
    locationId: 'loc-2',
    images: [
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80&auto=format&fit=crop',
        alt: '2023 Porsche 911 Carrera S Cabriolet',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Sport Chrono Package',
      'PASM Sport Suspension',
      'Bose Surround Sound',
      'Sport Exhaust System',
      'Lane Keep Assist',
    ],
    createdAt: '2024-09-13T10:00:00Z',
    updatedAt: '2024-09-13T10:00:00Z',
  },
  // ─── Audi ────────────────────────────────────────────────────
  {
    id: '4',
    slug: '2024-audi-rs-e-tron-gt',
    make: 'Audi',
    model: 'RS e-tron GT',
    variant: 'Quattro',
    year: 2024,
    condition: 'new',
    price: 147500,
    currency: 'USD',
    mileage: 15,
    fuelType: 'Electric',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'Sedan',
    exteriorColor: 'Daytona Grey',
    interiorColor: 'Express Red',
    description:
      'The Audi RS e-tron GT — breathtaking electric performance in a stunning grand tourer.',
    status: 'available',
    featured: false,
    locationId: 'loc-1',
    images: [
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Audi RS e-tron GT',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Carbon Optic Package',
      'Matrix LED Headlights',
      'Bang & Olufsen 3D Sound',
      'Air Suspension',
      'RS Sport Exhaust',
    ],
    createdAt: '2024-09-12T10:00:00Z',
    updatedAt: '2024-09-12T10:00:00Z',
  },
  // ─── Land Rover ──────────────────────────────────────────────
  {
    id: '5',
    slug: '2023-range-rover-sport',
    make: 'Land Rover',
    model: 'Range Rover Sport',
    variant: 'HSE Dynamic',
    year: 2023,
    condition: 'used',
    price: 89900,
    currency: 'USD',
    mileage: 12500,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Santorini Black',
    interiorColor: 'Ebony',
    description:
      'A commanding Range Rover Sport PHEV with low mileage and full service history.',
    status: 'available',
    featured: false,
    locationId: 'loc-2',
    images: [
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80&auto=format&fit=crop',
        alt: '2023 Range Rover Sport',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Air Suspension',
      'Meridian Sound System',
      'Panoramic Roof',
      'Head-Up Display',
      '360 Camera',
    ],
    createdAt: '2024-09-11T10:00:00Z',
    updatedAt: '2024-09-11T10:00:00Z',
  },
  // ─── Tesla ───────────────────────────────────────────────────
  {
    id: '6',
    slug: '2024-tesla-model-s-plaid',
    make: 'Tesla',
    model: 'Model S',
    variant: 'Plaid',
    year: 2024,
    condition: 'new',
    price: 108990,
    currency: 'USD',
    mileage: 5,
    fuelType: 'Electric',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'Sedan',
    exteriorColor: 'Pearl White',
    interiorColor: 'Black and White',
    description:
      'The quickest production sedan ever. 1,020 horsepower, 0-60 in under 2 seconds.',
    status: 'available',
    featured: false,
    locationId: 'loc-1',
    images: [
      {
        id: 'img-7',
        url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tesla Model S Plaid',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Autopilot',
      'Full Self-Driving Capability',
      '22 Speaker Audio',
      'Yoke Steering',
      'Glass Roof',
    ],
    createdAt: '2024-09-10T10:00:00Z',
    updatedAt: '2024-09-10T10:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════════
  // HYUNDAI — 5 Models
  // ═══════════════════════════════════════════════════════════════

  // ─── Hyundai Creta ───────────────────────────────────────────
  {
    id: '7',
    slug: '2024-hyundai-creta',
    make: 'Hyundai',
    model: 'Creta',
    variant: 'SX (O) 1.5 Turbo DCT',
    year: 2024,
    condition: 'new',
    price: 1850000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Atlas White',
    interiorColor: 'Dual Tone Black & Red',
    description:
      'The all-new Hyundai Creta with turbo petrol engine, panoramic sunroof, and Level 2 ADAS. India\'s best-selling SUV just got even better.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-8',
        url: 'https://images.unsplash.com/photo-1633695632011-857d8v32c4e5?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai Creta Atlas White',
        order: 0,
        isPrimary: true,
      },
      {
        id: 'img-9',
        url: 'https://images.unsplash.com/photo-1629725753115-ee6cd2b5d4b5?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai Creta interior',
        order: 1,
        isPrimary: false,
      },
    ],
    features: [
      'Panoramic Sunroof',
      '10.25" Digital Cluster',
      'Bose Premium Sound',
      'Level 2 ADAS',
      'Ventilated Front Seats',
      'Wireless Charging',
    ],
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  // ─── Hyundai Venue ───────────────────────────────────────────
  {
    id: '8',
    slug: '2024-hyundai-venue',
    make: 'Hyundai',
    model: 'Venue',
    variant: 'SX+ 1.0 Turbo iMT',
    year: 2024,
    condition: 'new',
    price: 1250000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Manual',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Titan Grey',
    interiorColor: 'Black',
    description:
      'Compact, connected, and loaded with tech. The Hyundai Venue is the perfect city SUV with turbo performance and smart features.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-10',
        url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai Venue Titan Grey',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '10.25" Touchscreen',
      'BlueLink Connected Car',
      'Sunroof',
      'Cruise Control',
      'Rear Camera',
      '6 Airbags',
    ],
    createdAt: '2024-10-02T10:00:00Z',
    updatedAt: '2024-10-02T10:00:00Z',
  },
  // ─── Hyundai Verna ───────────────────────────────────────────
  {
    id: '9',
    slug: '2024-hyundai-verna',
    make: 'Hyundai',
    model: 'Verna',
    variant: 'SX (O) 1.5 Turbo GDi DCT',
    year: 2024,
    condition: 'new',
    price: 1750000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'Sedan',
    exteriorColor: 'Starry Night',
    interiorColor: 'Black',
    description:
      'The new Hyundai Verna redefines the premium sedan segment with its sporty design, turbo engine, and advanced safety suite.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-11',
        url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai Verna Starry Night',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Dual 10.25" Screens',
      'Bose Sound',
      'ADAS Level 2',
      'Ventilated Seats',
      'Electric Sunroof',
      '6 Airbags',
    ],
    createdAt: '2024-10-03T10:00:00Z',
    updatedAt: '2024-10-03T10:00:00Z',
  },
  // ─── Hyundai i20 ─────────────────────────────────────────────
  {
    id: '10',
    slug: '2024-hyundai-i20',
    make: 'Hyundai',
    model: 'i20',
    variant: 'Asta (O) 1.0 Turbo DCT',
    year: 2024,
    condition: 'new',
    price: 1150000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'Hatchback',
    exteriorColor: 'Polar White',
    interiorColor: 'Black & Red',
    description:
      'The sporty Hyundai i20 N Line brings turbo performance and aggressive styling to the premium hatchback segment.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-12',
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai i20 Polar White',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '10.25" Touchscreen',
      'Bose Sound',
      'Sunroof',
      'Wireless Apple CarPlay',
      'Rear Camera',
      '6 Airbags',
    ],
    createdAt: '2024-10-04T10:00:00Z',
    updatedAt: '2024-10-04T10:00:00Z',
  },
  // ─── Hyundai Tucson ──────────────────────────────────────────
  {
    id: '11',
    slug: '2024-hyundai-tucson',
    make: 'Hyundai',
    model: 'Tucson',
    variant: 'Signature 1.6 CRDi AWD',
    year: 2024,
    condition: 'new',
    price: 3650000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Shadow Grey',
    interiorColor: 'Beige',
    description:
      'The flagship Hyundai Tucson with AWD diesel power, premium leather, and a stunning parametric design language.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-13',
        url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Hyundai Tucson Shadow Grey',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Panoramic Sunroof',
      '10.25" Digital Cluster',
      'Krell Premium Sound',
      'Ventilated Seats',
      'ADAS',
      'AWD',
      'Electric Tailgate',
    ],
    createdAt: '2024-10-05T10:00:00Z',
    updatedAt: '2024-10-05T10:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════════
  // KIA — 5 Models
  // ═══════════════════════════════════════════════════════════════

  // ─── Kia Seltos ──────────────────────────────────────────────
  {
    id: '12',
    slug: '2024-kia-seltos',
    make: 'Kia',
    model: 'Seltos',
    variant: 'HTX+ 1.5 Turbo iMT',
    year: 2024,
    condition: 'new',
    price: 1950000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Manual',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Gravity Grey',
    interiorColor: 'Black',
    description:
      'The Kia Seltos continues to dominate with its bold design, powerful turbo engine, and segment-first features.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-14',
        url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Kia Seltos Gravity Grey',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Dual 10.25" Screens',
      'Bose Premium Sound',
      'Ventilated Seats',
      'Panoramic Sunroof',
      'ADAS',
      '6 Airbags',
    ],
    createdAt: '2024-10-06T10:00:00Z',
    updatedAt: '2024-10-06T10:00:00Z',
  },
  // ─── Kia Sonet ───────────────────────────────────────────────
  {
    id: '13',
    slug: '2024-kia-sonet',
    make: 'Kia',
    model: 'Sonet',
    variant: 'HTX+ 1.0 Turbo iMT',
    year: 2024,
    condition: 'new',
    price: 1350000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Manual',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Imperial Blue',
    interiorColor: 'Black',
    description:
      'The Kia Sonet packs premium features into a compact package — turbo power, sunroof, and connected car tech.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-15',
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Kia Sonet Imperial Blue',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '8" Touchscreen',
      'Kia Connect',
      'Sunroof',
      'Cruise Control',
      'Rear Camera',
      '6 Airbags',
    ],
    createdAt: '2024-10-07T10:00:00Z',
    updatedAt: '2024-10-07T10:00:00Z',
  },
  // ─── Kia Carens ──────────────────────────────────────────────
  {
    id: '14',
    slug: '2024-kia-carens',
    make: 'Kia',
    model: 'Carens',
    variant: 'Prestige 1.5 Diesel AT',
    year: 2024,
    condition: 'new',
    price: 1850000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'MPV',
    exteriorColor: 'Sparkling Silver',
    interiorColor: 'Beige',
    description:
      'The Kia Carens is a 6/7-seater MPV designed for families — spacious, feature-loaded, and comfortable for long drives.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-16',
        url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Kia Carens Sparkling Silver',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '8" Touchscreen',
      'Kia Connect',
      'Ventilated Seats',
      '6 Airbags',
      'Rear AC Vents',
      'Cruise Control',
    ],
    createdAt: '2024-10-08T10:00:00Z',
    updatedAt: '2024-10-08T10:00:00Z',
  },
  // ─── Kia EV6 ─────────────────────────────────────────────────
  {
    id: '15',
    slug: '2024-kia-ev6',
    make: 'Kia',
    model: 'EV6',
    variant: 'GT-Line AWD',
    year: 2024,
    condition: 'new',
    price: 6200000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Electric',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Runway Red',
    interiorColor: 'Black',
    description:
      'The Kia EV6 GT-Line is a head-turning electric crossover with 800V ultra-fast charging, 528km range, and 325hp dual motors.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-17',
        url: 'https://images.unsplash.com/photo-1593941707882-a5bba149380b?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Kia EV6 Runway Red',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '800V Fast Charging',
      'Dual 12.3" Curved Displays',
      'Meridian Sound',
      'AR Head-Up Display',
      'Vehicle-to-Load',
      'Remote Smart Parking',
    ],
    createdAt: '2024-10-09T10:00:00Z',
    updatedAt: '2024-10-09T10:00:00Z',
  },
  // ─── Kia K5 ──────────────────────────────────────────────────
  {
    id: '16',
    slug: '2024-kia-k5',
    make: 'Kia',
    model: 'K5',
    variant: 'GT-Line 2.5T',
    year: 2024,
    condition: 'new',
    price: 3450000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'Sedan',
    exteriorColor: 'Aurora Black',
    interiorColor: 'Black',
    description:
      'The Kia K5 GT-Line is a sporty mid-size sedan with a turbo 2.5L engine, fastback styling, and premium interior.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-18',
        url: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Kia K5 Aurora Black',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '12.3" Touchscreen',
      'Harman Kardon Sound',
      'Panoramic Sunroof',
      'Ventilated Seats',
      'Smart Cruise Control',
      '10 Airbags',
    ],
    createdAt: '2024-10-10T10:00:00Z',
    updatedAt: '2024-10-10T10:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════════
  // TATA — 5 Models
  // ═══════════════════════════════════════════════════════════════

  // ─── Tata Nexon ──────────────────────────────────────────────
  {
    id: '17',
    slug: '2024-tata-nexon',
    make: 'Tata',
    model: 'Nexon',
    variant: 'Creative+ 1.2 Turbo',
    year: 2024,
    condition: 'new',
    price: 1450000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Daytona Blue',
    interiorColor: 'Black',
    description:
      'The Tata Nexon is India\'s safest compact SUV with 5-star Global NCAP rating, turbo petrol power, and connected car tech.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-19',
        url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tata Nexon Daytona Blue',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '7" Touchscreen',
      'Tata iRA Connected Car',
      'Sunroof',
      '6 Airbags',
      'ABS with EBD',
      'Rear Camera',
      '5-Star Safety Rating',
    ],
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  // ─── Tata Harrier ────────────────────────────────────────────
  {
    id: '18',
    slug: '2024-tata-harrier',
    make: 'Tata',
    model: 'Harrier',
    variant: 'Fearless+ 2.0 Diesel AT',
    year: 2024,
    condition: 'new',
    price: 2550000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Calgary White',
    interiorColor: 'Black & Red',
    description:
      'The Tata Harrier is a bold, muscular SUV with a 2.0L Kryotec diesel engine, panoramic sunroof, and ADAS.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-20',
        url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tata Harrier Calgary White',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Panoramic Sunroof',
      '10" Touchscreen',
      'JBL Premium Sound',
      'ADAS',
      'Ventilated Seats',
      '6 Airbags',
      '5-Star Safety',
    ],
    createdAt: '2024-10-02T10:00:00Z',
    updatedAt: '2024-10-02T10:00:00Z',
  },
  // ─── Tata Safari ─────────────────────────────────────────────
  {
    id: '19',
    slug: '2024-tata-safari',
    make: 'Tata',
    model: 'Safari',
    variant: 'Accomplished+ 2.0 Diesel AT 6S',
    year: 2024,
    condition: 'new',
    price: 2850000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Royal Blue',
    interiorColor: 'Oyster White',
    description:
      'The Tata Safari is a commanding 6/7-seater SUV with premium interiors, ADAS, and the powerful Kryotec diesel engine.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-21',
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tata Safari Royal Blue',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Panoramic Sunroof',
      '12.3" Digital Cluster',
      '10" Touchscreen',
      'JBL Sound',
      'ADAS',
      'Ventilated Seats',
      '6 Airbags',
    ],
    createdAt: '2024-10-03T10:00:00Z',
    updatedAt: '2024-10-03T10:00:00Z',
  },
  // ─── Tata Punch ──────────────────────────────────────────────
  {
    id: '20',
    slug: '2024-tata-punch',
    make: 'Tata',
    model: 'Punch',
    variant: 'Adventure AMT',
    year: 2024,
    condition: 'new',
    price: 950000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Tornado Blue',
    interiorColor: 'Black',
    description:
      'The Tata Punch is a micro-SUV with bold SUV styling, 5-star safety, and compact dimensions perfect for city driving.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-22',
        url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tata Punch Tornado Blue',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '7" Touchscreen',
      'Android Auto & Apple CarPlay',
      'Rear Camera',
      '6 Airbags',
      '5-Star Safety',
      'ABS with EBD',
    ],
    createdAt: '2024-10-04T10:00:00Z',
    updatedAt: '2024-10-04T10:00:00Z',
  },
  // ─── Tata Curvv ──────────────────────────────────────────────
  {
    id: '21',
    slug: '2024-tata-curvv',
    make: 'Tata',
    model: 'Curvv',
    variant: 'Creative+ 1.2 Turbo DCA',
    year: 2024,
    condition: 'new',
    price: 1750000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Virtual Gold',
    interiorColor: 'Black',
    description:
      'The Tata Curvv is a coupe-SUV with a futuristic design, turbo petrol engine, and a sloping roofline that turns heads.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-23',
        url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Tata Curvv Virtual Gold',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '10.25" Touchscreen',
      'Tata iRA Connected',
      'Panoramic Sunroof',
      'Ventilated Seats',
      '6 Airbags',
      'ADAS',
      'Wireless Charging',
    ],
    createdAt: '2024-10-05T10:00:00Z',
    updatedAt: '2024-10-05T10:00:00Z',
  },

  // ═══════════════════════════════════════════════════════════════
  // MAHINDRA — 5 Models
  // ═══════════════════════════════════════════════════════════════

  // ─── Mahindra XUV700 ─────────────────────────────────────────
  {
    id: '22',
    slug: '2024-mahindra-xuv700',
    make: 'Mahindra',
    model: 'XUV700',
    variant: 'AX7 L 2.2 Diesel AT AWD',
    year: 2024,
    condition: 'new',
    price: 2750000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Midnight Black',
    interiorColor: 'Blaze Red',
    description:
      'The Mahindra XUV700 is a tech-loaded flagship SUV with AWD, ADAS, a powerful diesel engine, and 5/7 seat options.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-24',
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mahindra XUV700 Midnight Black',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      'Dual 10.25" Screens',
      'Sony 3D Sound',
      'Panoramic Sunroof',
      'ADAS',
      'AWD',
      'Ventilated Seats',
      '7 Airbags',
    ],
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  // ─── Mahindra XUV300 ─────────────────────────────────────────
  {
    id: '23',
    slug: '2024-mahindra-xuv300',
    make: 'Mahindra',
    model: 'XUV300',
    variant: 'W8 1.2 Turbo',
    year: 2024,
    condition: 'new',
    price: 1350000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Manual',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Naples Black',
    interiorColor: 'Black',
    description:
      'The Mahindra XUV300 is a compact SUV with 5-star safety, turbo petrol power, and premium features at a competitive price.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-25',
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mahindra XUV300 Naples Black',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '8" Touchscreen',
      'Sunroof',
      '7 Airbags',
      '5-Star Safety',
      'Cruise Control',
      'Rear Camera',
    ],
    createdAt: '2024-10-02T10:00:00Z',
    updatedAt: '2024-10-02T10:00:00Z',
  },
  // ─── Mahindra Scorpio-N ──────────────────────────────────────
  {
    id: '24',
    slug: '2024-mahindra-scorpio-n',
    make: 'Mahindra',
    model: 'Scorpio-N',
    variant: 'Z8 L 2.2 Diesel AT 4WD',
    year: 2024,
    condition: 'new',
    price: 2450000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: '4WD',
    bodyStyle: 'SUV',
    exteriorColor: 'Galaxy Grey',
    interiorColor: 'Black',
    description:
      'The all-new Mahindra Scorpio-N is a legendary off-roader reborn — 4WD, diesel torque, and modern tech in a rugged package.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-26',
        url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mahindra Scorpio-N Galaxy Grey',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '4WD',
      '10.25" Touchscreen',
      'Sony Sound',
      'Sunroof',
      '6 Airbags',
      'ADAS',
      'Terrain Modes',
    ],
    createdAt: '2024-10-03T10:00:00Z',
    updatedAt: '2024-10-03T10:00:00Z',
  },
  // ─── Mahindra Thar ───────────────────────────────────────────
  {
    id: '25',
    slug: '2024-mahindra-thar',
    make: 'Mahindra',
    model: 'Thar',
    variant: 'LX 4-Str Hard Top 4WD AT',
    year: 2024,
    condition: 'new',
    price: 1750000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    drivetrain: '4WD',
    bodyStyle: 'SUV',
    exteriorColor: 'Red Rage',
    interiorColor: 'Black',
    description:
      'The Mahindra Thar is an iconic off-roader — rugged 4WD, convertible hard top, and head-turning design in Red Rage.',
    status: 'available',
    featured: true,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-27',
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mahindra Thar Red Rage',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '4WD',
      'Convertible Hard Top',
      '7" Touchscreen',
      'Cruise Control',
      '4 Airbags',
      'Off-Road Modes',
      'Snorkel Ready',
    ],
    createdAt: '2024-10-04T10:00:00Z',
    updatedAt: '2024-10-04T10:00:00Z',
  },
  // ─── Mahindra XUV400 ─────────────────────────────────────────
  {
    id: '26',
    slug: '2024-mahindra-xuv400',
    make: 'Mahindra',
    model: 'XUV400',
    variant: 'EL Pro 34.5 kWh',
    year: 2024,
    condition: 'new',
    price: 1750000,
    currency: 'INR',
    mileage: 0,
    fuelType: 'Electric',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    bodyStyle: 'SUV',
    exteriorColor: 'Everest White',
    interiorColor: 'Black',
    description:
      'The Mahindra XUV400 is an electric compact SUV with 456km real-world range, fast charging, and connected car features.',
    status: 'available',
    featured: false,
    locationId: 'loc-3',
    images: [
      {
        id: 'img-28',
        url: 'https://images.unsplash.com/photo-1593941707882-a5bba149380b?w=800&q=80&auto=format&fit=crop',
        alt: '2024 Mahindra XUV400 Everest White',
        order: 0,
        isPrimary: true,
      },
    ],
    features: [
      '456km Range',
      '50kW DC Fast Charging',
      '10.25" Touchscreen',
      'Connected Car Tech',
      '6 Airbags',
      'OTA Updates',
      'Regenerative Braking',
    ],
    createdAt: '2024-10-05T10:00:00Z',
    updatedAt: '2024-10-05T10:00:00Z',
  },
];

export function getFeaturedVehicles(): Vehicle[] {
  return demoVehicles.filter((v) => v.featured);
}

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return demoVehicles.find((v) => v.slug === slug);
}

export function getAllMakes(): string[] {
  const makes = [...new Set(demoVehicles.map((v) => v.make))];
  return makes.sort();
}

export function getAllBodyStyles(): string[] {
  const styles = [...new Set(demoVehicles.map((v) => v.bodyStyle))];
  return styles.sort();
}

export function getAllFuelTypes(): string[] {
  const types = [...new Set(demoVehicles.map((v) => v.fuelType))];
  return types.sort();
}

export function searchVehicles(filters: {
  query?: string;
  bodyStyle?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  make?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}): {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  let results = [...demoVehicles];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.variant && v.variant.toLowerCase().includes(q))
    );
  }

  if (filters.bodyStyle) {
    results = results.filter(
      (v) => v.bodyStyle.toLowerCase() === filters.bodyStyle!.toLowerCase()
    );
  }

  if (filters.fuelType) {
    results = results.filter(
      (v) => v.fuelType.toLowerCase() === filters.fuelType!.toLowerCase()
    );
  }

  if (filters.condition) {
    results = results.filter(
      (v) => v.condition.toLowerCase() === filters.condition!.toLowerCase()
    );
  }

  if (filters.make) {
    results = results.filter(
      (v) => v.make.toLowerCase() === filters.make!.toLowerCase()
    );
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((v) => v.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((v) => v.price <= filters.maxPrice!);
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'year-desc':
        results.sort((a, b) => b.year - a.year);
        break;
      case 'mileage-asc':
        results.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'newest':
      default:
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedResults = results.slice(start, start + limit);

  return {
    vehicles: paginatedResults,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get available color options for a vehicle based on make/model.
 * Returns realistic color swatches for exterior and interior.
 */
export function getVehicleColorOptions(vehicle: Vehicle): ColorOption[] {
  // Per-color image pools — different car photos for each color swatch.
  // In production these would be actual studio shots of the exact model in each colour.
  const colorImageSets: Record<string, Record<string, string>> = {
    BMW: {
      'Isle of Man Green': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80&auto=format&fit=crop',
      'Alpine White': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop',
      'Black Sapphire': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80&auto=format&fit=crop',
      'Portimao Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
      'Toronto Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
    },
    'Mercedes-Benz': {
      'Obsidian Black': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80&auto=format&fit=crop',
      'Polar White': 'https://images.unsplash.com/photo-1617654112368-307928259b2e?w=800&q=80&auto=format&fit=crop',
      'Selenite Grey': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80&auto=format&fit=crop',
      'Brilliant Blue': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop',
      'Hyacinth Red': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80&auto=format&fit=crop',
    },
    Porsche: {
      'Guards Red': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80&auto=format&fit=crop',
      'Carrara White': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
      'Jet Black': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop',
      'Racing Yellow': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop',
      'Shark Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
      'Agate Grey': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&auto=format&fit=crop',
    },
    Audi: {
      'Daytona Grey': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
      'Ibis White': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80&auto=format&fit=crop',
      'Mythos Black': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80&auto=format&fit=crop',
      'Navarra Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
      'Tango Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
    },
    'Land Rover': {
      'Santorini Black': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80&auto=format&fit=crop',
      'Fuji White': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop',
      'Carpathian Grey': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
      'Britannia Blue': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop',
      'Firenze Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
    },
    Tesla: {
      'Pearl White': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80&auto=format&fit=crop',
      'Solid Black': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80&auto=format&fit=crop',
      'Midnight Silver': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
      'Deep Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
      'Ultra Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
      'Quicksilver': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
    },
    Hyundai: {
      'Atlas White': 'https://images.unsplash.com/photo-1633695632011-857d8v32c4e5?w=800&q=80&auto=format&fit=crop',
      'Midnight Black': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80&auto=format&fit=crop',
      'Titan Grey': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80&auto=format&fit=crop',
      'Dragon Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
      'Typhoon Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
    },
    Kia: {
      'Aurora Black': 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80&auto=format&fit=crop',
      'Snow White Pearl': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80&auto=format&fit=crop',
      'Steel Grey': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop',
      'Passion Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
      'Clearwater Blue': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop',
      'Gravity Grey': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
    },
    Tata: {
      'Daytona Blue': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80&auto=format&fit=crop',
      'Pearl White': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop',
      'Midnight Black': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80&auto=format&fit=crop',
      'Tectonic Grey': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
      'Flame Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
      'Signature Teal Blue': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop',
    },
    Mahindra: {
      'Midnight Black': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
      'Pearl White': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop',
      'Tungsten Grey': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
      'Molten Red': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80&auto=format&fit=crop',
      'Navy Blue': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop',
      'Smoky Grey': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
    },
  };

  const baseColorMap: Record<string, ColorOption[]> = {
    BMW: [
      { name: 'Isle of Man Green', hex: '#2D4A3E', type: 'exterior' },
      { name: 'Alpine White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Black Sapphire', hex: '#1C1C1E', type: 'exterior' },
      { name: 'Portimao Blue', hex: '#2E4A6B', type: 'exterior', price: 500 },
      { name: 'Toronto Red', hex: '#8B2635', type: 'exterior', price: 500 },
      { name: 'Black Merino Leather', hex: '#1A1A1A', type: 'interior' },
      { name: 'Cognac Merino Leather', hex: '#8B5A3E', type: 'interior', price: 1200 },
      { name: 'Silverstone Merino Leather', hex: '#C0C0C0', type: 'interior', price: 1200 },
    ],
    'Mercedes-Benz': [
      { name: 'Obsidian Black', hex: '#0F0F0F', type: 'exterior' },
      { name: 'Polar White', hex: '#FAFAFA', type: 'exterior' },
      { name: 'Selenite Grey', hex: '#6B6B6B', type: 'exterior', price: 800 },
      { name: 'Brilliant Blue', hex: '#1E3A5F', type: 'exterior', price: 800 },
      { name: 'Hyacinth Red', hex: '#6F1B2A', type: 'exterior', price: 1200 },
      { name: 'Macchiato Beige', hex: '#D4C5B0', type: 'interior' },
      { name: 'Black Nappa Leather', hex: '#1A1A1A', type: 'interior' },
      { name: 'Bengal Red Nappa', hex: '#5C1A1A', type: 'interior', price: 2500 },
    ],
    Porsche: [
      { name: 'Guards Red', hex: '#C41E3A', type: 'exterior' },
      { name: 'Carrara White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Jet Black', hex: '#0F0F0F', type: 'exterior' },
      { name: 'Racing Yellow', hex: '#F4D03F', type: 'exterior', price: 2700 },
      { name: 'Shark Blue', hex: '#2E5A88', type: 'exterior', price: 720 },
      { name: 'Agate Grey', hex: '#7A7A7A', type: 'exterior', price: 850 },
      { name: 'Black Leather', hex: '#1A1A1A', type: 'interior' },
      { name: 'Crayon Red Leather', hex: '#6B1A2A', type: 'interior', price: 3200 },
      { name: 'Espresso Leather', hex: '#3E2723', type: 'interior', price: 3200 },
    ],
    Audi: [
      { name: 'Daytona Grey', hex: '#5A5A5A', type: 'exterior' },
      { name: 'Ibis White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Mythos Black', hex: '#0F0F0F', type: 'exterior' },
      { name: 'Navarra Blue', hex: '#1E3A5F', type: 'exterior', price: 500 },
      { name: 'Tango Red', hex: '#8B1A1A', type: 'exterior', price: 500 },
      { name: 'Express Red', hex: '#6B1A1A', type: 'interior' },
      { name: 'Black Optic', hex: '#1A1A1A', type: 'interior' },
      { name: 'Rock Grey', hex: '#4A4A4A', type: 'interior', price: 1800 },
    ],
    'Land Rover': [
      { name: 'Santorini Black', hex: '#1A1A1A', type: 'exterior' },
      { name: 'Fuji White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Carpathian Grey', hex: '#6B6B6B', type: 'exterior', price: 1500 },
      { name: 'Britannia Blue', hex: '#1E3A5F', type: 'exterior', price: 1500 },
      { name: 'Firenze Red', hex: '#6B1A1A', type: 'exterior', price: 1500 },
      { name: 'Ebony', hex: '#1A1A1A', type: 'interior' },
      { name: 'Ivory', hex: '#F5F0E8', type: 'interior' },
      { name: 'Acorn', hex: '#8B6F47', type: 'interior', price: 3500 },
    ],
    Tesla: [
      { name: 'Pearl White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Solid Black', hex: '#0F0F0F', type: 'exterior' },
      { name: 'Midnight Silver', hex: '#4A4A4A', type: 'exterior', price: 1500 },
      { name: 'Deep Blue', hex: '#1E3A5F', type: 'exterior', price: 1500 },
      { name: 'Ultra Red', hex: '#8B1A1A', type: 'exterior', price: 2500 },
      { name: 'Quicksilver', hex: '#C0C0C0', type: 'exterior', price: 1500 },
      { name: 'Black and White', hex: '#1A1A1A', type: 'interior' },
      { name: 'Cream', hex: '#F5E8D0', type: 'interior', price: 1000 },
    ],
    Hyundai: [
      { name: 'Atlas White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Midnight Black', hex: '#1A1A1A', type: 'exterior' },
      { name: 'Titan Grey', hex: '#6B6B6B', type: 'exterior' },
      { name: 'Dragon Red', hex: '#8B2635', type: 'exterior', price: 50000 },
      { name: 'Typhoon Blue', hex: '#2E5A88', type: 'exterior', price: 50000 },
      { name: 'Dual Tone Black & Red', hex: '#1A1A1A', type: 'interior' },
      { name: 'Beige', hex: '#D4C5B0', type: 'interior' },
      { name: 'Dual Tone White & Black', hex: '#F5F5F0', type: 'interior', price: 25000 },
    ],
    Kia: [
      { name: 'Aurora Black', hex: '#0F0F0F', type: 'exterior' },
      { name: 'Snow White Pearl', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Steel Grey', hex: '#6B6B6B', type: 'exterior' },
      { name: 'Passion Red', hex: '#8B1A1A', type: 'exterior', price: 40000 },
      { name: 'Clearwater Blue', hex: '#2E5A88', type: 'exterior', price: 40000 },
      { name: 'Gravity Grey', hex: '#4A4A4A', type: 'exterior', price: 40000 },
      { name: 'Black', hex: '#1A1A1A', type: 'interior' },
      { name: 'Beige', hex: '#D4C5B0', type: 'interior' },
      { name: 'Red & Black', hex: '#6B1A1A', type: 'interior', price: 30000 },
    ],
    Tata: [
      { name: 'Daytona Blue', hex: '#2E5A88', type: 'exterior' },
      { name: 'Pearl White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Midnight Black', hex: '#1A1A1A', type: 'exterior' },
      { name: 'Tectonic Grey', hex: '#6B6B6B', type: 'exterior' },
      { name: 'Flame Red', hex: '#8B2635', type: 'exterior', price: 30000 },
      { name: 'Signature Teal Blue', hex: '#1E4A5F', type: 'exterior', price: 30000 },
      { name: 'Black', hex: '#1A1A1A', type: 'interior' },
      { name: 'Beige', hex: '#D4C5B0', type: 'interior', price: 15000 },
    ],
    Mahindra: [
      { name: 'Midnight Black', hex: '#1A1A1A', type: 'exterior' },
      { name: 'Pearl White', hex: '#F5F5F0', type: 'exterior' },
      { name: 'Tungsten Grey', hex: '#4A4A4A', type: 'exterior' },
      { name: 'Molten Red', hex: '#8B2635', type: 'exterior', price: 35000 },
      { name: 'Navy Blue', hex: '#1E3A5F', type: 'exterior', price: 35000 },
      { name: 'Smoky Grey', hex: '#6B6B6B', type: 'exterior', price: 35000 },
      { name: 'Black', hex: '#1A1A1A', type: 'interior' },
      { name: 'Beige', hex: '#D4C5B0', type: 'interior' },
      { name: 'Red & Black', hex: '#6B1A1A', type: 'interior', price: 20000 },
    ],
  };

  const colors = baseColorMap[vehicle.make] || [
    { name: vehicle.exteriorColor, hex: '#6B6B6B', type: 'exterior' },
    { name: 'White', hex: '#F5F5F0', type: 'exterior' },
    { name: 'Black', hex: '#1A1A1A', type: 'exterior' },
    { name: vehicle.interiorColor || 'Black', hex: '#1A1A1A', type: 'interior' },
  ];

  // Attach per-color image URLs from the image set
  const imageSet = colorImageSets[vehicle.make] || {};
  return colors.map((color) => ({
    ...color,
    imageUrl: imageSet[color.name] || undefined,
  }));
}
