import Link from 'next/link';

// Demo metrics — in production these come from the API
const metrics = [
  { label: 'Total Vehicles', value: '248', change: '+12 this month', href: '/admin/vehicles' },
  { label: 'Published', value: '186', change: '75% of total', href: '/admin/vehicles?status=published' },
  { label: 'New Enquiries', value: '34', change: '+8 this week', href: '/admin/enquiries' },
  { label: 'Test Drives', value: '12', change: '5 pending', href: '/admin/bookings' },
];

const recentEnquiries = [
  { id: '1', customer: 'Sarah Johnson', vehicle: '2024 BMW M4 Competition', date: '2 hours ago', status: 'New' },
  { id: '2', customer: 'Michael Chen', vehicle: '2024 Mercedes EQE 350+', date: '5 hours ago', status: 'Contacted' },
  { id: '3', customer: 'Emily Rodriguez', vehicle: '2023 Porsche 911 Carrera S', date: '1 day ago', status: 'Qualified' },
  { id: '4', customer: 'James Wilson', vehicle: '2024 Audi RS e-tron GT', date: '1 day ago', status: 'New' },
  { id: '5', customer: 'Lisa Park', vehicle: '2024 Range Rover Sport', date: '2 days ago', status: 'Test Drive Scheduled' },
];

const recentBookings = [
  { id: '1', customer: 'David Kim', vehicle: '2024 BMW M4 Competition', date: 'Tomorrow, 10:00 AM', status: 'Confirmed' },
  { id: '2', customer: 'Anna Thompson', vehicle: '2024 Tesla Model S Plaid', date: 'Tomorrow, 2:00 PM', status: 'Pending' },
  { id: '3', customer: 'Robert Garcia', vehicle: '2024 Mercedes EQE 350+', date: 'Oct 14, 11:00 AM', status: 'Confirmed' },
];

const statusColors: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-yellow-50 text-yellow-700',
  Qualified: 'bg-purple-50 text-purple-700',
  'Test Drive Scheduled': 'bg-green-50 text-green-700',
  Confirmed: 'bg-green-50 text-green-700',
  Pending: 'bg-yellow-50 text-yellow-700',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-caption text-primary-muted uppercase tracking-wider font-medium mb-1">
              {metric.label}
            </p>
            <p className="text-display-sm font-semibold text-primary-text mb-1">
              {metric.value}
            </p>
            <p className="text-caption text-primary-muted">{metric.change}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Enquiries */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-heading-sm font-semibold text-primary-text">
              Recent Enquiries
            </h2>
            <Link
              href="/admin/enquiries"
              className="text-body-sm text-primary-accent hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium text-primary-text truncate">
                    {enquiry.customer}
                  </p>
                  <p className="text-caption text-primary-muted truncate">
                    {enquiry.vehicle}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-caption text-primary-muted whitespace-nowrap">
                    {enquiry.date}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-caption font-medium ${
                      statusColors[enquiry.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {enquiry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Test Drives */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-heading-sm font-semibold text-primary-text">
              Upcoming Test Drives
            </h2>
            <Link
              href="/admin/bookings"
              className="text-body-sm text-primary-accent hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-body-sm font-medium text-primary-text">
                    {booking.customer}
                  </p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-caption font-medium ${
                      statusColors[booking.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="text-caption text-primary-muted mb-1">
                  {booking.vehicle}
                </p>
                <p className="text-caption text-primary-accent font-medium">
                  {booking.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-heading-sm font-semibold text-primary-text mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/vehicles/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-accent hover:bg-primary-surface/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-surface flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-accent">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-body-sm font-medium text-primary-text">Add Vehicle</span>
          </Link>
          <Link
            href="/admin/enquiries"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-accent hover:bg-primary-surface/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-surface flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-accent">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-body-sm font-medium text-primary-text">View Enquiries</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-accent hover:bg-primary-surface/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-surface flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-accent">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <span className="text-body-sm font-medium text-primary-text">Manage Bookings</span>
          </Link>
          <Link
            href="/admin/content"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-accent hover:bg-primary-surface/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-surface flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-accent">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-body-sm font-medium text-primary-text">Edit Content</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
