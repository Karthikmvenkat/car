'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      setError('Password reset email is not connected yet. Contact hello@trycar.com for account assistance. No reset email has been sent.');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-primary-bg px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-display-sm font-semibold text-primary-text mb-2">
            {isSubmitted ? 'Check your email' : 'Forgot your password?'}
          </h1>
          {!isSubmitted && (
            <p className="text-body-sm text-primary-muted">
              Enter your email and we'll send you a link to reset your password
            </p>
          )}
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-2xl shadow-lg border border-primary-border p-8 text-center">
            <div className="w-16 h-16 bg-primary-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-body-sm text-primary-muted mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Check
              your inbox and follow the instructions.
            </p>
            <p className="text-body-sm text-primary-muted mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full btn-secondary"
              >
                Try a different email
              </button>
              <Link href="/signin" className="block w-full btn-primary text-center">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-primary-border p-8"
          >
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-3 rounded-lg border border-primary-border focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition"
                placeholder="john@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>

            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="text-body-sm text-primary-accent font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
