import { useState, useEffect, useCallback } from 'react';
import { CartDrawerItem } from '@/components/storefront/CartDrawer';

export interface CartData {
  items: CartDrawerItem[];
  totalAmount: number;
  itemCount: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartData>({ items: [], totalAmount: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  async function handleQuickAdd(variantId: string, quantity = 1) {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
        setIsCartOpen(true);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  }

  async function handleUpdateQuantity(variantId: string, quantity: number) {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }

  async function handleRemoveItem(variantId: string) {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    openCart,
    closeCart,
    loading,
    loadCart,
    handleQuickAdd,
    handleUpdateQuantity,
    handleRemoveItem,
  };
}
