import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getOptimizedImageUrl, getProductImages } from '@/lib/imagekit-url';
import { useCart } from '@/lib/hooks/useCart';

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: unknown;
  flavor?: string | { id?: string; name: string } | null;
  category?: { name: string; slug: string };
  variants: ProductVariant[];
}

export function useProductDetail() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const cartHook = useCart();

  const loadProductData = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/products/public/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProduct(data.data);
        if (data.data.variants && data.data.variants.length > 0) {
          setSelectedVariantId((prev) => (prev ? prev : data.data.variants[0].id));
        }
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error('Error fetching PDP product:', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  if (!loading && !product) {
    notFound();
  }

  const selectedVariant = product?.variants?.find((v) => v.id === selectedVariantId) || product?.variants?.[0];
  const availableStock = selectedVariant
    ? Math.max(0, selectedVariant.stockQuantity - selectedVariant.reservedQuantity)
    : 0;
  const isAvailable = availableStock > 0;

  async function handleAddToCart() {
    if (!selectedVariant || !isAvailable) return;
    setMessage(null);

    try {
      await cartHook.handleQuickAdd(selectedVariant.id, quantity);
      setMessage({ type: 'success', text: 'Added to cart successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  }

  const imagesList = getProductImages(product?.images);
  const rawCurrentImage = imagesList[activeImageIndex] || imagesList[0];
  const currentImage = getOptimizedImageUrl(rawCurrentImage, { width: 800, height: 800, quality: 85 });

  // Schema.org Product JSON-LD
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: imagesList.map((img) => getOptimizedImageUrl(img, { width: 800, height: 800 })),
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: 'Velvet Crumb Bakery',
        },
        offers: {
          '@type': 'Offer',
          url: `https://velvetcrumbdemo.com/products/${product.slug}`,
          priceCurrency: 'INR',
          price: selectedVariant ? Number(selectedVariant.price) : 0,
          itemCondition: 'https://schema.org/NewCondition',
          availability: isAvailable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Velvet Crumb Bakery',
          },
        },
      }
    : null;

  const categoryInfo = product?.category;
  const parentInfo = (categoryInfo as unknown as { parent?: { name: string; slug: string } })?.parent;

  const breadcrumbItems = [];
  if (parentInfo) {
    breadcrumbItems.push({
      label: parentInfo.name,
      url: `/categories/${parentInfo.slug}`,
    });
  }
  if (categoryInfo) {
    breadcrumbItems.push({
      label: categoryInfo.name,
      url: `/categories/${categoryInfo.slug}`,
    });
  } else {
    breadcrumbItems.push({
      label: 'Categories',
      url: '/categories/cakes',
    });
  }
  breadcrumbItems.push({
    label: product?.name || 'Product',
    url: `/products/${slug}`,
  });

  return {
    slug,
    product,
    selectedVariant,
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    availableStock,
    isAvailable,
    activeImageIndex,
    setActiveImageIndex,
    imagesList,
    currentImage,
    message,
    setMessage,
    breadcrumbItems,
    jsonLd,
    cart: cartHook.cart,
    isCartOpen: cartHook.isCartOpen,
    setIsCartOpen: cartHook.setIsCartOpen,
    loading: loading || cartHook.loading,
    handleAddToCart,
    handleUpdateQuantity: cartHook.handleUpdateQuantity,
    handleRemoveItem: cartHook.handleRemoveItem,
  };
}

