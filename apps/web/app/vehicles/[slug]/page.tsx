import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVehicleBySlug, demoVehicles, getVehicleColorOptions } from '@/lib/demo-data';
import { formatPrice, formatMileage } from '@/lib/utils';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { CarViewer3D } from '@/components/vehicles/CarViewer3D';
import { SaveButton } from '@/components/vehicles/SaveButton';

interface VehiclePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return demoVehicles.map((vehicle) => ({
    slug: vehicle.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: VehiclePageProps): Promise<Metadata> {
  const vehicle = getVehicleBySlug(params.slug);

  if (!vehicle) return { title: 'Vehicle Not Found' };

  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`,
    description: vehicle.description || `${vehicle.make} ${vehicle.model} for sale at CAR`,
    openGraph: {
      images: vehicle.images.map((img) => ({
        url: img.url,
        alt: img.alt,
      })),
    },
  };
}

export default function VehicleDetailsPage({ params }: VehiclePageProps) {
  const vehicle = getVehicleBySlug(params.slug);

  if (!vehicle) {
    notFound();
  }

  const primaryImage =
    vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];

  const colorOptions = getVehicleColorOptions(vehicle);

  const similarVehicles = demoVehicles
    .filter(
      (v) =>
        v.id !== vehicle.id &&
        (v.bodyStyle === vehicle.bodyStyle || v.make === vehicle.make)
    )
    .slice(0, 3);

  return (
    <div className="pt-24 pb-20">
      <div className="container-main">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-caption text-primary-muted mb-6">
          <Link href="/" className="hover:text-primary-accent transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/vehicles"
            className="hover:text-primary-accent transition-colors"
          >
            Vehicles
          </Link>
          <span>/</span>
          <span className="text-primary-text">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-primary-surface mb-8">
              <img
                src={primaryImage?.url || '/images/placeholder-car.svg'}
                alt={primaryImage?.alt || `${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              {vehicle.images.length > 1 && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {vehicle.images.map((img, i) => (
                    <div
                      key={img.id}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 ${
                        i === 0 ? 'border-white' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              {vehicle.featured && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-primary-accent text-white text-caption rounded-full">
                  Featured
                </div>
              )}
            </div>

            {/* 3D Car Viewer */}
            <div className="mb-8">
              <CarViewer3D
                colors={colorOptions}
                vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                vehicleImageUrl={primaryImage?.url || '/images/placeholder-car.svg'}
              />
            </div>

            {/* Title & Price */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-display-md font-bold text-primary-text tracking-tight">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  {vehicle.variant && (
                    <p className="text-body-lg text-primary-muted mt-1">
                      {vehicle.variant}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-caption text-primary-muted">Price</p>
                  <p className="text-display-md font-bold text-primary-text">
                    {formatPrice(vehicle.price, vehicle.currency)}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-surface rounded-lg text-body-sm text-primary-text">
                  <svg className="w-4 h-4 text-primary-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {formatMileage(vehicle.mileage)} miles
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-surface rounded-lg text-body-sm text-primary-text">
                  {vehicle.fuelType}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-surface rounded-lg text-body-sm text-primary-text">
                  {vehicle.transmission}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-surface rounded-lg text-body-sm text-primary-text">
                  {vehicle.bodyStyle}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-surface rounded-lg text-body-sm text-primary-text capitalize">
                  {vehicle.condition}
                </span>
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="mb-8">
                <h2 className="text-heading-md font-semibold text-primary-text mb-4">
                  Overview
                </h2>
                <p className="text-body-md text-primary-muted leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="mb-8">
              <h2 className="text-heading-md font-semibold text-primary-text mb-4">
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Make', value: vehicle.make },
                  { label: 'Model', value: vehicle.model },
                  { label: 'Year', value: vehicle.year.toString() },
                  { label: 'Body Style', value: vehicle.bodyStyle },
                  { label: 'Fuel Type', value: vehicle.fuelType },
                  { label: 'Transmission', value: vehicle.transmission },
                  { label: 'Drivetrain', value: vehicle.drivetrain || 'N/A' },
                  {
                    label: 'Exterior Color',
                    value: vehicle.exteriorColor,
                  },
                  {
                    label: 'Interior Color',
                    value: vehicle.interiorColor || 'N/A',
                  },
                  {
                    label: 'Mileage',
                    value: `${formatMileage(vehicle.mileage)} miles`,
                  },
                  { label: 'Condition', value: vehicle.condition },
                  { label: 'Status', value: vehicle.status },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="p-4 bg-primary-surface rounded-lg"
                  >
                    <p className="text-caption text-primary-muted mb-1">
                      {spec.label}
                    </p>
                    <p className="text-body-sm font-medium text-primary-text capitalize">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            {vehicle.features.length > 0 && (
              <div>
                <h2 className="text-heading-md font-semibold text-primary-text mb-4">
                  Features & Equipment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicle.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 p-3 rounded-lg"
                    >
                      <svg
                        className="w-4 h-4 text-primary-accent shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-body-sm text-primary-text">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Enquiry Card */}
              <div className="bg-white rounded-2xl border border-primary-border p-6">
                <h3 className="text-heading-sm font-semibold text-primary-text mb-4">
                  Interested in this vehicle?
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/enquire?vehicle=${vehicle.slug}`}
                    className="block w-full text-center btn-primary py-3"
                  >
                    Send Enquiry
                  </Link>
                  <Link
                    href={`/test-drive?vehicle=${vehicle.slug}`}
                    className="block w-full text-center btn-secondary py-3"
                  >
                    Schedule Test Drive
                  </Link>
                  <button className="block w-full text-center btn-secondary py-3">
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Request Callback
                    </span>
                  </button>
                </div>
              </div>

              {/* Share & Save */}
              <div className="flex gap-3">
                <SaveButton vehicleId={vehicle.id} vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-primary-border rounded-lg text-body-sm font-medium text-primary-text hover:bg-primary-surface transition-colors">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-primary-surface rounded-xl">
                <p className="text-caption text-primary-muted leading-relaxed">
                  Vehicle information is believed to be accurate but is not
                  guaranteed. Please confirm all details with our team before
                  making a purchase decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        {similarVehicles.length > 0 && (
          <div className="mt-20 pt-12 border-t border-primary-border">
            <h2 className="text-heading-lg font-bold text-primary-text mb-8">
              Similar Vehicles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {similarVehicles.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
