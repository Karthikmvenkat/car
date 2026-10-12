'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const demoBookings = [
  {
    id: '1',
    customer: 'David Kim',
    email: 'david.k@email.com',
    phone: '+1 (555) 111-2222',
    vehicle: '2024 BMW M4 Competition',
    date: '2026-10-12',
    time: '10:00 AM',
    status: 'Confirmed',
    notes: 'First-time buyer, very interested in M Performance package',
  },
  {
    id: '2',
    customer: 'Anna Thompson',
    email: 'anna.t@email.com',
    phone: '+1 (555) 222-3333',
    vehicle: '2024 Tesla Model S Plaid',
    date: '2026-10-12',
    time: '2:00 PM',
    status: 'Pending',
    notes: 'Comparing with Porsche Taycan, needs convincing on range',
  },
  {
    id: '3',
    customer: 'Robert Garcia',
    email: 'r.garcia@email.com',
    phone: '+1 (555) 333-4444',
    vehicle: '2024 Mercedes EQE 350+',
    date: '2026-10-14',
    time: '11:00 AM',
    status: 'Confirmed',
    notes: 'Coming from S-Class, wants to experience EV transition',
  },
  {
    id: '4',
    customer: 'Lisa Park',
    email: 'lisa.park@email.com',
    phone: '+1 (555) 678-9012',
    vehicle: '2024 Range Rover Sport',
    date: '2026-10-15',
    time: '3:00 PM',
    status: 'Pending',
    notes: 'Has a family, interested in third row option',
  },
  {
    id: '5',
    customer: 'Mark Johnson',
    email: 'mark.j@email.com',
    phone: '+1 (555) 444-5555',
    vehicle: '2023 Porsche 911 Carrera S',
    date: '2026-10-09',
    time: '1:00 PM',
    status: 'Completed',
    notes: 'Loved the drive, requesting a follow-up call next week',
  },
];

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-50 text-yellow-700',
  Confirmed: 'bg-green-50 text-green-700',
  Completed: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-red-50 text-red-600',
  'No Show': 'bg-gray-100 text-gray-600',
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = demoBookings.filter(
    (b) => statusFilter === 'all' || b.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Test Drive Bookings
          </h1>
          <p className="text-body-sm text-primary-muted">
            {demoBookings.length} total bookings
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 rounded-lg text-body-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === status
                ? 'bg-primary-accent text-white'
                : 'bg-white border border-gray-200 text-primary-muted hover:text-primary-text hover:border-gray-300'
            )}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-body-sm font-medium text-primary-text">
                  {booking.customer}
                </p>
                <p className="text-caption text-primary-muted">{booking.email}</p>
              </div>
              <span
                className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-caption font-medium',
                  statusColors[booking.status]
                )}
              >
                {booking.status}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-body-sm text-primary-accent font-medium mb-1">
                {booking.vehicle}
              </p>
              <div className="flex items-center gap-2 text-caption text-primary-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {booking.date} at {booking.time}
              </div>
            </div>

            {booking.notes && (
              <p className="text-caption text-primary-muted mb-4 line-clamp-2">
                {booking.notes}
              </p>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {booking.status === 'Pending' && (
                <button className="flex-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-caption font-medium hover:bg-green-100 transition-colors">
                  Confirm
                </button>
              )}
              {booking.status === 'Confirmed' && (
                <button className="flex-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-caption font-medium hover:bg-blue-100 transition-colors">
                  Mark Complete
                </button>
              )}
              <button className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 text-primary-muted text-caption font-medium hover:bg-gray-100 transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-body-sm text-primary-muted">No bookings found</p>
        </div>
      )}
    </div>
  );
}
