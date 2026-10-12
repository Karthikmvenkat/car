'use client';

import { useState } from 'react';

const demoCustomers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 234-5678', enquiries: 3, testDrives: 1, joined: '2026-08-15', lastActive: '2 hours ago' },
  { id: '2', name: 'Michael Chen', email: 'm.chen@email.com', phone: '+1 (555) 345-6789', enquiries: 5, testDrives: 2, joined: '2026-07-22', lastActive: '5 hours ago' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@email.com', phone: '+1 (555) 456-7890', enquiries: 2, testDrives: 1, joined: '2026-09-01', lastActive: '1 day ago' },
  { id: '4', name: 'James Wilson', email: 'j.wilson@email.com', phone: '+1 (555) 567-8901', enquiries: 1, testDrives: 0, joined: '2026-09-18', lastActive: '1 day ago' },
  { id: '5', name: 'Lisa Park', email: 'lisa.park@email.com', phone: '+1 (555) 678-9012', enquiries: 4, testDrives: 2, joined: '2026-06-10', lastActive: '2 days ago' },
  { id: '6', name: 'David Kim', email: 'david.k@email.com', phone: '+1 (555) 111-2222', enquiries: 2, testDrives: 1, joined: '2026-08-28', lastActive: '3 days ago' },
];

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = demoCustomers.filter(
    (c) =>
      `${c.name} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Customers
          </h1>
          <p className="text-body-sm text-primary-muted">
            {demoCustomers.length} registered customers
          </p>
        </div>
        <button className="btn-secondary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
      </div>

      <input
        type="text"
        placeholder="Search customers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Enquiries
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Test Drives
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-sm font-medium text-primary-text">
                        {customer.name}
                      </p>
                      <p className="text-caption text-primary-muted">{customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">
                    {customer.enquiries}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">
                    {customer.testDrives}
                  </td>
                  <td className="px-6 py-4 text-caption text-primary-muted">
                    {customer.joined}
                  </td>
                  <td className="px-6 py-4 text-caption text-primary-muted">
                    {customer.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
