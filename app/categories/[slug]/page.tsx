import type { Metadata } from 'next';
import { db } from '@/lib/db/client';
import CategoryListingClient from '@/components/storefront/CategoryListingClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velvetcrumbdemo.com';

  try {
    const category = await db.category.findUnique({
      where: { slug: params.slug },
    });

    if (!category) {
      return {
        title: 'Category Not Found | Velvet Crumb Bakery Demo City',
        description: 'The requested category could not be found.',
      };
    }

    const title = `${category.name} | 100% Eggless Bakery Demo City`;
    const description = `Browse freshly baked 100% eggless ${category.name.toLowerCase()} at Velvet Crumb Bakery in 12 Bakers Lane, Demo City. Fast 5 km delivery.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/categories/${category.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/categories/${category.slug}`,
        siteName: 'Velvet Crumb Bakery',
        images: [
          {
            url: '/logo-master.png',
            width: 800,
            height: 800,
            alt: `${category.name} - Velvet Crumb Bakery`,
          },
        ],
        locale: 'en_IN',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/logo-master.png'],
      },
    };
  } catch (error) {
    console.error('Error generating category metadata:', error);
    return {
      title: 'Bakery Category | Velvet Crumb Bakery Demo City',
      description: 'Browse eggless cakes and bakery items from Velvet Crumb Bakery in Demo City.',
    };
  }
}

export default function CategoryPage() {
  return <CategoryListingClient />;
}
