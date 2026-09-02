import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';

export const CACHE_TAGS = {
  CATALOG: 'catalog',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  FLAVORS: 'flavors',
} as const;

export const getCachedPublicProducts = unstable_cache(
  async () => {
    return db.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        category: {
          include: { parent: true },
        },
        flavor: true,
        variants: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['public-products-list'],
  {
    tags: [CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS],
  }
);

export const getCachedPublicCategories = unstable_cache(
  async () => {
    return db.category.findMany({
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
      orderBy: { name: 'asc' },
    });
  },
  ['public-categories-list'],
  {
    tags: [CACHE_TAGS.CATALOG, CACHE_TAGS.CATEGORIES],
  }
);

export const getCachedPublicFlavors = unstable_cache(
  async () => {
    return db.flavor.findMany({
      orderBy: { name: 'asc' },
    });
  },
  ['public-flavors-list'],
  {
    tags: [CACHE_TAGS.CATALOG, CACHE_TAGS.FLAVORS],
  }
);

/**
 * Trigger immediate on-demand cache revalidation for storefront catalog pages.
 */
export function revalidateCatalog(tags: string[] = [CACHE_TAGS.CATALOG]) {
  try {
    for (const tag of tags) {
      revalidateTag(tag);
    }
    revalidatePath('/');
    revalidatePath('/categories/[slug]', 'page');
    revalidatePath('/api/products/public');
    revalidatePath('/api/categories/public');
    revalidatePath('/api/flavors/public');
  } catch (error) {
    console.error('Error triggering revalidation:', error);
  }
}
