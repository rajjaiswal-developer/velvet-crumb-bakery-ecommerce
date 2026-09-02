import type { Metadata } from 'next';
import CustomCakesClient from '@/components/storefront/CustomCakesClient';

export const metadata: Metadata = {
  title: 'Custom Photo & Theme Cakes Demo City | Velvet Crumb Bakery',
  description:
    'Order custom 100% eggless photo cakes, tier cakes, and birthday theme designs directly via WhatsApp from Velvet Crumb Bakery in 12 Bakers Lane, Demo City.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/custom-cakes',
  },
  openGraph: {
    title: 'Custom Photo & Theme Cakes Demo City | Velvet Crumb Bakery',
    description:
      'Order custom 100% eggless photo cakes, tier cakes, and birthday theme designs directly via WhatsApp.',
    url: 'https://velvetcrumbdemo.com/custom-cakes',
    siteName: 'Velvet Crumb Bakery',
    images: [
      {
        url: '/logo-master.png',
        width: 800,
        height: 800,
        alt: 'Custom Cakes Velvet Crumb Bakery Demo City',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Photo & Theme Cakes Demo City | Velvet Crumb Bakery',
    description:
      'Order custom 100% eggless photo cakes and theme designs directly via WhatsApp in Demo City.',
    images: ['/logo-master.png'],
  },
};

export default function CustomCakesPage() {
  return <CustomCakesClient />;
}
