'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    setError('');
    setIsLoading(true);

    try {
      await googleAuth(credentialResponse.credential);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  return (
    <>
      {registered && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-body-sm text-green-800">
          Account created successfully! Please sign in.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-body-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-primary-border p-8">
        {/* Google Sign In */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-border"></div>
          </div>
          <div className="relative flex justify-center text-caption">
            <span className="px-3 bg-white text-primary-muted">
              or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-body-sm font-medium text-primary-text mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-body-sm font-medium text-primary-text"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-caption text-primary-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body-sm text-primary-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary-accent font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen flex items-center">
      <div className="container-main w-full">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-display-md font-bold text-primary-text tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-body-md text-primary-muted">
              Sign in to your CAR account
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-primary-muted">Loading...</div>}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
