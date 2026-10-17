'use client';

import Link from 'next/link';
import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

export function CtaBanner() {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.cta-animate', {
      y: 25,
      duration: 0.7,
      stagger: 0.1,
      start: 'top 85%',
    });
  }, []);

  return (
    <section ref={sectionRef} className="section-padding">
      <div className="container-main">
        <div
          className="cta-animate relative rounded-3xl overflow-hidden bg-primary-dark p-6 sm:p-10 md:p-12 text-center"

        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 50%, rgba(125, 138, 120, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(125, 138, 120, 0.3) 0%, transparent 50%)',
              }}
            />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="cta-animate" >
              <p className="text-caption text-primary-accent mb-3">
                Ready to Start?
              </p>
              <h2 className="text-display-md font-bold text-white tracking-tight mb-4">
                Your Dream Car Awaits
              </h2>
              <p className="text-body-lg text-white/60 mb-8">
                Explore the details, compare your favourites and take the
                next step with CarPal.
              </p>
            </div>

            <div className="cta-animate flex flex-wrap justify-center gap-4" >
              <Link href="/vehicles" className="btn-primary px-10 py-4 text-body-md">
                Browse Vehicles
                <svg
                  className="ml-2 w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-body-md"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
