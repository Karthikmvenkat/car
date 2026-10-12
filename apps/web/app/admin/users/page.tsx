'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const demoUsers = [
  { id: '1', name: 'Admin User', email: 'admin@car.com', role: 'Super Admin', status: 'Active', lastLogin: '2 hours ago' },
  { id: '2', name: 'Alex Thompson', email: 'alex@car.com', role: 'Sales Manager', status: 'Active', lastLogin: '1 day ago' },
  { id: '3', name: 'Maria Garcia', email: 'maria@car.com', role: 'Lead Manager', status: 'Active', lastLogin: '3 days ago' },
  { id: '4', name: 'John Editor', email: 'john@car.com', role: 'Content Editor', status: 'Active', lastLogin: '1 week ago' },
  { id: '5', name: 'Sarah Analyst', email: 'sarah@car.com', role: 'Read-only Analyst', status: 'Inactive', lastLogin: '1 month ago' },
];

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-red-50 text-red-700',
  'Sales Manager': 'bg-blue-50 text-blue-700',
  'Lead Manager': 'bg-purple-50 text-purple-700',
  'Content Editor': 'bg-yellow-50 text-yellow-700',
  'Read-only Analyst': 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Users & Roles
          </h1>
          <p className="text-body-sm text-primary-muted">
            Manage admin users and their permissions
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add User
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-heading-sm font-semibold text-primary-text">
            New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="john@car.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-primary-text mb-2">
              Role
            </label>
            <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
              <option>Super Admin</option>
              <option>Sales Manager</option>
              <option>Lead Manager</option>
              <option>Content Editor</option>
              <option>Read-only Analyst</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button className="btn-primary">Create User</button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-right px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {demoUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-sm font-medium text-primary-text">
                        {user.name}
                      </p>
                      <p className="text-caption text-primary-muted">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-caption font-medium',
                        roleColors[user.role] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-caption font-medium',
                        user.status === 'Active'
                          ? 'text-green-700'
                          : 'text-gray-500'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                        )}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-caption text-primary-muted">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-primary-muted transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-heading-sm font-semibold text-primary-text mb-4">
          Role Permissions
        </h2>
        <div className="space-y-3">
          {[
            { role: 'Super Admin', desc: 'Full access to all features and settings' },
            { role: 'Sales Manager', desc: 'Manage vehicles, enquiries, bookings, and customers' },
            { role: 'Lead Manager', desc: 'Manage enquiries and bookings only' },
            { role: 'Content Editor', desc: 'Manage homepage content, testimonials, and FAQs' },
            { role: 'Read-only Analyst', desc: 'View dashboard and reports without editing' },
          ].map((r) => (
            <div key={r.role} className="flex items-start gap-3">
              <span
                className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-caption font-medium mt-0.5',
                  roleColors[r.role]
                )}
              >
                {r.role}
              </span>
              <p className="text-body-sm text-primary-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
