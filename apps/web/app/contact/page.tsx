import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the CarPal team. We\'re here to help with any questions about our vehicles or services.',
};

export default function ContactPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container-main">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-caption text-primary-accent mb-2">Get in Touch</p>
            <h1 className="text-display-lg font-bold text-primary-text tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-body-lg text-primary-muted max-w-lg mx-auto">
              Have a question about a vehicle or our services? We&apos;re here
              to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-12">
            {/* Contact Form */}
            <form className="bg-white rounded-2xl border border-primary-border p-8">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent resize-none"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3.5">
                  Send Message
                </button>
              </div>
            </form>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="p-6 bg-primary-surface rounded-2xl">
                <h3 className="text-heading-sm font-semibold text-primary-text mb-3">
                  Email Us
                </h3>
                <p className="text-body-sm text-primary-muted mb-2">
                  For general enquiries
                </p>
                <a
                  href="mailto:hello@trycarpal.com"
                  className="text-body-md font-medium text-primary-accent hover:underline"
                >
                  hello@trycarpal.com
                </a>
              </div>

              <div className="p-6 bg-primary-surface rounded-2xl">
                <h3 className="text-heading-sm font-semibold text-primary-text mb-3">
                  Call Us
                </h3>
                <p className="text-body-sm text-primary-muted mb-2">
                  Mon-Fri, 9am-6pm EST
                </p>
                <a
                  href="tel:+1234567890"
                  className="text-body-md font-medium text-primary-accent hover:underline"
                >
                  (123) 456-7890
                </a>
              </div>

              <div className="p-6 bg-primary-surface rounded-2xl">
                <h3 className="text-heading-sm font-semibold text-primary-text mb-3">
                  Visit Us
                </h3>
                <p className="text-body-sm text-primary-muted">
                  123 Automotive Drive
                  <br />
                  Suite 100
                  <br />
                  New York, NY 10001
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
