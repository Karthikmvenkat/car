'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// Demo data — in production this comes from the API
const demoEnquiries = [
  {
    id: '1',
    customer: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 234-5678',
    vehicle: '2024 BMW M4 Competition',
    message: 'I am very interested in this vehicle. Could you provide more details about the available packages and financing options?',
    date: '2026-10-11 10:30 AM',
    status: 'New',
    source: 'Website',
    assignedTo: null,
  },
  {
    id: '2',
    customer: 'Michael Chen',
    email: 'm.chen@email.com',
    phone: '+1 (555) 345-6789',
    vehicle: '2024 Mercedes EQE 350+',
    message: 'Is this vehicle available for a test drive this weekend? I am comparing it with the Porsche Taycan.',
    date: '2026-10-11 07:15 AM',
    status: 'Contacted',
    source: 'Website',
    assignedTo: 'Alex Thompson',
  },
  {
    id: '3',
    customer: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '+1 (555) 456-7890',
    vehicle: '2023 Porsche 911 Carrera S',
    message: 'What is the best price you can offer? I am ready to make a decision this week.',
    date: '2026-10-10 03:45 PM',
    status: 'Qualified',
    source: 'Referral',
    assignedTo: 'Maria Garcia',
  },
  {
    id: '4',
    customer: 'James Wilson',
    email: 'j.wilson@email.com',
    phone: '+1 (555) 567-8901',
    vehicle: '2024 Audi RS e-tron GT',
    message: 'Does this come with the full self-driving capability? What warranty is included?',
    date: '2026-10-10 01:20 PM',
    status: 'New',
    source: 'Website',
    assignedTo: null,
  },
  {
    id: '5',
    customer: 'Lisa Park',
    email: 'lisa.park@email.com',
    phone: '+1 (555) 678-9012',
    vehicle: '2024 Range Rover Sport',
    message: 'I would like to schedule a test drive. Are there any available slots next week?',
    date: '2026-10-09 11:00 AM',
    status: 'Test Drive Scheduled',
    source: 'Website',
    assignedTo: 'Alex Thompson',
  },
];

const statusColors: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-yellow-50 text-yellow-700',
  Qualified: 'bg-purple-50 text-purple-700',
  'Test Drive Scheduled': 'bg-green-50 text-green-700',
  Completed: 'bg-gray-100 text-gray-700',
  Won: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-red-50 text-red-600',
};

export default function AdminEnquiriesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<string | null>(null);

  const filtered = demoEnquiries.filter(
    (e) => statusFilter === 'all' || e.status === statusFilter
  );

  const selected = demoEnquiries.find((e) => e.id === selectedEnquiry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">
            Enquiries & Leads
          </h1>
          <p className="text-body-sm text-primary-muted">
            {demoEnquiries.length} total enquiries
          </p>
        </div>
        <button className="btn-secondary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'New', 'Contacted', 'Qualified', 'Test Drive Scheduled', 'Completed', 'Lost'].map(
          (status) => (
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
              {status === 'all' && (
                <span className="ml-1.5 text-caption opacity-70">
                  ({demoEnquiries.length})
                </span>
              )}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Enquiry List */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((enquiry) => (
              <button
                key={enquiry.id}
                onClick={() => setSelectedEnquiry(enquiry.id)}
                className={cn(
                  'w-full text-left p-5 hover:bg-gray-50/50 transition-colors',
                  selectedEnquiry === enquiry.id && 'bg-primary-surface/30'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-body-sm font-medium text-primary-text">
                        {enquiry.customer}
                      </p>
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-caption font-medium',
                          statusColors[enquiry.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {enquiry.status}
                      </span>
                    </div>
                    <p className="text-caption text-primary-accent font-medium mb-1">
                      {enquiry.vehicle}
                    </p>
                    <p className="text-caption text-primary-muted line-clamp-1">
                      {enquiry.message}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-caption text-primary-muted">{enquiry.date}</p>
                    {enquiry.assignedTo && (
                      <p className="text-caption text-primary-muted mt-1">
                        → {enquiry.assignedTo}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {selected ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-heading-sm font-semibold text-primary-text mb-1">
                  {selected.customer}
                </h3>
                <p className="text-body-sm text-primary-muted">{selected.email}</p>
                <p className="text-body-sm text-primary-muted">{selected.phone}</p>
              </div>

              <div>
                <p className="text-caption font-medium text-primary-muted uppercase tracking-wider mb-2">
                  Vehicle
                </p>
                <p className="text-body-sm text-primary-text font-medium">
                  {selected.vehicle}
                </p>
              </div>

              <div>
                <p className="text-caption font-medium text-primary-muted uppercase tracking-wider mb-2">
                  Message
                </p>
                <p className="text-body-sm text-primary-muted leading-relaxed">
                  {selected.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-caption font-medium text-primary-muted uppercase tracking-wider mb-1">
                    Source
                  </p>
                  <p className="text-body-sm text-primary-text">{selected.source}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-primary-muted uppercase tracking-wider mb-1">
                    Status
                  </p>
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-caption font-medium',
                      statusColors[selected.status]
                    )}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-caption font-medium text-primary-muted uppercase tracking-wider">
                  Update Status
                </p>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent">
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Test Drive Scheduled</option>
                  <option>Completed</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
                <button className="w-full btn-primary">Save Changes</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-body-sm text-primary-muted">
                Select an enquiry to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
