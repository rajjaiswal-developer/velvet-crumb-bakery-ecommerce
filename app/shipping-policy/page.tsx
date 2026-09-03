import type { Metadata } from 'next';
import LegalPageLayout from '@/components/storefront/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Velvet Crumb Bakery Demo City',
  description: 'Shipping and delivery policy detailing 5 km radius delivery in 12 Bakers Lane, Demo City.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/shipping-policy',
  },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-[var(--bg-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-8 text-[var(--text-primary)]">
          <div>
            <span className="eyebrow block mb-1">
              Legal Information
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Shipping &amp; Delivery Policy</h1>
            <p className="text-xs text-[var(--text-muted)] mt-2">Last Updated: July 2026</p>
          </div>

          <div className="prose prose-stone max-w-none text-sm text-[var(--text-muted)] leading-relaxed space-y-6">
            <p>
              At <strong>Velvet Crumb Bakery</strong>, we take pride in delivering fresh, handcrafted 100% eggless cakes and celebration items safely to your doorstep.
            </p>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">1. 5 km Delivery Zone</h2>
              <p>
                We operate a local doorstep delivery service covering a <strong>5 km straight-line radius</strong> around our bakery location in 12 Bakers Lane, Demo City.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Delivery coverage includes Demo City, Demo City East, Vidyavihar, Kurla (East/West), and parts of Vikhroli.</li>
                <li>Delivery eligibility is automatically verified during checkout via Google Geocoding API and distance calculations.</li>
                <li>Addresses outside our 5 km radius cannot be serviced and will be rejected at checkout before payment.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">2. Free Local Delivery</h2>
              <p>
                All eligible orders within our 5 km delivery radius receive <strong>Free Local Delivery</strong>. There are no hidden delivery fees or added service surcharges at checkout.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">3. Time Slot Options &amp; Same-Day Delivery</h2>
              <p>
                During checkout, you can select your preferred delivery time slot (1, 2, 3, or 4 hours from order placement).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Orders are prepared fresh on the day of delivery.</li>
                <li>Operating delivery hours are <strong>10:00 AM – 10:00 PM Daily</strong>.</li>
                <li>Our team conducts a confirmation call/WhatsApp message before sending out your order.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">4. Order Tracking</h2>
              <p>
                Upon payment confirmation, you receive a unique Receipt Number (e.g. <code>CK202607220001</code>). You can track your real-time fulfillment status (Order Received → Processing → Packaging → Out for Delivery → Delivered) at any time using our <a href="/orders/track" className="text-[var(--accent-primary)] underline font-semibold">Track Order</a> page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">5. Questions About Delivery?</h2>
              <p className="font-semibold text-[var(--text-primary)]">
                Velvet Crumb Bakery Dispatch<br />
                12 Bakers Lane, Demo City<br />
                Email: hello@velvetcrumbdemo.com | Phone: +91 9999900000
              </p>
            </section>
          </div>
        </div>
      </main>
    </LegalPageLayout>
  );
}
