'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useGsapContext, prefersReducedMotion } from '@/hooks/useGsap';
import { useAuth } from '@/contexts/AuthContext';

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export function MobileMenu({ isOpen, onClose, navLinks }: MobileMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) return;

    const tl = gsap.timeline();

    if (isOpen) {
      tl.fromTo(
        '.mobile-menu-overlay',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3 }
      )
        .fromTo(
          '.mobile-menu-panel',
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '<'
        )
        .fromTo(
          '.mobile-menu-link',
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out' },
          '-=0.1'
        );
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="fixed inset-0 z-[60] md:hidden">
      {/* Overlay */}
      <div
        className="mobile-menu-overlay absolute inset-0 bg-primary-dark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ opacity: 0 }}
      />

      {/* Panel */}
      <div
        className="mobile-menu-panel absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto"
        style={{ transform: 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="p-6">
          {/* Close button */}
          <div className="flex justify-end mb-8">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-primary-muted hover:text-primary-text hover:bg-primary-surface transition-colors"
              aria-label="Close menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="mobile-menu-link block px-4 py-3 text-body-lg font-medium text-primary-text hover:text-primary-accent hover:bg-primary-surface rounded-lg transition-colors"
                style={{ opacity: 0 }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-primary-border space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-primary-text">
                      {user.name}
                    </p>
                    <p className="text-caption text-primary-muted truncate max-w-[200px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block w-full text-center px-6 py-3 text-body-md font-medium text-primary-text border border-primary-border rounded-lg hover:bg-primary-surface transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center px-6 py-3 text-body-md font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={onClose}
                  className="block w-full text-center px-6 py-3 text-body-md font-medium text-primary-text border border-primary-border rounded-lg hover:bg-primary-surface transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/get-started"
                  onClick={onClose}
                  className="block w-full text-center btn-primary"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Contact info */}
          <div className="mt-8 pt-8 border-t border-primary-border">
            <p className="text-caption mb-2">Need help?</p>
            <a
              href="tel:+1234567890"
              className="text-body-sm font-medium text-primary-accent hover:underline"
            >
              Call us: (123) 456-7890
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
