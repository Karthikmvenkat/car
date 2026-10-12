'use client';

import { useGsapContext, createScrollReveal, prefersReducedMotion } from '@/hooks/useGsap';

const testimonials = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Purchased BMW M4',
    quote:
      'CarPal made the entire experience effortless. The transparent pricing and expert guidance helped me find exactly what I was looking for.',
    avatar: 'SM',
  },
  {
    id: '2',
    name: 'James Chen',
    role: 'Purchased Mercedes EQE',
    quote:
      'I was skeptical about buying a car online, but CarPal\'s process was seamless. The test drive scheduling was a game-changer.',
    avatar: 'JC',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Purchased Porsche 911',
    quote:
      'From discovery to delivery, every step was handled with care. The team genuinely cares about matching you with the right vehicle.',
    avatar: 'ER',
  },
];

export function Testimonials() {
  const sectionRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    createScrollReveal('.test-header', {
      y: 25,
      duration: 0.6,
      start: 'top 85%',
    });

    createScrollReveal('.test-card', {
      y: 30,
      duration: 0.7,
      stagger: 0.12,
      start: 'top 82%',
    });
  }, []);

  return (
    <section ref={sectionRef} className="section-padding bg-primary-surface">
      <div className="container-main">
        {/* Header */}
        <div className="test-header text-center max-w-2xl mx-auto mb-16" style={{ opacity: 0 }}>
          <p className="text-caption text-primary-accent mb-2">
            Customer Stories
          </p>
          <h2 className="text-display-md font-bold text-primary-text tracking-tight">
            Trusted by Car Enthusiasts
          </h2>
          <p className="text-body-lg text-primary-muted mt-4">
            Real experiences from customers who found their perfect vehicle
            through CarPal.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="test-card bg-white rounded-2xl p-8 border border-primary-border"
              style={{ opacity: 0 }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-amber-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-body-md text-primary-text leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-primary-border">
                <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center text-white text-body-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-primary-text">
                    {t.name}
                  </p>
                  <p className="text-caption text-primary-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
