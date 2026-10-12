import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About CAR',
  description:
    'Learn about CAR\'s mission to transform the car buying experience with transparency, expertise, and care.',
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-main">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-caption text-primary-accent mb-2">About CAR</p>
          <h1 className="text-display-lg font-bold text-primary-text tracking-tight mb-6">
            A Better Way to Find Your Car
          </h1>
          <p className="text-body-lg text-primary-muted leading-relaxed">
            We believe buying a car should be an exciting experience, not a
            stressful one. CAR was built to bring transparency, expertise,
            and genuine care to the automotive buying journey.
          </p>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {[
            {
              title: 'Transparency First',
              description:
                'Every vehicle comes with clear, upfront pricing and detailed information. No hidden fees, no pressure tactics — just honest information to help you make the best decision.',
            },
            {
              title: 'Curated Quality',
              description:
                'We carefully vet every vehicle in our collection. Our team inspects, verifies, and only lists vehicles that meet our standards for quality, value, and reliability.',
            },
            {
              title: 'Expert Guidance',
              description:
                'Our automotive specialists bring deep industry knowledge to help you navigate options, understand trade-offs, and find the vehicle that truly fits your needs.',
            },
            {
              title: 'Customer-Centered',
              description:
                'From your first search to long after your purchase, we\'re here to support you. Every process, every interaction is designed with your experience in mind.',
            },
          ].map((value) => (
            <div
              key={value.title}
              className="p-8 rounded-2xl border border-primary-border bg-white"
            >
              <h2 className="text-heading-md font-semibold text-primary-text mb-3">
                {value.title}
              </h2>
              <p className="text-body-md text-primary-muted leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-primary-surface rounded-3xl p-12 md:p-16">
          <h2 className="text-heading-lg font-bold text-primary-text mb-4">
            Ready to Find Your Next Car?
          </h2>
          <p className="text-body-lg text-primary-muted mb-8 max-w-lg mx-auto">
            Browse our curated collection of premium vehicles and experience the
            CAR difference.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/vehicles" className="btn-primary px-8 py-3.5">
              Browse Vehicles
            </Link>
            <Link href="/contact" className="btn-secondary px-8 py-3.5">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
