'use client';

import { Suspense } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import { useSearch } from '@/lib/hooks/useSearch';
import { Search, Cake } from 'lucide-react';

function SearchContent() {
  const {
    query,
    setQuery,
    products,
    searchFiltered,
    cart,
    isCartOpen,
    setIsCartOpen,
    loading,
    handleQuickAdd,
    handleUpdateQuantity,
    handleRemoveItem,
  } = useSearch();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Breadcrumbs items={[{ label: 'Search', url: '/search' }]} />

        {/* Header Search Input */}
        <div className="bg-[var(--bg-showcase)] bg-showcase-grain p-6 sm:p-8 rounded-2xl mb-8 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="eyebrow flex items-center gap-1.5 mb-1">
              <Search className="h-3.5 w-3.5" />
              Find Your Cake
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
              Search Bakery Items
            </h1>
            <div className="relative max-w-xl">
              <label htmlFor="search-input" className="sr-only">
                Search by cake name, flavor, or category
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Search by cake name, flavor (e.g. Truffle), or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-base)] border border-transparent rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] shadow-inner"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-px flex-1 bg-[var(--border-default)]" />
          <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider whitespace-nowrap">
            {query.trim() ? (
              <>Results for &quot;<span className="text-[var(--accent-primary)]">{query}</span>&quot; ({searchFiltered.length})</>
            ) : (
              <>All Bakery Products ({products.length})</>
            )}
          </h2>
          <div className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)]">Searching...</div>
        ) : searchFiltered.length === 0 ? (
          <div className="py-12 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
            <Cake className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">No products found</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              We couldn&apos;t find any active cakes or products matching &quot;{query}&quot;. Try searching for &quot;Truffle&quot; or &quot;Cakes&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchFiltered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
              />
            ))}
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

export default function SearchClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-muted)]">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
