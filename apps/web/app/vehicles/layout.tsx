import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Vehicles',
  description:
    'Explore our curated collection of premium vehicles. Filter by make, model, price, body style, and more.',
};

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
