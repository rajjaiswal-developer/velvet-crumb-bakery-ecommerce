'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl, getFirstProductImage } from '@/lib/imagekit-url';

export interface ProductVariant {
  id: string;
  label: string;
  price: number | string;
  stockQuantity: number;
  reservedQuantity: number;
}

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    images: unknown;
    flavor?: string | { id?: string; name: string } | null;
    category?: { name: string; slug: string };
    variants: ProductVariant[];
  };
  onQuickAdd?: (variantId: string) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id ?? '');
  const selectedVariant =
    product.variants?.find((v) => v.id === selectedVariantId) ?? product.variants?.[0];
  const price = selectedVariant ? Number(selectedVariant.price) : 0;

  // Calculate stock availability server-side evaluated value
  const availableStock = selectedVariant
    ? Math.max(0, selectedVariant.stockQuantity - selectedVariant.reservedQuantity)
    : 0;
  const isAvailable = availableStock > 0;

  // ImageKit image formatting
  const rawImageUrl = getFirstProductImage(product.images);
  const imageUrl = getOptimizedImageUrl(rawImageUrl, { width: 400, height: 400, quality: 80 });

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-square bg-[var(--bg-base)] overflow-hidden">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={`${product.name} - 100% Eggless Pure Veg Cake`}
            width={400}
            height={400}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-cake.jpg';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-base)] text-[var(--accent-secondary)] font-serif font-bold">
            Velvet Crumb Bakery
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.flavor && (
            <span className="px-2.5 py-1 bg-[var(--bg-showcase)]/85 backdrop-blur-md text-[var(--accent-secondary)] text-[10px] font-bold uppercase tracking-wider rounded-full shadow">
              {typeof product.flavor === 'object' ? product.flavor?.name : product.flavor}
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-[var(--state-error)] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">
            {product.category?.name || 'Cake'}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="font-serif font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1 block"
          >
            {product.name}
          </Link>
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>

          {product.variants && product.variants.length > 1 && (
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              aria-label={`Select size for ${product.name}`}
              className="mt-2 w-full text-xs bg-[var(--bg-base)] border border-[var(--border-default)] rounded-md px-2 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              {product.variants.map((v) => {
                const stock = Math.max(0, v.stockQuantity - v.reservedQuantity);
                return (
                  <option key={v.id} value={v.id} disabled={stock <= 0}>
                    {v.label} — ₹{Number(v.price)}
                    {stock <= 0 ? ' (Out of stock)' : ''}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-[var(--border-default)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] block">Starts at</span>
            <span className="text-lg font-bold text-[var(--accent-primary)]">₹{price}</span>
            {selectedVariant && (
              <span className="text-[11px] text-[var(--text-muted)] ml-1">({selectedVariant.label})</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isAvailable && selectedVariant && onQuickAdd && (
              <button
                onClick={() => onQuickAdd(selectedVariant.id)}
                className="p-2 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-white border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all shadow-sm"
                title="Add to Cart"
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            )}

            <Link
              href={`/products/${product.slug}`}
              className="p-2 rounded-xl bg-[var(--bg-showcase)] hover:bg-[var(--accent-primary)] text-white transition-colors"
              title="View Details"
              aria-label={`View details for ${product.name}`}
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
