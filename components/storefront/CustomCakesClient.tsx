'use client';

import { useState } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useCart } from '@/lib/hooks/useCart';
import { MessageCircle, Sparkles, ShieldCheck, Camera, Palette, Gift, Info } from 'lucide-react';

const THEME_CAKES_LIST = [
  'Regular Birthday cakes',
  'Engagement Cakes',
  'Wedding Cakes',
  'Anniversary Cakes',
  'Baby Shower Cakes',
  'Fondant Available Cakes',
  'Photo Available Cakes',
  'Photo Rolls Available Cakes',
  'Heart Shape Available Cakes',
  'Pinata with Hammer Available Cakes',
  'Barbie Doll Available Cakes',
  '1st Birthday cakes',
  'Advocate Themed Cakes',
  'Airplane Themed Cakes',
  'Alphabet Themed Cakes',
  'Artist Themed Cakes',
  'Avengers Design Cakes',
  'Among us Themed cakes',
  'Baby Shark Themed cakes',
  'Bike & Car lover Available Cakes',
  'Boss Baby Themed Available Cakes',
  'Bottle Shape Themed Available Cakes',
  'Box Gifted Available Cakes',
  'Butterflies Themed Available Cakes',
  'Cafe opening Themed Available Cakes',
  'Candyland Themed Available cakes',
  'Chotta Bheem Themed Available cakes',
  'Christmas Cakes Themed Available cakes',
  'Cocomelon Themed Available cakes',
  'Construction themed Available cakes',
  'Cricket Themed Available cakes',
  'Cute Elephant themed cakes',
  'Fathers day Themed Available cakes',
  'Football Theme Available cakes',
  'Fresh Flower Cakes design',
  'Fresh Mix Fruit cake',
  'Frozen Themed Cakes',
  'Gym Themed Cakes',
  'Haldi Rasam Themed Cakes',
  'Half year birthday Cakes',
  'Little Singham Themed cakes',
  'Mehendi Ceremony Themed cakes',
  'Mickey mouse Theme Cakes',
  'Mothers Day Themed Cakes',
  'Numbers Themed Cakes',
  'Rainbow Themed Cakes',
  'Teddy Bear Themed cakes',
  'Unicorn Themed cakes',
  'Valentine day Themed cakes',
  'Customized Available Cakes',
  'All Type theme cakes Available',
];

export default function CustomCakesClient() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, handleUpdateQuantity, handleRemoveItem } = useCart();

  const whatsappUrl = `https://wa.me/919999900000?text=${encodeURIComponent(
    'Hi Velvet Crumb Bakery, I would like to inquire about ordering a custom cake!'
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Breadcrumbs items={[{ label: 'Custom Cakes', url: '/custom-cakes' }]} />

        {/* Hero Banner */}
        <div className="bg-[var(--bg-showcase)] bg-showcase-grain text-white p-8 sm:p-12 rounded-3xl shadow-xl border border-white/5 text-center relative overflow-hidden mb-12">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Tailor-Made Pure Veg Cakes
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
              Custom Cake Orders
            </h1>
            <svg viewBox="0 0 140 10" className="w-28 h-2 mx-auto" aria-hidden="true">
              <path d="M2 6 C 20 1, 34 9, 52 5 S 84 1, 100 6 S 128 9, 138 4" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" className="icing-underline" />
            </svg>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Have a special design in mind for a birthday, wedding, or anniversary? We craft custom 100% vegetarian photo cakes, multi-tiered cakes, and personalized themes!
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F0791A]/20 border border-[#F0791A]/50 text-[#F0791A] text-xs font-bold shadow-sm">
                <Info className="h-3.5 w-3.5" />
                Accepting Minimum Order 2 KG
              </span>
            </div>

            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-green-500/20 transition-all text-base"
              >
                <MessageCircle className="h-6 w-6" />
                Order via WhatsApp Direct
              </a>
            </div>
            <p className="text-[11px] text-gray-400">
              Share your reference image or theme directly with our master baker on WhatsApp.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/12 flex items-center justify-center text-[var(--accent-primary)]">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="font-serif font-bold text-[var(--text-primary)] text-lg">Photo &amp; Print Cakes</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Edible high-resolution photo prints on delicious chocolate or vanilla cream cakes. Perfect for birthdays.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)]/15 flex items-center justify-center text-[var(--accent-secondary)]">
              <Palette className="h-6 w-6" />
            </div>
            <h3 className="font-serif font-bold text-[var(--text-primary)] text-lg">Custom Theme Designs</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Superhero, floral, cartoon, anniversary tier cakes, and elegant fondant finishes customized to your preference.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--state-success)]/12 flex items-center justify-center text-[var(--state-success)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-serif font-bold text-[var(--text-primary)] text-lg">100% Eggless Guarantee</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Every custom cake is baked fresh with pure vegetarian, eggless ingredients in our Demo City bakery.
            </p>
          </div>
        </div>

        {/* Minimum Order Prominent Callout Banner */}
        <div className="bg-[#FFF8F0] border-2 border-[#F0791A]/40 rounded-2xl p-5 sm:p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0791A]/10 border border-[#F0791A]/30 flex items-center justify-center text-[#F0791A] flex-shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#1B1F3B] text-sm sm:text-base">Custom Cake Order Terms</h4>
              <p className="text-xs text-[#6B6B6B]">All custom design, fondant, and themed cakes are freshly handcrafted to order.</p>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-[#F0791A] text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow">
            Note: Accepting Minimum Order 2 KG
          </div>
        </div>

        {/* Custom Cake Themes Catalog Grid */}
        <section className="mb-12">
          <div className="mb-6">
            <span className="text-xs uppercase font-bold tracking-widest text-[#F0791A]">Full Catalog</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1F3B] mt-1">Available Custom Cake Themes &amp; Designs</h2>
            <p className="text-xs text-[#6B6B6B] mt-1">Cakes are available for all occasions &amp; designs customized per customer requirements (Min. 2 KG)</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {THEME_CAKES_LIST.map((theme, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E8DCCB] hover:border-[#F0791A]/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-start gap-2 group"
              >
                <span className="text-[10px] font-mono text-gray-400 group-hover:text-[#F0791A] flex-shrink-0 mt-0.5">
                  {idx + 1}.
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#1B1F3B] leading-tight group-hover:text-[#F0791A] transition-colors">
                    {theme}
                  </p>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Min. 2 Kg</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WhatsApp Callout Box */}
        <div className="bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--border-default)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">
              Ready to create your dream cake?
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Click the button to open a direct chat with Velvet Crumb Bakery on WhatsApp (+91 9999900000).
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow"
          >
            <Gift className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
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
