import type { Metadata } from 'next';
import LegalPageLayout from '@/components/storefront/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Velvet Crumb Bakery Demo City',
  description: 'Terms and conditions for ordering eggless cakes from Velvet Crumb Bakery in 12 Bakers Lane, Demo City.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/terms-conditions',
  },
};

export default function TermsConditionsPage() {
  return (
    <LegalPageLayout>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-[var(--bg-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-8 text-[var(--text-primary)]">
          <div>
            <span className="eyebrow block mb-1">
              Legal Information
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Terms &amp; Conditions</h1>
            <p className="text-xs text-[var(--text-muted)] mt-2">Last Updated: July 2026</p>
          </div>

          <div className="prose prose-stone max-w-none text-sm text-[var(--text-muted)] leading-relaxed space-y-6">
            <p>
              Welcome to <strong>Velvet Crumb Bakery</strong>. By placing an order through our storefront at <strong>velvetcrumbdemo.com</strong>, you agree to comply with and be bound by the following terms and conditions.
            </p>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">1. 100% Vegetarian &amp; Eggless Guarantee</h2>
              <p>
                All cakes, pastries, and bakery items prepared by Velvet Crumb Bakery are guaranteed 100% eggless and pure vegetarian.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">2. 5 km Delivery Radius Enforcement</h2>
              <p>
                Velvet Crumb Bakery exclusively fulfills local deliveries within a strict <strong>5 km straight-line delivery radius</strong> originating from our shop in 12 Bakers Lane, Demo City.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Delivery eligibility is automatically verified during checkout using geocoding.</li>
                <li>Orders with addresses outside our 5 km radius will be blocked prior to payment.</li>
                <li>We do not offer nationwide or inter-city shipping.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">3. Payment &amp; Pricing</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>All prices listed on the site are in Indian Rupees (INR).</li>
                <li>Payments must be made in full online via <strong>Razorpay</strong> at checkout.</li>
                <li><strong>No Cash on Delivery (COD)</strong> is offered or accepted.</li>
                <li>Stock is reserved atomically for 15 minutes during payment completion. If payment is cancelled or fails, reserved inventory is released automatically.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">4. Order Verification &amp; Contact</h2>
              <p>
                To ensure accuracy, checkout requires double-entry phone number confirmation. Following payment, our bakery admin conducts a manual confirmation call or WhatsApp message before advancing your order status from <em>Order Received</em> to <em>Processing</em>. Please ensure your provided mobile number is reachable.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">5. Delivery Time Slots</h2>
              <p>
                Customers select an estimated delivery time slot (1-4 hours) during checkout. While we strive to meet all selected time slots, delays caused by traffic, adverse weather, or road conditions in Demo City/Mumbai may occasionally occur.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">6. Contact Information</h2>
              <p className="font-semibold text-[var(--text-primary)]">
                Velvet Crumb Bakery<br />
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
