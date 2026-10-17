'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setRole(user.role || '');
      if (user.createdAt) {
        setMemberSince(
          new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await api.put('/auth/profile', { name, phone: phone || undefined }, token || undefined);
      // Update local storage
      localStorage.setItem('auth_user', JSON.stringify(updated));
      setIsEditing(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="page-shell min-h-screen flex items-center">
        <div className="container-main w-full text-center">
          <p className="text-body-md text-primary-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <div className="container-main w-full">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-display-md font-bold text-primary-text tracking-tight mb-2">
              My Profile
            </h1>
            <p className="text-body-md text-primary-muted">
              Manage your account information
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-body-sm text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-body-sm text-red-800">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-primary-border overflow-hidden">
            {/* Header */}
            <div className="bg-primary-accent/5 px-8 py-6 border-b border-primary-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-accent flex items-center justify-center text-white text-display-sm font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-body-lg font-semibold text-primary-text">
                    {name}
                  </h2>
                  <p className="text-body-sm text-primary-muted">{email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-caption font-medium bg-primary-accent/10 text-primary-accent rounded-full">
                    {role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-body-md font-semibold text-primary-text">
                  Personal Information
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-caption font-medium text-primary-accent hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSave}>
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-body-sm font-medium text-primary-text mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

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
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md opacity-60 cursor-not-allowed"
                    />
                    <p className="mt-1 text-caption text-primary-muted">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-body-sm font-medium text-primary-text mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-primary-bg border border-primary-border rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary-accent/30 focus:border-primary-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-primary-text mb-1.5">
                      Member Since
                    </label>
                    <p className="text-body-md text-primary-muted">{memberSince}</p>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name || '');
                        setPhone(user.phone || '');
                        setError('');
                      }}
                      className="px-6 py-2.5 text-body-sm font-medium text-primary-text border border-primary-border rounded-xl hover:bg-primary-bg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/favorites"
              className="bg-white rounded-xl border border-primary-border p-6 hover:border-primary-accent/30 hover:shadow-sm transition-all"
            >
              <h4 className="text-body-md font-semibold text-primary-text mb-1">
                Saved Vehicles
              </h4>
              <p className="text-caption text-primary-muted">
                View your favorite cars
              </p>
            </a>
            <a
              href="/enquire"
              className="bg-white rounded-xl border border-primary-border p-6 hover:border-primary-accent/30 hover:shadow-sm transition-all"
            >
              <h4 className="text-body-md font-semibold text-primary-text mb-1">
                Make an Enquiry
              </h4>
              <p className="text-caption text-primary-muted">
                Ask about a vehicle
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
