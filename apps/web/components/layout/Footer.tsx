import Link from 'next/link';

const footerLinks = {
  browse: [
    { href: '/vehicles', label: 'All Vehicles' },
    { href: '/vehicles?condition=new', label: 'New Cars' },
    { href: '/vehicles?condition=used', label: 'Used Cars' },
    { href: '/vehicles?condition=certified', label: 'Certified Pre-Owned' },
    { href: '/vehicles?bodyStyle=suv', label: 'SUVs' },
    { href: '/vehicles?bodyStyle=sedan', label: 'Sedans' },
  ],
  about: [
    { href: '/about', label: 'About CarPal' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/stories', label: 'Customer Stories' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/careers', label: 'Careers' },
  ],
  support: [
    { href: '/faq', label: 'FAQs' },
    { href: '/help', label: 'Help Center' },
    { href: '/financing', label: 'Financing' },
    { href: '/trade-in', label: 'Trade-In' },
    { href: '/shipping', label: 'Shipping' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/cookies', label: 'Cookie Preferences' },
    { href: '/accessibility', label: 'Accessibility' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container-main section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary-accent flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">CarPal</span>
            </Link>
            <p className="text-body-sm text-white/60 mb-6 max-w-xs">
              Your next car, a better way. Transparent pricing, thoughtful
              guidance and a premium buying experience.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {['twitter', 'instagram', 'facebook', 'youtube'].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary-accent transition-colors"
                  aria-label={`Follow us on ${social}`}
                >
                  <span className="text-caption text-white/70 uppercase">
                    {social[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Browse
            </h3>
            <ul className="space-y-3">
              {footerLinks.browse.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              About
            </h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-body-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-caption text-white/40">
            &copy; {new Date().getFullYear()} CarPal. All rights reserved.
          </p>
          <p className="text-caption text-white/40">
            Designed with care for car enthusiasts everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
