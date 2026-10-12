'use client';

import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

const values = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Transparent Pricing',
    description:
      'No hidden fees, no surprises. Every vehicle comes with clear, upfront pricing so you can make confident decisions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Expert Guidance',
    description:
      'Our automotive specialists are here to help you navigate options, compare vehicles, and find the perfect match.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Curated Inventory',
    description:
      'Every vehicle in our collection is carefully vetted for quality, history, and value. Only the best make the cut.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Seamless Experience',
    description:
      'From discovery to delivery, every touchpoint is designed to be smooth, intuitive, and stress-free.',
  },
];

export function TrustSection() {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.trust-header', {
      y: 25,
      duration: 0.6,
      start: 'top 85%',
    });

    createScrollReveal('.trust-card', {
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      start: 'top 82%',
    });
  }, []);

  return (
    <section ref={sectionRef} className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="trust-header text-center max-w-2xl mx-auto mb-16" style={{ opacity: 0 }}>
          <p className="text-caption text-primary-accent mb-2">Why CAR</p>
          <h2 className="text-display-md font-bold text-primary-text tracking-tight">
            A Better Way to Find Your Car
          </h2>
          <p className="text-body-lg text-primary-muted mt-4">
            We&apos;re reimagining the car buying experience with transparency,
            expertise, and care at every step.
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="trust-card flex gap-5 p-6 lg:p-8 rounded-2xl border border-primary-border hover:border-primary-accent/30 hover:shadow-md transition-all duration-300"
              style={{ opacity: 0 }}
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-surface flex items-center justify-center text-primary-accent">
                {value.icon}
              </div>
              <div>
                <h3 className="text-heading-sm font-semibold text-primary-text mb-2">
                  {value.title}
                </h3>
                <p className="text-body-md text-primary-muted leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
