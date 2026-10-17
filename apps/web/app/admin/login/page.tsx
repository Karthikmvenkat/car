'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isStaffRole } from '@/lib/admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nextPath = () => {
    if (typeof window === 'undefined') return '/admin';
    const next = new URLSearchParams(window.location.search).get('next');
    // Only allow internal admin paths.
    return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
  };

  useEffect(() => {
    if (!isLoading && user && isStaffRole(user.role)) router.replace(nextPath());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const signedIn = await login(email, password);
      if (!isStaffRole(signedIn.role)) {
        logout();
        setError('This account does not have admin access.');
        return;
      }
      router.replace(nextPath());
    } catch (err: any) {
      setError(err?.status === 401 ? 'Invalid credentials. Please try again.' : err?.message || 'Could not reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-heading-md font-semibold text-primary-text mb-1">
            Admin Login
          </h1>
          <p className="text-body-sm text-primary-muted">
            Sign in to manage your CarPal dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="admin@car.com"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="mt-4 text-center">
            <a href="/" className="text-caption text-primary-muted hover:text-primary-text transition-colors">
              ← Back to website
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
