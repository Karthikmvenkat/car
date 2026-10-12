'use client';

import { useState } from 'react';

const demoTestimonials = [
  {
    id: '1',
    name: 'Alexandra M.',
    location: 'San Francisco, CA',
    quote: 'CarPal made the entire car-buying experience effortless. The team was knowledgeable and never pushy. I found my dream BMW M4 in just two weeks.',
    rating: 5,
    featured: true,
  },
  {
    id: '2',
    name: 'David & Sarah K.',
    location: 'Austin, TX',
    quote: 'We were dreading the car search process, but CarPal turned it into something enjoyable. Transparent pricing and genuine care for finding the right fit.',
    rating: 5,
    featured: true,
  },
  {
    id: '3',
    name: 'Marcus T.',
    location: 'New York, NY',
    quote: 'As a first-time EV buyer, I had a lot of questions. The CarPal team guided me through every step and helped me find the perfect Mercedes EQE.',
    rating: 5,
    featured: false,
  },
];

export default function AdminTestimonialsPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Testimonials
          </h1>
          <p className="text-body-sm text-primary-muted">
            Manage customer testimonials displayed on the site
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Testimonial
        </button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-heading-sm font-semibold text-primary-text">
            New Testimonial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Customer Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. John D."
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Location
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. Los Angeles, CA"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Quote
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
              placeholder="What did the customer say?"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Rating
              </label>
              <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
                <option>5</option>
                <option>4</option>
                <option>3</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent" />
              <span className="text-body-sm text-primary-text">Featured</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button className="btn-primary">Save</button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {demoTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-body-sm font-medium text-primary-text">
                    {testimonial.name}
                  </p>
                  <span className="text-caption text-primary-muted">
                    {testimonial.location}
                  </span>
                  {testimonial.featured && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-caption font-medium bg-primary-surface text-primary-accent">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-primary-muted leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-primary-muted transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-primary-muted hover:text-red-600 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex gap-0.5 mt-3">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <svg
                  key={i}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-yellow-400"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
