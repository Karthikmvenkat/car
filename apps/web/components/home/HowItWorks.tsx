'use client';

import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

const steps = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Browse our curated collection of premium vehicles. Use smart filters to find exactly what you\'re looking for.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Explore',
    description:
      'Get transparent information, detailed specifications, and expert guidance for every vehicle.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Connect',
    description:
      'Enquire, schedule a test drive, or continue with the purchase process. We\'re here to help every step.',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.hiw-header', {
      y: 25,
      duration: 0.6,
      start: 'top 85%',
    });

    createScrollReveal('.hiw-step', {
      y: 30,
      duration: 0.7,
      stagger: 0.15,
      start: 'top 82%',
    });
  }, []);

  return (
    <section ref={sectionRef} className="section-padding bg-primary-surface">
      <div className="container-main">
        {/* Header */}
        <div className="hiw-header text-center max-w-2xl mx-auto mb-16" style={{ opacity: 0 }}>
          <p className="text-caption text-primary-accent mb-2">Simple Process</p>
          <h2 className="text-display-md font-bold text-primary-text tracking-tight">
            How CarPal Works
          </h2>
          <p className="text-body-lg text-primary-muted mt-4">
            A streamlined experience designed to make finding your next car
            enjoyable, not overwhelming.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="hiw-step relative bg-white rounded-2xl p-8 border border-primary-border hover:shadow-lg hover:border-primary-accent/30 transition-all duration-300"
              style={{ opacity: 0 }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-8 px-3 py-1 bg-primary-accent text-white text-caption rounded-full">
                Step {step.number}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary-surface flex items-center justify-center text-primary-accent mb-6 mt-2">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-heading-md font-semibold text-primary-text mb-3">
                {step.title}
              </h3>
              <p className="text-body-md text-primary-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
