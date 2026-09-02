import type { Metadata } from 'next';
import { db } from '@/lib/db/client';
import ProductDetailClient from '@/components/storefront/ProductDetailClient';
import { getOptimizedImageUrl, getFirstProductImage } from '@/lib/imagekit-url';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velvetcrumbdemo.com';

  try {
    const product = await db.product.findFirst({
      where: {
        slug: params.slug,
        isActive: true,
        isDeleted: false,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return {
        title: 'Product Not Found | Velvet Crumb Bakery Demo City',
        description: 'The requested cake or product could not be found.',
      };
    }

    const title = product.seoTitle || `${product.name} | 100% Veg Cake Demo City`;
    const description =
      product.metaDescription ||
      product.description.slice(0, 155) ||
      `Order freshly baked 100% eggless ${product.name} online in 12 Bakers Lane, Demo City. Fast 5 km delivery.`;

    const rawOgUrl = getFirstProductImage(product.images);
    const ogImageUrl = rawOgUrl && !rawOgUrl.startsWith('/placeholder-cake.jpg')
      ? getOptimizedImageUrl(rawOgUrl, { width: 800, height: 800 })
      : '/logo-master.png';

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/products/${product.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/products/${product.slug}`,
        siteName: 'Velvet Crumb Bakery',
        images: [
          {
            url: ogImageUrl,
            width: 800,
            height: 800,
            alt: `${product.name} - Velvet Crumb Bakery`,
          },
        ],
        locale: 'en_IN',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for product:', error);
    return {
      title: 'Product Details | Velvet Crumb Bakery Demo City',
      description: 'Order eggless cakes online from Velvet Crumb Bakery in Demo City.',
    };
  }
}

export default function ProductPage() {
  return <ProductDetailClient />;
}
