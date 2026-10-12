'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Demo data — in production this comes from the API
const demoVehicles = [
  { id: '1', make: 'BMW', model: 'M4 Competition', year: 2024, price: 82900, mileage: 1200, status: 'published', featured: true, image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=400' },
  { id: '2', make: 'Mercedes', model: 'EQE 350+', year: 2024, price: 74900, mileage: 800, status: 'published', featured: true, image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400' },
  { id: '3', make: 'Porsche', model: '911 Carrera S', year: 2023, price: 129500, mileage: 3400, status: 'published', featured: false, image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400' },
  { id: '4', make: 'Audi', model: 'RS e-tron GT', year: 2024, price: 147500, mileage: 500, status: 'published', featured: true, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400' },
  { id: '5', make: 'Range Rover', model: 'Sport P530', year: 2024, price: 98700, mileage: 2100, status: 'draft', featured: false, image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400' },
  { id: '6', make: 'Tesla', model: 'Model S Plaid', year: 2024, price: 108900, mileage: 1500, status: 'published', featured: false, image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400' },
];

const statusColors: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-50 text-red-600',
};

export default function AdminVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVehicles = demoVehicles.filter((v) => {
    const matchesSearch =
      `${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Vehicle Inventory
          </h1>
          <p className="text-body-sm text-primary-muted">
            {demoVehicles.length} vehicles total
          </p>
        </div>
        <Link href="/admin/vehicles/new" className="btn-primary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Vehicle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Year
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Mileage
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Featured
                </th>
                <th className="text-right px-6 py-3 text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        <img
                          src={vehicle.image}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-primary-text">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">{vehicle.year}</td>
                  <td className="px-6 py-4 text-body-sm font-medium text-primary-text">
                    ${vehicle.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-primary-muted">
                    {vehicle.mileage.toLocaleString()} mi
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-caption font-medium capitalize',
                        statusColors[vehicle.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.featured ? (
                      <span className="text-caption font-medium text-primary-accent">Featured</span>
                    ) : (
                      <span className="text-caption text-primary-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-primary-muted hover:text-primary-text transition-colors">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body-sm text-primary-muted">No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
