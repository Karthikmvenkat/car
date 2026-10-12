'use client';

import { useState } from 'react';

const demoFaqs = [
  { id: '1', question: 'How does CarPal work?', category: 'General', answer: 'CarPal connects you with a curated selection of premium vehicles. Browse our inventory, enquire about vehicles you like, and schedule test drives. Our team provides transparent guidance throughout the process.' },
  { id: '2', question: 'Is there a fee to use CarPal?', category: 'General', answer: 'No, browsing and enquiring about vehicles on CarPal is completely free. We are compensated by our dealer partners when a sale is completed.' },
  { id: '3', question: 'Can I schedule a test drive online?', category: 'Vehicles', answer: 'Yes! Each vehicle page has a "Book a Test Drive" option. Select your preferred date and time, and our team will confirm your appointment.' },
  { id: '4', question: 'Do you offer financing?', category: 'Buying Process', answer: 'We work with several lending partners and can help connect you with financing options. Submit an enquiry on any vehicle and mention your interest in financing.' },
  { id: '5', question: 'How do I create an account?', category: 'Account & Privacy', answer: 'Click "Get Started" in the navigation and fill out the registration form. You can also browse without an account, but having one lets you save vehicles and track enquiries.' },
  { id: '6', question: 'Are the vehicles inspected?', category: 'Vehicles', answer: 'All vehicles in our network undergo thorough inspection. Certified pre-owned vehicles come with additional warranty coverage and inspection reports.' },
];

export default function AdminFaqsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(demoFaqs.map((f) => f.category))];
  const filtered = demoFaqs.filter(
    (f) => categoryFilter === 'all' || f.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            FAQ Manager
          </h1>
          <p className="text-body-sm text-primary-muted">
            Manage frequently asked questions
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add FAQ
        </button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-heading-sm font-semibold text-primary-text">
            New FAQ
          </h2>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Question
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              placeholder="Enter the question"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Answer
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
              placeholder="Enter the answer"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Category
            </label>
            <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
              <option>General</option>
              <option>Vehicles</option>
              <option>Buying Process</option>
              <option>Account & Privacy</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button className="btn-primary">Save</button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-body-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-primary-accent text-white'
                : 'bg-white border border-gray-200 text-primary-muted hover:text-primary-text'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filtered.map((faq) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-caption font-medium bg-primary-surface text-primary-accent">
                    {faq.category}
                  </span>
                </div>
                <h3 className="text-body-sm font-medium text-primary-text mb-1">
                  {faq.question}
                </h3>
                <p className="text-caption text-primary-muted leading-relaxed">
                  {faq.answer}
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
          </div>
        ))}
      </div>
    </div>
  );
}
