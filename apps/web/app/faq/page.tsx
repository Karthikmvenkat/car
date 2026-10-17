import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about CarPal, our vehicles, and the buying process.',
};

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is CarPal?',
        a: 'CarPal is a premium automotive platform that helps you discover, explore, and acquire your next vehicle. We curate a selection of quality vehicles and provide transparent information, expert guidance, and a streamlined buying experience.',
      },
      {
        q: 'How does CarPal make money?',
        a: 'We work with verified sellers and dealerships to list quality vehicles on our platform. When a vehicle is sold through CarPal, we receive a referral fee. This allows us to provide our discovery and guidance services to buyers at no cost.',
      },
      {
        q: 'Is CarPal available in my area?',
        a: 'CarPal currently serves customers across the United States. Our inventory spans multiple locations, and we can help you find vehicles both locally and through our network of trusted partners.',
      },
    ],
  },
  {
    category: 'Vehicles',
    questions: [
      {
        q: 'How are vehicles vetted?',
        a: 'Every vehicle in our collection goes through a verification process. We check vehicle history, condition reports, and work with sellers to ensure accurate representation. While we don\'t physically inspect every vehicle, we require detailed documentation and transparency from our partners.',
      },
      {
        q: 'Can I test drive a vehicle before buying?',
        a: 'Absolutely! We encourage test drives. You can schedule a test drive directly from any vehicle details page. Our team will coordinate with the seller to arrange a convenient time for you to experience the vehicle.',
      },
      {
        q: 'Do you offer financing?',
        a: 'We\'re working on integrating financing options. For now, we can connect you with trusted financing partners who specialize in automotive loans. Contact our team for more information.',
      },
      {
        q: 'What if I want to trade in my current vehicle?',
        a: 'Trade-in options are coming soon. In the meantime, you can sell your current vehicle independently and use the proceeds toward your CarPal purchase. Our team can provide guidance on valuation if needed.',
      },
    ],
  },
  {
    category: 'Buying Process',
    questions: [
      {
        q: 'How do I purchase a vehicle through CarPal?',
        a: 'Once you\'ve found a vehicle you love, you can send an enquiry or schedule a test drive. Our team will connect you with the seller, and you\'ll work directly with them to complete the purchase. We guide you through every step.',
      },
      {
        q: 'Is the price negotiable?',
        a: 'Pricing is set by the seller, and some may be open to negotiation. We encourage transparent pricing and will help facilitate discussions between buyers and sellers when appropriate.',
      },
      {
        q: 'What happens after I submit an enquiry?',
        a: 'Our team reviews your enquiry and typically responds within 24 hours. We\'ll answer your questions, provide additional information if needed, and connect you with the seller when you\'re ready to move forward.',
      },
    ],
  },
  {
    category: 'Account & Privacy',
    questions: [
      {
        q: 'Do I need an account to browse vehicles?',
        a: 'No, you can browse all vehicles without an account. However, creating an account allows you to save favorites, track your enquiries, and manage test drive appointments.',
      },
      {
        q: 'How do you protect my information?',
        a: 'We take privacy seriously. Your personal information is encrypted and stored securely. We never sell your data to third parties. See our Privacy Policy for detailed information about how we handle your data.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="page-shell">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-caption text-primary-accent mb-2">FAQ</p>
          <h1 className="text-display-lg font-bold text-primary-text tracking-tight mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-body-lg text-primary-muted">
            Find answers to common questions about CarPal, our vehicles, and the
            buying process. Can&apos;t find what you&apos;re looking for?{' '}
            <Link
              href="/contact"
              className="text-primary-accent font-medium hover:underline"
            >
              Contact us
            </Link>
            .
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-heading-md font-semibold text-primary-text mb-6 pb-3 border-b border-primary-border">
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((faq) => (
                  <div key={faq.q}>
                    <h3 className="text-body-lg font-semibold text-primary-text mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-body-md text-primary-muted leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 pt-12 border-t border-primary-border">
          <h2 className="text-heading-md font-bold text-primary-text mb-4">
            Still have questions?
          </h2>
          <p className="text-body-md text-primary-muted mb-6">
            Our team is here to help.
          </p>
          <Link href="/contact" className="btn-primary px-8 py-3.5">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
