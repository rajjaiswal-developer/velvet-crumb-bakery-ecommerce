'use client';

import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import { useCategoryListing } from '@/lib/hooks/useCategoryListing';
import { Cake, Sparkles, Filter, Search, ArrowRight, Layers } from 'lucide-react';

export default function CategoryListingClient() {
  const {
    slug,
    category,
    subcategories,
    allProducts,
    flavors,
    selectedFlavor,
    setSelectedFlavor,
    searchQuery,
    setSearchQuery,
    filtered,
    isTopLevel,
    breadcrumbItems,
    cart,
    isCartOpen,
    setIsCartOpen,
    loading,
    handleQuickAdd,
    handleUpdateQuantity,
    handleRemoveItem,
  } = useCategoryListing();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)]">Loading category...</div>
        ) : !category ? (
          <div className="py-16 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
            <Cake className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-[var(--text-primary)]">Category Not Found</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              The category &quot;{slug}&quot; does not exist or has been removed.
            </p>
          </div>
        ) : isTopLevel ? (
          /* TOP-LEVEL CATEGORY VIEW (SUBCATEGORY CARDS GRID) */
          <div>
            <Breadcrumbs items={breadcrumbItems} />

            <div className="bg-[var(--bg-showcase)] bg-showcase-grain text-white p-8 rounded-2xl shadow-md mb-8 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="eyebrow flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Main Category
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                  {category.name}
                </h1>
                <p className="text-xs text-gray-300 max-w-lg">
                  Select a subcategory below to explore our pure eggless {category.name.toLowerCase()} freshly baked in Demo City.
                </p>
                <svg viewBox="0 0 140 10" className="w-28 h-2" aria-hidden="true">
                  <path d="M2 6 C 20 1, 34 9, 52 5 S 84 1, 100 6 S 128 9, 138 4" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--accent-primary)]" />
                Browse {category.name} Subcategories
              </h2>
            </div>

            {subcategories.length === 0 ? (
              <div className="py-12 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
                <Cake className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">No subcategories available</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Check back soon for new subcategories under {category.name}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {subcategories.map((sub) => {
                  const subCount = allProducts.filter((p) => p.categoryId === sub.id).length;
                  return (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      className="group bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] hover:border-[var(--accent-primary)] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                          <Cake className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-primary)] transition-colors">
                            {sub.name}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {subCount} product{subCount === 1 ? '' : 's'} available
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs font-bold text-[var(--accent-primary)]">
                        <span>Explore Products</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* SUBCATEGORY VIEW (PRODUCT LISTING WITH FILTERS) */
          <div>
            <Breadcrumbs items={breadcrumbItems} />

            {/* Header Banner */}
            <div className="bg-[var(--bg-showcase)] bg-showcase-grain text-white p-8 rounded-2xl shadow-md mb-8 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="eyebrow flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {category.parent?.name || 'Category'} › Subcategory
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                  {category.name}
                </h1>
                <p className="text-xs text-gray-300 max-w-lg">
                  Browse 100% pure vegetarian {category.name.toLowerCase()} freshly baked in Demo City.
                </p>
                <svg viewBox="0 0 140 10" className="w-28 h-2" aria-hidden="true">
                  <path d="M2 6 C 20 1, 34 9, 52 5 S 84 1, 100 6 S 128 9, 138 4" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)] mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
              {/* Flavor Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0" role="group" aria-label="Filter by flavor">
                <Filter className="h-4 w-4 text-[var(--accent-primary)] flex-shrink-0" />
                <button
                  onClick={() => setSelectedFlavor('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedFlavor === ''
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-gray-100'
                  }`}
                >
                  All Flavors
                </button>
                {flavors.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFlavor(f.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedFlavor === f.name
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-gray-100'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* In-category Search */}
              <div className="relative w-full md:w-64">
                <label htmlFor="category-search" className="sr-only">
                  Search in {category.name}
                </label>
                <input
                  id="category-search"
                  type="text"
                  placeholder={`Search in ${category.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              </div>
            </div>

            {/* Products Grid / Empty State */}
            {filtered.length === 0 ? (
              <div className="py-12 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
                <Cake className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">No products found in this subcategory</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {selectedFlavor || searchQuery
                    ? 'Try adjusting your search query or flavor filter.'
                    : 'We are currently adding fresh cakes to this subcategory. Check back soon!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            )}
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
