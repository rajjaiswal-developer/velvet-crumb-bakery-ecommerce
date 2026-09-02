'use client';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import CartDrawer from '@/components/storefront/CartDrawer';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import { getOptimizedImageUrl } from '@/lib/imagekit-url';
import { useProductDetail } from '@/lib/hooks/useProductDetail';
import { useAutoScrollToNotification } from '@/lib/hooks/useAutoScrollToNotification';
import { ShoppingBag, ShieldCheck, MapPin, Plus, Minus, AlertCircle, Check } from 'lucide-react';

export default function ProductDetailClient() {
  const {
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
    cart,
    isCartOpen,
    setIsCartOpen,
    loading,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
  } = useProductDetail();

  useAutoScrollToNotification(message);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)]">Loading product details...</div>
        ) : !product ? (
          <div className="py-16 text-center text-[var(--text-muted)]">Product not found</div>
        ) : (
          <div className="space-y-6">
            <Breadcrumbs items={breadcrumbItems} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[var(--bg-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] shadow-sm">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-square rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt={`${product.name} - Fresh 100% Eggless Pure Veg Cake`}
                    width={800}
                    height={800}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-cake.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-4 py-2 bg-[var(--state-error)] text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {imagesList.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2" role="group" aria-label="Product thumbnails">
                    {imagesList.map((imgUrl: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-lg border overflow-hidden transition-all flex-shrink-0 ${
                          activeImageIndex === idx
                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
                            : 'border-[var(--border-default)] opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getOptimizedImageUrl(imgUrl, { width: 150, height: 150 })}
                          alt={`${product.name} view ${idx + 1}`}
                          width={150}
                          height={150}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-cake.jpg';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details & Variant Selection */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-[var(--accent-secondary)]/15 text-[#8a6a1f] text-xs font-bold uppercase tracking-wider rounded-full">
                      {product.category?.name || 'Cake'}
                    </span>
                    {product.flavor && (
                      <span className="px-2.5 py-1 bg-[var(--bg-showcase)] text-[var(--accent-secondary)] text-xs font-bold uppercase tracking-wider rounded-full">
                        {typeof product.flavor === 'object' ? product.flavor?.name : product.flavor}
                      </span>
                    )}
                  </div>

                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                    {product.name}
                  </h1>
                  <svg viewBox="0 0 140 10" className="w-28 h-2 mt-1" aria-hidden="true">
                    <path d="M2 6 C 20 1, 34 9, 52 5 S 84 1, 100 6 S 128 9, 138 4" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" className="icing-underline" />
                  </svg>

                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[var(--accent-primary)]">
                      ₹{selectedVariant ? Number(selectedVariant.price) : 0}
                    </span>
                    {selectedVariant && (
                      <span className="text-sm text-[var(--text-muted)]">
                        ({selectedVariant.label})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] leading-relaxed border-t border-b border-[var(--border-default)] py-4">
                  {product.description}
                </p>

                {/* Variant Selector */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-[var(--text-primary)]">
                      Select Weight / Option
                    </label>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cake weight options">
                      {product.variants.map((v) => {
                        const stock = Math.max(0, v.stockQuantity - v.reservedQuantity);
                        const isVAvailable = stock > 0;
                        const isSelected = selectedVariantId === v.id;

                        return (
                          <button
                            key={v.id}
                            onClick={() => {
                              if (isVAvailable) {
                                setSelectedVariantId(v.id);
                                setQuantity(1);
                                setMessage(null);
                              }
                            }}
                            disabled={!isVAvailable}
                            aria-checked={isSelected}
                            role="radio"
                            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-[var(--bg-showcase)] text-white border-[var(--bg-showcase)] shadow-md'
                                : isVAvailable
                                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                                : 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                            }`}
                          >
                            <span>{v.label} - ₹{Number(v.price)}</span>
                            {!isVAvailable && (
                              <span className="text-[10px] bg-[var(--state-error)]/10 text-[var(--state-error)] px-1.5 py-0.5 rounded no-underline">
                                Sold Out
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector & Add to Cart */}
                {isAvailable ? (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-[var(--text-primary)]">Quantity</span>
                      <div className="flex items-center border border-[var(--border-default)] rounded-xl bg-[var(--bg-base)] p-1">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="p-2 hover:bg-black/5 text-[var(--text-primary)] rounded-lg"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 text-sm font-bold text-[var(--text-primary)]">{quantity}</span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                          disabled={quantity >= availableStock}
                          className="p-2 hover:bg-black/5 text-[var(--text-primary)] rounded-lg disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        ({availableStock} available)
                      </span>
                    </div>

                    {message && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                          message.type === 'error'
                            ? 'bg-[var(--state-error)]/10 text-[var(--state-error)] border border-[var(--state-error)]/30'
                            : 'bg-[var(--state-success)]/10 text-[var(--state-success)] border border-[var(--state-success)]/30'
                        }`}
                      >
                        {message.type === 'error' ? (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        )}
                        {message.text}
                      </div>
                    )}

                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Add to Cart • ₹{(selectedVariant ? Number(selectedVariant.price) : 0) * quantity}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded-xl text-[var(--state-error)] text-sm font-medium">
                    This variant is currently out of stock. Please check back later.
                  </div>
                )}

                {/* Guarantees */}
                <div className="border-t border-[var(--border-default)] pt-6 space-y-3 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--state-success)]" />
                    <span>100% Vegetarian &amp; Freshly Baked in Demo City</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>Delivered within 5 km straight-line radius</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
