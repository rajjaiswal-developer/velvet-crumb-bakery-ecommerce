import type { Metadata } from 'next';
import { Playfair_Display, Jost } from 'next/font/google';
import './globals.css';
import LocalBusinessSchema from '@/components/storefront/LocalBusinessSchema';

const fontDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const fontSans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velvetcrumbdemo.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Velvet Crumb Bakery — 100% Vegetarian Cake Shop Demo City',
    template: '%s | Velvet Crumb Bakery Demo City',
  },
  description:
    'Freshly baked 100% eggless cakes and celebration products in 12 Bakers Lane, Demo City. Delivered within a 5 km radius.',
  keywords: [
    'eggless cake Demo City',
    'pure veg bakery mumbai',
    'birthday cake delivery Demo City',
    'custom cakes Demo City west',
    'Velvet Crumb cakes',
  ],
  authors: [{ name: 'Velvet Crumb Bakery' }],
  creator: 'Velvet Crumb Bakery',
  publisher: 'Velvet Crumb Bakery',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: './',
  },
  icons: {
    icon: [
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: ['/favicon.ico?v=2'],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Velvet Crumb Bakery — 100% Vegetarian Cake Shop',
    description:
      'Freshly baked 100% eggless cakes and celebration products in 12 Bakers Lane, Demo City. Delivered within a 5 km radius.',
    url: baseUrl,
    siteName: 'Velvet Crumb Bakery',
    images: [
      {
        url: '/logo-master.png',
        width: 800,
        height: 800,
        alt: 'Velvet Crumb Bakery Logo & Pure Veg Bakery',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velvet Crumb Bakery — 100% Vegetarian Cake Shop',
    description:
      'Freshly baked 100% eggless cakes and celebration products in 12 Bakers Lane, Demo City.',
    images: ['/logo-master.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontSans.variable} antialiased`}>
        <LocalBusinessSchema />
        {children}
      </body>
    </html>
  );
}
