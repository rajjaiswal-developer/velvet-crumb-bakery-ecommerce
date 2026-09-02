import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: unknown;
  flavor?: string | { id?: string; name: string } | null;
  category?: { name: string; slug: string };
  variants: Array<{
    id: string;
    label: string;
    price: number;
    stockQuantity: number;
    reservedQuantity: number;
  }>;
}

export function useSearch() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  const cartHook = useCart();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products/public');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error('Error fetching search products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const searchFiltered = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        const flavorName = typeof p.flavor === 'object' ? p.flavor?.name : p.flavor;
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (flavorName && flavorName.toLowerCase().includes(q)) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q))
        );
      })
    : products;

  return {
    query,
    setQuery,
    products,
    searchFiltered,
    cart: cartHook.cart,
    isCartOpen: cartHook.isCartOpen,
    setIsCartOpen: cartHook.setIsCartOpen,
    loading: loading || cartHook.loading,
    handleQuickAdd: cartHook.handleQuickAdd,
    handleUpdateQuantity: cartHook.handleUpdateQuantity,
    handleRemoveItem: cartHook.handleRemoveItem,
  };
}

