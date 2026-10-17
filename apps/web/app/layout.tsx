import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CarPal — Find your next chapter',
    template: '%s | CarPal',
  },
  description:
    'Discover the right car with transparent pricing, thoughtful guidance and a better buying experience.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trycar.com',
    siteName: 'CarPal',
    title: 'CarPal — Find your next chapter',
    description:
      'Discover the right car with transparent pricing, thoughtful guidance and a better buying experience.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarPal — Find your next chapter',
    description:
      'Discover the right car with transparent pricing, thoughtful guidance and a better buying experience.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-primary-bg text-primary-text font-sans">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <FavoritesProvider>
              <Navbar />
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-white p-3 rounded-lg">Skip to content</a>
              <main tabIndex={-1} id="main-content" className="min-h-screen">{children}</main>
              <Footer />
            </FavoritesProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
