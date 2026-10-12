'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleAuth } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await register(name, formData.email, formData.password, formData.phone || undefined);
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      await googleAuth(credentialResponse.credential);
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Google sign-up failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: 'Google sign-up failed. Please try again.' });
  };

  return (
    <div className="min-h-screen bg-primary-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-display-sm font-semibold text-primary-text mb-2">
            Create your account
          </h1>
          <p className="text-body-sm text-primary-muted">
            Join CarPal to save vehicles, track enquiries, and more
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-primary-border p-8"
        >
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-800">
              {errors.submit}
            </div>
          )}

          {/* Google Sign Up */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary-border"></div>
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="px-3 bg-white text-primary-muted">
                or register with email
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="firstName"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.firstName
                    ? 'border-red-500'
                    : 'border-primary-border'
                } focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-caption text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.lastName ? 'border-red-500' : 'border-primary-border'
                } focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-caption text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
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
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-primary-border'
                } focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-caption text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                Phone number (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-primary-border focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-primary-border'
                } focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition`}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-caption text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-body-sm font-medium text-primary-text mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-primary-border'
                } focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition`}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-caption text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-primary-border text-primary-accent focus:ring-2 focus:ring-primary-accent"
                />
                <span className="text-body-sm text-primary-text">
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-primary-accent hover:underline"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-primary-accent hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-caption text-red-600">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-body-sm text-primary-muted">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-primary-accent font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
