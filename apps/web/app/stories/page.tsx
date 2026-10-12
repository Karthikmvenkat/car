import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Stories',
  description: 'Read real experiences from customers who found their perfect vehicle through CAR.',
};

const stories = [
  {
    name: 'Sarah Mitchell',
    vehicle: '2024 BMW M4 Competition',
    quote:
      'CAR made the entire experience effortless. The transparent pricing and expert guidance helped me find exactly what I was looking for. I never felt pressured, and the team was always available to answer my questions.',
    avatar: 'SM',
    location: 'New York, NY',
  },
  {
    name: 'James Chen',
    vehicle: '2024 Mercedes-Benz EQE SUV',
    quote:
      'I was skeptical about buying a car online, but CAR\'s process was seamless. The test drive scheduling was a game-changer — I could try multiple vehicles on my own schedule before making a decision.',
    avatar: 'JC',
    location: 'San Francisco, CA',
  },
  {
    name: 'Emily Rodriguez',
    vehicle: '2023 Porsche 911 Carrera S',
    quote:
      'From discovery to delivery, every step was handled with care. The team genuinely cares about matching you with the right vehicle. They even helped me understand the differences between trim levels I hadn\'t considered.',
    avatar: 'ER',
    location: 'Austin, TX',
  },
  {
    name: 'Michael Thompson',
    vehicle: '2024 Audi RS e-tron GT',
    quote:
      'As an EV enthusiast, I appreciated how knowledgeable the CAR team was about electric vehicles. They helped me understand charging infrastructure, range expectations, and found me the perfect car.',
    avatar: 'MT',
    location: 'Seattle, WA',
  },
  {
    name: 'Lisa Park',
    vehicle: '2023 Range Rover Sport',
    quote:
      'The curated inventory saved me so much time. Instead of sifting through hundreds of listings, I could focus on quality vehicles that had already been vetted. The whole experience felt premium.',
    avatar: 'LP',
    location: 'Chicago, IL',
  },
  {
    name: 'David Kumar',
    vehicle: '2024 Tesla Model S Plaid',
    quote:
      'CAR\'s comparison tools and detailed specifications helped me make an informed decision. The team was responsive, professional, and genuinely helpful throughout the entire process.',
    avatar: 'DK',
    location: 'Boston, MA',
  },
];

export default function StoriesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-caption text-primary-accent mb-2">
            Customer Stories
          </p>
          <h1 className="text-display-lg font-bold text-primary-text tracking-tight mb-6">
            Real Experiences, Real Satisfaction
          </h1>
          <p className="text-body-lg text-primary-muted">
            Hear from customers who found their perfect vehicle through CAR.
            Their stories speak to our commitment to transparency, expertise,
            and exceptional service.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {stories.map((story) => (
            <div
              key={story.name}
              className="bg-white rounded-2xl border border-primary-border p-8 hover:shadow-lg hover:border-primary-accent/30 transition-all duration-300"
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
                &ldquo;{story.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-primary-border">
                <div className="w-12 h-12 rounded-full bg-primary-accent flex items-center justify-center text-white font-semibold">
                  {story.avatar}
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-primary-text">
                    {story.name}
                  </p>
                  <p className="text-caption text-primary-muted">
                    {story.vehicle}
                  </p>
                  <p className="text-caption text-primary-muted">
                    {story.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 pt-12 border-t border-primary-border">
          <h2 className="text-heading-lg font-bold text-primary-text mb-4">
            Ready to Write Your Own Story?
          </h2>
          <p className="text-body-lg text-primary-muted mb-8 max-w-lg mx-auto">
            Join hundreds of satisfied customers who found their perfect vehicle
            through CAR.
          </p>
          <Link href="/vehicles" className="btn-primary px-8 py-3.5">
            Browse Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
}
