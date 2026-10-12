import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CAR — Your Next Car, A Better Way',
    template: '%s | CAR',
  },
  description:
    'Discover the right car with transparent pricing, thoughtful guidance and a better buying experience.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trycar.com',
    siteName: 'CAR',
    title: 'CAR — Your Next Car, A Better Way',
    description:
      'Discover the right car with transparent pricing, thoughtful guidance and a better buying experience.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAR — Your Next Car, A Better Way',
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-primary-bg text-primary-text font-sans">
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <FavoritesProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </FavoritesProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
