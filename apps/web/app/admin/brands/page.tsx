'use client';

import { useState } from 'react';

const demoBrands = [
  { id: '1', name: 'BMW', models: 12, vehicles: 34, active: true },
  { id: '2', name: 'Mercedes-Benz', models: 15, vehicles: 28, active: true },
  { id: '3', name: 'Porsche', models: 8, vehicles: 16, active: true },
  { id: '4', name: 'Audi', models: 10, vehicles: 22, active: true },
  { id: '5', name: 'Range Rover', models: 5, vehicles: 12, active: true },
  { id: '6', name: 'Tesla', models: 4, vehicles: 18, active: true },
  { id: '7', name: 'Lexus', models: 9, vehicles: 0, active: false },
];

export default function AdminBrandsPage() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Brands & Models
          </h1>
          <p className="text-body-sm text-primary-muted">
            Manage vehicle brands and their models
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Brand
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-heading-sm font-semibold text-primary-text">
            New Brand
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Brand Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="e.g. Toyota"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-primary-text mb-2">
                Logo URL (optional)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button className="btn-primary">Save Brand</button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Brand
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Models
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {demoBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-medium text-primary-text">
                      {brand.name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">
                    {brand.models}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">
                    {brand.vehicles}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-caption font-medium ${
                        brand.active ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          brand.active ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {brand.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-caption text-primary-accent hover:underline font-medium">
                        Models
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-primary-muted transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
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
