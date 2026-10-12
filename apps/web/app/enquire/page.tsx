'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function EnquirePage() {
  return (
    <Suspense>
      <EnquireForm />
    </Suspense>
  );
}

function EnquireForm() {
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get('vehicle');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center">
        <div className="container-main w-full">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary-accent/10 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-primary-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-heading-lg font-bold text-primary-text mb-3">
              Enquiry Sent!
            </h1>
            <p className="text-body-md text-primary-muted mb-8">
              Thank you for your interest. Our team will review your enquiry and
              get back to you within 24 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {vehicleSlug && (
                <Link
                  href={`/vehicles/${vehicleSlug}`}
                  className="btn-secondary px-6 py-3"
                >
                  Back to Vehicle
                </Link>
              )}
              <Link href="/vehicles" className="btn-primary px-6 py-3">
                Browse More Vehicles
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-main">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-display-md font-bold text-primary-text tracking-tight mb-2">
              Send an Enquiry
            </h1>
            <p className="text-body-lg text-primary-muted">
              Interested in this vehicle? Fill out the form below and our team
              will get back to you shortly.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="bg-white rounded-2xl border border-primary-border p-8"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Last Name *
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
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                  Preferred Contact Method
                </label>
                <select className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent">
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="either">Either</option>
                </select>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what you'd like to know..."
                  className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent resize-none"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  className="mt-1 rounded border-primary-border"
                />
                <label
                  htmlFor="consent"
                  className="text-caption text-primary-muted leading-relaxed"
                >
                  I consent to CarPal collecting my information to respond to
                  this enquiry. See our{' '}
                  <Link href="/privacy" className="text-primary-accent hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5">
                Submit Enquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
