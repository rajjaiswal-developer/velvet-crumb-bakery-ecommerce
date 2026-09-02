import type { Metadata } from 'next';
import SearchClient from '@/components/storefront/SearchClient';

export const metadata: Metadata = {
  title: 'Search Bakery Products | Velvet Crumb Bakery Demo City',
  description: 'Search eggless cakes, chocolate truffle cakes, birthday specials, and celebration products at Velvet Crumb Bakery Demo City.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/search',
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
