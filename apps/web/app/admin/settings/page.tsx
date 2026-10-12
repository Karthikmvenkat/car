'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-md font-semibold text-primary-text mb-1">
          Settings
        </h1>
        <p className="text-body-sm text-primary-muted">
          Configure system-wide settings
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: 'general', label: 'General' },
          { id: 'contact', label: 'Contact Info' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'integrations', label: 'Integrations' },
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

      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Site Name
              </label>
              <input
                type="text"
                defaultValue="CAR"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Site URL
              </label>
              <input
                type="text"
                defaultValue="https://trycar.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Default Currency
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Timezone
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
                <option>America/New_York (EST)</option>
                <option>America/Chicago (CST)</option>
                <option>America/Los_Angeles (PST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button className="btn-primary">Save Settings</button>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@trycar.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue="+1 (555) 123-4567"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Address
            </label>
            <textarea
              rows={3}
              defaultValue="123 Automotive Drive, Suite 100, San Francisco, CA 94105"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button className="btn-primary">Save Contact Info</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <p className="text-body-sm text-primary-muted">
            Configure which notifications are sent and to whom.
          </p>
          <div className="space-y-4">
            {[
              { label: 'New enquiry received', desc: 'Notify sales team when a new enquiry is submitted', enabled: true },
              { label: 'Test drive booking', desc: 'Notify when a test drive is booked or cancelled', enabled: true },
              { label: 'Customer registration', desc: 'Notify when a new customer account is created', enabled: false },
              { label: 'Weekly summary', desc: 'Send a weekly summary of activity to admin', enabled: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-body-sm font-medium text-primary-text">{item.label}</p>
                  <p className="text-caption text-primary-muted">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-accent rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-accent"></div>
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button className="btn-primary">Save Preferences</button>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <p className="text-body-sm text-primary-muted">
            Connect external services and APIs.
          </p>
          <div className="space-y-4">
            {[
              { name: 'Email Service (SMTP)', status: 'Connected', configured: true },
              { name: 'Google Analytics', status: 'Connected', configured: true },
              { name: 'Stripe Payments', status: 'Not configured', configured: false },
              { name: 'Cloudinary (Image Storage)', status: 'Not configured', configured: false },
            ].map((integration, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-body-sm font-medium text-primary-text">{integration.name}</p>
                  <p className={`text-caption ${integration.configured ? 'text-green-600' : 'text-primary-muted'}`}>
                    {integration.status}
                  </p>
                </div>
                <button className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-colors ${
                  integration.configured
                    ? 'bg-gray-50 text-primary-muted hover:bg-gray-100'
                    : 'bg-primary-surface text-primary-accent hover:bg-primary-surface/80'
                }`}>
                  {integration.configured ? 'Configure' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
