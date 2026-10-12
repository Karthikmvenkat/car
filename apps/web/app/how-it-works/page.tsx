import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How CAR Works',
  description:
    'Learn how CAR makes finding and buying your next car simple, transparent, and enjoyable.',
};

export default function HowItWorksPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-main">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-caption text-primary-accent mb-2">Our Process</p>
          <h1 className="text-display-lg font-bold text-primary-text tracking-tight mb-6">
            How CAR Works
          </h1>
          <p className="text-body-lg text-primary-muted">
            A streamlined, transparent process designed to make your car buying
            experience exceptional from start to finish.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-16">
          {[
            {
              step: '01',
              title: 'Discover Your Options',
              description:
                'Browse our curated collection of premium vehicles. Use our intelligent search and filters to narrow down by make, model, price range, body style, fuel type, and more. Every vehicle in our inventory has been carefully vetted for quality and value.',
              details: [
                'Smart search with real-time filtering',
                'Detailed vehicle information and specifications',
                'High-quality photography for every vehicle',
                'Compare vehicles side by side',
              ],
            },
            {
              step: '02',
              title: 'Get Expert Guidance',
              description:
                'Our automotive specialists are here to help. Get transparent information about every vehicle, including history, condition reports, and honest assessments. We provide the details you need to make a confident decision.',
              details: [
                'Transparent pricing with no hidden fees',
                'Detailed condition reports',
                'Vehicle history information',
                'Expert recommendations based on your needs',
              ],
            },
            {
              step: '03',
              title: 'Experience the Vehicle',
              description:
                'Schedule a test drive at your convenience. See the vehicle in person, experience how it drives, and get a feel for whether it\'s the right fit. We make scheduling simple and flexible.',
              details: [
                'Easy online test drive scheduling',
                'Flexible appointment times',
                'No-pressure experience',
                'Knowledgeable staff available to answer questions',
              ],
            },
            {
              step: '04',
              title: 'Move Forward with Confidence',
              description:
                'When you\'re ready, our team guides you through the next steps. Whether you\'re ready to purchase or need more time, we\'re here to support your decision with transparent processes and clear communication.',
              details: [
                'Clear purchase process',
                'Flexible next steps',
                'Ongoing support and communication',
                'Post-purchase assistance',
              ],
            },
          ].map((item) => (
            <div
              key={item.step}
              className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-8"
            >
              <div className="flex md:justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-accent/10 flex items-center justify-center">
                  <span className="text-heading-md font-bold text-primary-accent">
                    {item.step}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-heading-lg font-bold text-primary-text mb-4">
                  {item.title}
                </h2>
                <p className="text-body-lg text-primary-muted mb-6 leading-relaxed">
                  {item.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-center gap-3 text-body-sm text-primary-text"
                    >
                      <svg
                        className="w-4 h-4 text-primary-accent shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
