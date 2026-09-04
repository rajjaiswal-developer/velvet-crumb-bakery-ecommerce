'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Cake,
  Sparkles,
  MessageCircle,
  Truck,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import ActiveOrderStatusBanner from '@/components/storefront/ActiveOrderStatusBanner';

export interface NavbarProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
}

const PRIMARY_LINKS = [
  { href: '/categories/cakes', label: 'Cakes', Icon: Cake, tint: 'text-[var(--accent-primary)]' },
  { href: '/categories/celebration', label: 'Celebration Products', Icon: Sparkles, tint: 'text-[var(--accent-secondary)]' },
];

export default function Navbar({ cartItemCount = 0, onOpenCart }: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isShopClosed, setIsShopClosed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/shop-settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setIsShopClosed(!data.data.isOpen);
        }
      })
      .catch(() => {});
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-default)]">
      <div className="bg-amber-900/90 text-amber-100 text-xs py-1.5 px-4 text-center font-semibold tracking-wide border-b border-amber-700/50">Portfolio Demo Project — Not a Real Business</div>
      <ActiveOrderStatusBanner />

      {isShopClosed && (
        <div className="bg-gradient-to-r from-[var(--accent-secondary)] to-[#e3bd77] text-[var(--text-primary)] text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Bakery notice: we&apos;re not accepting new checkout orders right now — browsing is still open.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem] gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-master.png"
              alt="Velvet Crumb Bakery Logo"
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  Velvet Crumb Bakery
                </span>
                <span
                  className="w-3.5 h-3.5 border border-[var(--state-success)] flex items-center justify-center p-0.5 rounded-sm"
                  title="100% Vegetarian"
                >
                  <span className="w-1.5 h-1.5 bg-[var(--state-success)] rounded-full" />
                </span>
              </div>
              {/* signature piped-icing underline */}
              <svg viewBox="0 0 140 10" className="w-28 h-2 -mt-0.5" aria-hidden="true">
                <path
                  d="M2 6 C 20 1, 34 9, 52 5 S 84 1, 100 6 S 128 9, 138 4"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="icing-underline"
                />
              </svg>
              <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider font-semibold -mt-0.5">
                100% Veg Bakery · Demo City
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-primary)]" aria-label="Main Navigation">
            <Link href="/" className="hover:text-[var(--accent-primary)] transition-colors">
              Home
            </Link>
            {PRIMARY_LINKS.map(({ href, label, Icon, tint }) => (
              <Link key={href} href={href} className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors">
                <Icon className={`h-4 w-4 ${tint}`} />
                {label}
              </Link>
            ))}
            <Link
              href="/custom-cakes"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)] text-white font-semibold shadow-sm hover:bg-[#d6650f] hover:shadow-md transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Custom Cakes
            </Link>
            <Link
              href="/orders/track"
              className="flex items-center gap-1.5 hover:text-[var(--accent-primary)] transition-colors font-medium text-xs bg-[var(--bg-base)] px-3 py-1.5 rounded-full border border-[var(--border-default)]"
            >
              <Truck className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Track Order
            </Link>
          </nav>

          {/* Search, Cart & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder="Search cakes or flavors..."
                aria-label="Search cakes or flavors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-shadow"
              />
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            </form>

            <button
              onClick={onOpenCart}
              className="relative p-2 text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors rounded-full bg-[var(--bg-base)] border border-[var(--border-default)]"
              aria-label="Open Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--accent-primary)] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 text-[var(--text-primary)] rounded-full bg-[var(--bg-base)] border border-[var(--border-default)]"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <nav
            className="md:hidden pb-5 pt-1 border-t border-[var(--border-default)] flex flex-col gap-1 text-sm font-medium text-[var(--text-primary)] animate-fade-up"
            aria-label="Mobile Navigation"
          >
            <form onSubmit={handleSearchSubmit} className="relative my-3 sm:hidden">
              <input
                type="text"
                placeholder="Search cakes or flavors..."
                aria-label="Search cakes or flavors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            </form>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 border-b border-[var(--border-default)] hover:text-[var(--accent-primary)]">
              Home
            </Link>
            {PRIMARY_LINKS.map(({ href, label, Icon, tint }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 border-b border-[var(--border-default)] flex items-center gap-2 hover:text-[var(--accent-primary)]"
              >
                <Icon className={`h-4 w-4 ${tint}`} />
                {label}
              </Link>
            ))}
            <Link
              href="/custom-cakes"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-semibold"
            >
              <MessageCircle className="h-4 w-4" />
              Custom Cakes
            </Link>
            <Link
              href="/orders/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--border-default)] text-xs font-medium"
            >
              <Truck className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Track Order
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
