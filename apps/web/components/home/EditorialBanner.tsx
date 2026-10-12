'use client';

import Link from 'next/link';
import { useGsapContext, createScrollReveal, createParallax, prefersReducedMotion } from '@/hooks/useGsap';

export function EditorialBanner() {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.editorial-animate', {
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      start: 'top 80%',
    });

    createParallax('.editorial-parallax', {
      y: -40,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-primary-dark"
    >
      <div className="container-main section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <div className="editorial-animate" style={{ opacity: 0 }}>
              <p className="text-caption text-primary-accent mb-3">
                Featured Collection
              </p>
              <h2 className="text-display-md font-bold text-white tracking-tight mb-6">
                Electric Future.
                <br />
                <span className="text-white/60">Available Today.</span>
              </h2>
              <p className="text-body-lg text-white/60 mb-8 max-w-md leading-relaxed">
                Explore our curated selection of electric and hybrid vehicles.
                Premium performance meets sustainable driving.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/vehicles?fuelType=electric"
                  className="btn-primary px-8 py-3.5"
                >
                  Explore EVs
                  <svg
                    className="ml-2 w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/vehicles?fuelType=hybrid"
                  className="inline-flex items-center px-6 py-3.5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  View Hybrids
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="editorial-animate flex gap-8 mt-12 pt-8 border-t border-white/10" style={{ opacity: 0 }}>
              <div>
                <p className="text-2xl font-bold text-white">30+</p>
                <p className="text-caption text-white/40 mt-1">Electric Models</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-caption text-white/40 mt-1">Charging Partners</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-caption text-white/40 mt-1">Emissions</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="editorial-parallax relative aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=900&q=80&auto=format&fit=crop"
                alt="Electric vehicle charging"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
