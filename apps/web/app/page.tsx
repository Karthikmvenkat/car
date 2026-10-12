'use client';

import { Hero } from '@/components/home/Hero';
import { VehicleSearch } from '@/components/home/VehicleSearch';
import { PopularVehicles } from '@/components/home/PopularVehicles';
import { HowItWorks } from '@/components/home/HowItWorks';
import { TrustSection } from '@/components/home/TrustSection';
import { EditorialBanner } from '@/components/home/EditorialBanner';
import { Testimonials } from '@/components/home/Testimonials';
import { CtaBanner } from '@/components/home/CtaBanner';
import { getFeaturedVehicles } from '@/lib/demo-data';
import { useEffect } from 'react';

export default function HomePage() {
  const featuredVehicles = getFeaturedVehicles();

  // Safety fallback: force visibility if GSAP fails
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('[style*="opacity: 0"]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = '1';
        htmlEl.style.visibility = 'visible';
        htmlEl.style.transform = 'translateY(0)';
      });
      // Also fix any elements that GSAP set to visibility:hidden
      document.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (getComputedStyle(htmlEl).visibility === 'hidden' && htmlEl.closest('main')) {
          htmlEl.style.visibility = 'visible';
        }
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Hero />
      <VehicleSearch />
      <PopularVehicles vehicles={featuredVehicles} />
      <HowItWorks />
      <TrustSection />
      <EditorialBanner />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
