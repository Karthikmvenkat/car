import Link from 'next/link';

export const metadata = {
  title: 'Get Started with CarPal',
  description: 'Learn how to find your perfect car with CarPal. Simple steps to discover, explore, and connect.',
};

export default function GetStartedPage() {
  return (
    <div className="bg-primary-bg">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/5 to-transparent" />
        <div className="container-main relative">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-caption text-primary-accent mb-4">
              Getting started
            </p>
            <h1 className="text-display-lg font-semibold text-primary-text mb-6">
              Your journey to the right car starts here
            </h1>
            <p className="text-body-lg text-primary-muted mb-8">
              CarPal makes finding and enquiring about vehicles simple, transparent, and stress-free. Here's how to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/vehicles" className="btn-primary">
                Browse vehicles
              </Link>
              <Link href="/register" className="btn-secondary">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-surface flex items-center justify-center">
                    <span className="text-heading-sm font-semibold text-primary-accent">1</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-heading-md font-semibold text-primary-text mb-3">
                    Create your account
                  </h2>
                  <p className="text-body-sm text-primary-muted leading-relaxed mb-4">
                    Sign up in seconds with your email address. Having an account lets you save vehicles, track your enquiries, and book test drives — all in one place.
                  </p>
                  <ul className="space-y-2 text-body-sm text-primary-muted">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Free to create, no commitment required
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Save your favorite vehicles for later
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Track all your enquiries in one dashboard
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-surface flex items-center justify-center">
                    <span className="text-heading-sm font-semibold text-primary-accent">2</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-heading-md font-semibold text-primary-text mb-3">
                    Discover vehicles
                  </h2>
                  <p className="text-body-sm text-primary-muted leading-relaxed mb-4">
                    Browse our curated inventory using powerful search and filter tools. Narrow down by make, model, price range, body style, fuel type, and more to find vehicles that match your needs.
                  </p>
                  <ul className="space-y-2 text-body-sm text-primary-muted">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced filters for precise results
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Detailed vehicle pages with full specifications
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      High-quality images and comprehensive details
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-surface flex items-center justify-center">
                    <span className="text-heading-sm font-semibold text-primary-accent">3</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-heading-md font-semibold text-primary-text mb-3">
                    Enquire or book a test drive
                  </h2>
                  <p className="text-body-sm text-primary-muted leading-relaxed mb-4">
                    Found something you like? Send an enquiry directly from the vehicle page or schedule a test drive at a time that works for you. Our team will respond promptly to help you move forward.
                  </p>
                  <ul className="space-y-2 text-body-sm text-primary-muted">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Simple enquiry forms with quick response times
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Flexible test-drive scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-primary-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      No obligation — explore at your own pace
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-surface flex items-center justify-center">
                    <span className="text-heading-sm font-semibold text-primary-accent">4</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-heading-md font-semibold text-primary-text mb-3">
                    Get expert guidance
                  </h2>
                  <p className="text-body-sm text-primary-muted leading-relaxed">
                    Our team is here to help you every step of the way. Whether you have questions about a specific vehicle, need help comparing options, or want advice on the buying process, we provide transparent, pressure-free guidance to help you make the right decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-main">
          <div className="bg-primary-dark rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,138,120,0.15),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-display-sm font-semibold text-white mb-4">
                Ready to find your perfect car?
              </h2>
              <p className="text-body-md text-white/70 mb-8 max-w-lg mx-auto">
                Join thousands of satisfied customers who found their ideal vehicle through CarPal.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/vehicles" className="btn-primary">
                  Start exploring
                </Link>
                <Link href="/contact" className="btn-secondary border-white/20 text-white hover:bg-white/10">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
