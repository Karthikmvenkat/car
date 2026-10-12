'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MobileMenu } from './MobileMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';

const navLinks = [
  { href: '/vehicles', label: 'Discover' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'Why CAR' },
  { href: '/stories', label: 'Customer Stories' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { count: favCount } = useFavorites();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // On non-homepage pages, always show solid navbar (no dark hero behind them)
  const isSolid = useMemo(() => {
    const isHome = pathname === '/';
    return isScrolled || !isHome;
  }, [isScrolled, pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isSolid
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-primary-border'
            : 'bg-transparent'
        )}
      >
        <nav className="container-main flex items-center justify-between h-18 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="CAR Home"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300',
                isSolid ? 'bg-primary-accent' : 'bg-white/20 backdrop-blur-sm'
              )}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className={cn(
                  'transition-colors duration-300',
                  isScrolled ? 'text-white' : 'text-white'
                )}
              >
                <path
                  d="M5 17h14v-2H5v2zm0-4h14v-2H5v2zm0-6v2h14V7H5z"
                  fill="currentColor"
                  opacity="0.3"
                />
                <path
                  d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span
              className={cn(
                'text-xl font-bold tracking-tight transition-colors duration-300',
                isSolid ? 'text-primary-text' : 'text-white'
              )}
            >
              CAR
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-body-sm font-medium transition-colors duration-300 hover:opacity-80',
                  isSolid ? 'text-[#171A18]' : 'text-white/90'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? null : user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    isSolid
                      ? 'text-[#171A18] hover:bg-[#E9EDE6]'
                      : 'text-white/90 hover:bg-white/10'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white text-body-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-body-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform',
                      isUserMenuOpen && 'rotate-180'
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-primary-border py-1 z-50">
                    <div className="px-4 py-3 border-b border-primary-border">
                      <p className="text-body-sm font-medium text-primary-text truncate">
                        {user.name}
                      </p>
                      <p className="text-caption text-primary-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-body-sm text-primary-text hover:bg-primary-bg transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center justify-between px-4 py-2 text-body-sm text-primary-text hover:bg-primary-bg transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span>Saved Vehicles</span>
                      {favCount > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center text-[11px] font-semibold bg-red-500 text-white rounded-full px-1.5">
                          {favCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-body-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className={cn(
                    'text-body-sm font-medium transition-colors duration-300',
                    isSolid
                      ? 'text-[#171A18] hover:text-[#7D8A78]'
                      : 'text-white/90 hover:text-white'
                  )}
                >
                  Sign In
                </Link>
                <Link href="/get-started" className="btn-primary text-body-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              isSolid
                ? 'text-[#171A18] hover:bg-[#E9EDE6]'
                : 'text-white hover:bg-white/10'
            )}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isMobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
      />
    </>
  );
}
