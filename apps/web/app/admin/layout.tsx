'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { isStaffRole } from '@/lib/admin-auth';

const sidebarLinks = [
  {
    group: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'grid' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { href: '/admin/vehicles', label: 'Vehicles', icon: 'car' },
      { href: '/admin/vehicles/new', label: 'Add Vehicle', icon: 'plus' },
      { href: '/admin/3d-library', label: '3D Model Sources', icon: 'car' },
      { href: '/admin/brands', label: 'Brands & Models', icon: 'tag' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { href: '/admin/enquiries', label: 'Enquiries', icon: 'mail' },
      { href: '/admin/bookings', label: 'Test Drives', icon: 'calendar' },
      { href: '/admin/customers', label: 'Customers', icon: 'users' },
    ],
  },
  {
    group: 'Content',
    items: [
      { href: '/admin/content', label: 'Homepage', icon: 'layout' },
      { href: '/admin/testimonials', label: 'Testimonials', icon: 'star' },
      { href: '/admin/faqs', label: 'FAQs', icon: 'help' },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/admin/users', label: 'Users & Roles', icon: 'shield' },
      { href: '/admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

function SidebarIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    car: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    plus: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    tag: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    mail: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    calendar: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    users: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    layout: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    star: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    help: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
    shield: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    settings: (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contentRef=useRef<HTMLDivElement>(null);
  const sidebarRef=useRef<HTMLElement>(null);
  const menuButtonRef=useRef<HTMLButtonElement>(null);
  const [desktop,setDesktop]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(min-width: 1024px)');const update=()=>{setDesktop(media.matches);if(media.matches)setIsSidebarOpen(false);};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{
    if(!isSidebarOpen||desktop)return;
    const panel=sidebarRef.current;
    const previous=document.activeElement as HTMLElement|null;
    const focusable=()=>Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')??[]);
    focusable()[0]?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setIsSidebarOpen(false);}if(e.key==='Tab'){const items=focusable();const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);queueMicrotask(()=>{if(menuButtonRef.current?.isConnected)menuButtonRef.current.focus();else previous?.focus();});};
  },[isSidebarOpen,desktop]);
  const isLogin = pathname === '/admin/login';
  const allowed = !!user && isStaffRole(user.role);
  useEffect(()=>{sidebarRef.current?.toggleAttribute('inert',!desktop&&!isSidebarOpen);contentRef.current?.toggleAttribute('inert',!desktop&&isSidebarOpen);},[desktop,isSidebarOpen,allowed]);

  useEffect(() => {
    if (isLogin || isLoading || allowed) return;
    const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin';
    router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
  }, [isLogin, isLoading, allowed, router]);

  // Don't show admin shell on login page
  if (isLogin) {
    return <>{children}</>;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-body-sm text-primary-muted">{isLoading ? 'Checking your session…' : 'Redirecting to admin login…'}</p>
      </div>
    );
  }

  return (
    <div className="carpal-admin min-h-screen bg-primary-bg flex">
      {/* Sidebar Overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside ref={sidebarRef} id="admin-sidebar"
        role={!desktop&&isSidebarOpen?'dialog':undefined} aria-modal={!desktop&&isSidebarOpen?true:undefined} aria-label="Admin navigation"
        aria-hidden={!desktop&&!isSidebarOpen?true:undefined}
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-primary-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <span className="text-lg font-bold text-primary-text">CarPal</span>
            <span className="text-caption text-primary-muted ml-2">Admin</span>
          </div>
        </div>

        <button className="absolute right-2 top-3 w-11 h-11 lg:hidden text-white" aria-label="Close admin navigation" onClick={()=>setIsSidebarOpen(false)}>✕</button>
        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100dvh-4rem)]">
          {sidebarLinks.map((group) => (
            <div key={group.group}>
              <p className="text-caption text-primary-muted uppercase tracking-wider font-medium mb-2 px-3">
                {group.group}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-surface text-primary-accent'
                            : 'text-primary-muted hover:bg-gray-50 hover:text-primary-text'
                        )}
                      >
                        <SidebarIcon name={item.icon} className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" ref={contentRef}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-3 rounded-lg hover:bg-gray-100 text-primary-muted"
              ref={menuButtonRef}
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="text-heading-sm font-semibold text-primary-text hidden sm:block">
              {pathname === '/admin'
                ? 'Dashboard'
                : pathname
                    ?.split('/')
                    .pop()
                    ?.replace(/-/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-body-sm text-primary-muted hover:text-primary-text transition-colors py-3"
            >
              View site
            </Link>
            <span className="hidden md:inline text-caption text-primary-muted">{user.email}</span>
            <button
              onClick={() => {
                logout();
                router.replace('/admin/login');
              }}
              className="text-body-sm text-primary-muted hover:text-primary-text transition-colors"
            >
              Sign out
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center">
              <span className="text-caption text-white font-medium">{user.name?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
