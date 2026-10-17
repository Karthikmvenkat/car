'use client';

import { Hero } from '@/components/home/Hero';
import { ExploreCollection } from '@/components/home/ExploreCollection';
import { VehicleSearch } from '@/components/home/VehicleSearch';
import { PopularVehicles } from '@/components/home/PopularVehicles';
import { HowItWorks } from '@/components/home/HowItWorks';
import { TrustSection } from '@/components/home/TrustSection';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { Testimonials } from '@/components/home/Testimonials';
import { CtaBanner } from '@/components/home/CtaBanner';
import { usePublishedVehicles } from '@/lib/use-published-vehicles';


export default function HomePage() {
  const { vehicles } = usePublishedVehicles();
  const featuredVehicles = vehicles.slice(0, 6);



  return (
    <>
      <Hero />
      <VehicleSearch />
      <ExploreCollection />
      <PopularVehicles vehicles={featuredVehicles} />
      <HowItWorks />
      <TrustSection />
      <EditorialBanner />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
