'use client';

import { useState } from 'react';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('hero');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-md font-semibold text-primary-text mb-1">
          Homepage Content
        </h1>
        <p className="text-body-sm text-primary-muted">
          Manage the content displayed on the homepage
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'hero', label: 'Hero' },
          { id: 'featured', label: 'Featured Vehicles' },
          { id: 'collections', label: 'Collections' },
          { id: 'seo', label: 'SEO' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-text shadow-sm'
                : 'text-primary-muted hover:text-primary-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Content Editor */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Eyebrow Label
            </label>
            <input
              type="text"
              defaultValue="Premium Automotive"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Headline Line 1
            </label>
            <input
              type="text"
              defaultValue="Your next car."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Headline Line 2
            </label>
            <input
              type="text"
              defaultValue="A better way."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Supporting Text
            </label>
            <textarea
              defaultValue="Discover the right car with transparent pricing, thoughtful guidance and a better buying experience."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Primary CTA Text
              </label>
              <input
                type="text"
                defaultValue="Explore cars"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Primary CTA Link
              </label>
              <input
                type="text"
                defaultValue="/vehicles"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Hero Background Image URL
            </label>
            <input
              type="text"
              defaultValue="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>
      )}

      {/* Featured Vehicles */}
      {activeTab === 'featured' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-body-sm text-primary-muted mb-6">
            Select which vehicles appear in the "Popular Vehicles" section on the homepage.
          </p>
          <div className="space-y-3">
            {['BMW M4 Competition', 'Mercedes EQE 350+', 'Audi RS e-tron GT'].map(
              (vehicle, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                      <span className="text-caption font-medium text-primary-muted">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-body-sm font-medium text-primary-text">
                      {vehicle}
                    </span>
                  </div>
                  <button className="text-caption text-red-600 hover:underline font-medium">
                    Remove
                  </button>
                </div>
              )
            )}
          </div>
          <button className="mt-4 btn-secondary inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Vehicle
          </button>
        </div>
      )}

      {/* Collections */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-body-sm text-primary-muted mb-6">
            Manage featured collections displayed on the homepage.
          </p>
          <div className="space-y-4">
            {[
              { title: 'Electric Vehicles', count: 24 },
              { title: 'Performance Cars', count: 18 },
              { title: 'Luxury Sedans', count: 32 },
              { title: 'SUVs & Crossovers', count: 41 },
            ].map((collection, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-body-sm font-medium text-primary-text">
                    {collection.title}
                  </p>
                  <p className="text-caption text-primary-muted">
                    {collection.count} vehicles
                  </p>
                </div>
                <button className="text-caption text-primary-accent hover:underline font-medium">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Page Title
            </label>
            <input
              type="text"
              defaultValue="CarPal — Find Your Perfect Car"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Meta Description
            </label>
            <textarea
              defaultValue="Discover premium vehicles with transparent pricing and expert guidance. Browse our curated collection of new and certified pre-owned cars."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              OG Image URL
            </label>
            <input
              type="text"
              defaultValue="https://trycarpal.com/og-image.jpg"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button className="btn-primary">Save SEO Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
