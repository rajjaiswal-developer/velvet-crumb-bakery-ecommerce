'use client';

import { useEffect } from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getOptimizedImageUrl } from '@/lib/imagekit-url';

export interface CartDrawerItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  variantLabel: string;
  price: number;
  quantity: number;
  availableStock: number;
  isAvailable: boolean;
  itemTotal: number;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: {
    items?: CartDrawerItem[];
    totalAmount?: number;
    itemCount?: number;
  };
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const totalAmount = cart?.totalAmount || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart Drawer">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[var(--bg-base)] shadow-2xl border-l border-[var(--border-default)] flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">Your Shopping Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[var(--text-primary)] font-serif font-bold">Your cart is empty</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Explore our delicious vegetarian cakes!</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.variantId}
                  className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-default)] flex gap-3 shadow-sm"
                >
                  {item.productImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getOptimizedImageUrl(item.productImage, { width: 120, height: 120 })}
                      alt={`${item.productName} thumbnail`}
                      width={64}
                      height={64}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-cake.jpg';
                      }}
                      className="w-16 h-16 object-cover rounded-lg bg-[var(--bg-base)] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[var(--accent-secondary)]/15 rounded-lg flex items-center justify-center text-[var(--accent-secondary)] font-serif font-bold text-xs flex-shrink-0">
                      Cake
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={onClose}
                      className="font-bold text-[var(--text-primary)] text-sm hover:text-[var(--accent-primary)] truncate block"
                    >
                      {item.productName}
                    </Link>
                    <div className="text-xs text-[var(--text-muted)]">{item.variantLabel}</div>
                    <div className="text-sm font-semibold text-[var(--accent-primary)] mt-1">
                      ₹{item.price}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[var(--border-default)] rounded-md bg-[var(--bg-base)]">
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-black/5 text-[var(--text-primary)] rounded-l"
                          aria-label={`Decrease quantity of ${item.productName}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[var(--text-primary)]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="p-1 hover:bg-black/5 text-[var(--text-primary)] rounded-r disabled:opacity-30"
                          aria-label={`Increase quantity of ${item.productName}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.variantId)}
                        className="text-gray-400 hover:text-[var(--state-error)] p-1"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal */}
          {items.length > 0 && (
            <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-default)] space-y-3">
              <div className="flex justify-between items-center text-[var(--text-primary)]">
                <span className="font-medium">Subtotal</span>
                <span className="text-xl font-bold text-[var(--accent-primary)]">₹{totalAmount}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Delivery options and time slots will be selected in checkout.</p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 shadow transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
