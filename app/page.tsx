import type { Metadata } from 'next';
import HomePageClient from '@/components/storefront/HomePageClient';

export const metadata: Metadata = {
  title: 'Freshly Baked 100% Veg Cakes in Demo City | Velvet Crumb Bakery',
  description:
    'Order 100% eggless birthday cakes, anniversary specials, chocolate truffle cakes, and celebration products online in 12 Bakers Lane, Demo City. Fast 5 km delivery.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com',
  },
  openGraph: {
    title: 'Freshly Baked 100% Veg Cakes in Demo City | Velvet Crumb Bakery',
    description:
      'Order 100% eggless birthday cakes, anniversary specials, and celebration decor in 12 Bakers Lane, Demo City.',
    url: 'https://velvetcrumbdemo.com',
    siteName: 'Velvet Crumb Bakery',
    images: [
      {
        url: '/logo-master.png',
        width: 800,
        height: 800,
        alt: 'Velvet Crumb Bakery Pure Veg Bakery Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freshly Baked 100% Veg Cakes in Demo City | Velvet Crumb Bakery',
    description:
      'Order 100% eggless birthday cakes, anniversary specials, and celebration decor in Demo City.',
    images: ['/logo-master.png'],
  },
};

export default function StorefrontHomePage() {
  return <HomePageClient />;
}
