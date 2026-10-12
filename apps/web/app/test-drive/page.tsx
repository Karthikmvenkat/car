'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function TestDrivePage() {
  return (
    <Suspense>
      <TestDriveForm />
    </Suspense>
  );
}

function TestDriveForm() {
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h1 className="text-heading-lg font-bold text-primary-text mb-3">
              Test Drive Requested!
            </h1>
            <p className="text-body-md text-primary-muted mb-8">
              We&apos;ve received your test drive request. Our team will confirm
              your appointment within 24 hours.
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
              Schedule a Test Drive
            </h1>
            <p className="text-body-lg text-primary-muted">
              Experience the vehicle firsthand. Choose your preferred date and
              time, and we&apos;ll confirm your appointment.
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
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                    Preferred Time *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent"
                  >
                    <option value="">Select a time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any specific questions or requests?"
                  className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent resize-none"
                />
              </div>

              <div className="p-4 bg-primary-surface rounded-xl">
                <p className="text-caption text-primary-muted leading-relaxed">
                  Your appointment is subject to availability. We&apos;ll
                  confirm your booking via email within 24 hours.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5">
                Request Test Drive
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
