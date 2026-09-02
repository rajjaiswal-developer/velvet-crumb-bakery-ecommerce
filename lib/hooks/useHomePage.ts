import { useState, useEffect } from 'react';
import { getFirstProductImage, getOptimizedImageUrl } from '@/lib/imagekit-url';
import { useCart } from '@/lib/hooks/useCart';

export interface FlavorData {
  id: string;
  name: string;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: unknown;
  flavor?: string | { id?: string; name: string } | null;
  isFeatured?: boolean;
  category?: { name: string; slug: string };
  variants: Array<{
    id: string;
    label: string;
    price: number;
    stockQuantity: number;
    reservedQuantity: number;
  }>;
}

export function useHomePage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [flavors, setFlavors] = useState<FlavorData[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const cartHook = useCart();

  useEffect(() => {
    loadStorefrontData();
  }, []);

  async function loadStorefrontData() {
    try {
      const [prodRes, flavRes] = await Promise.all([
        fetch('/api/products/public'),
        fetch('/api/flavors/public'),
      ]);

      const prodData = await prodRes.json();
      const flavData = await flavRes.json();

      if (prodData.success) setProducts(prodData.data);
      if (flavData.success) setFlavors(flavData.data);
    } catch (err) {
      console.error('Error loading storefront data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = selectedFlavor
    ? products.filter((p) => {
        const flavorName = typeof p.flavor === 'object' ? p.flavor?.name : p.flavor;
        return flavorName === selectedFlavor;
      })
    : products;

  // Resolve featured products for hero (capped at 5)
  const rawFeatured = products.filter((p) => p.isFeatured).slice(0, 5);
  if (rawFeatured.length === 0 && products.length > 0) {
    rawFeatured.push(products[0]);
  }

  const featuredProducts = rawFeatured.map((prod) => {
    const rawUrl = getFirstProductImage(prod.images);
    const heroImageUrl = getOptimizedImageUrl(rawUrl, { width: 600, height: 600, quality: 85 });
    return { product: prod, heroImageUrl };
  });

  const featuredProduct = featuredProducts[0]?.product;
  const heroImageUrl = featuredProducts[0]?.heroImageUrl || '';

  return {
    products,
    flavors,
    selectedFlavor,
    setSelectedFlavor,
    filteredProducts,
    featuredProduct,
    heroImageUrl,
    featuredProducts,
    cart: cartHook.cart,
    isCartOpen: cartHook.isCartOpen,
    setIsCartOpen: cartHook.setIsCartOpen,
    loading: loading || cartHook.loading,
    handleQuickAdd: cartHook.handleQuickAdd,
    handleUpdateQuantity: cartHook.handleUpdateQuantity,
    handleRemoveItem: cartHook.handleRemoveItem,
  };
}

