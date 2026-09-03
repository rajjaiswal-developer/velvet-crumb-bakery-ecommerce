import type { Metadata } from 'next';
import LegalPageLayout from '@/components/storefront/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Velvet Crumb Bakery Demo City',
  description: 'Privacy policy for Velvet Crumb Bakery e-commerce storefront in 12 Bakers Lane, Demo City.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-[var(--bg-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-8 text-[var(--text-primary)]">
          <div>
            <span className="eyebrow block mb-1">
              Legal Information
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-xs text-[var(--text-muted)] mt-2">Last Updated: July 2026</p>
          </div>

          <div className="prose prose-stone max-w-none text-sm text-[var(--text-muted)] leading-relaxed space-y-6">
            <p>
              At <strong>Velvet Crumb Bakery</strong> (located in 12 Bakers Lane, Demo City), we value your trust and are committed to protecting your privacy. This Privacy Policy explains how we handle your personal information when you browse our storefront, place a cake or celebration order, or interact with our services.
            </p>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">1. No Account Creation &amp; Guest Checkout</h2>
              <p>
                Velvet Crumb Bakery operates strictly on a guest-checkout model. We do not require or create customer accounts, user profiles, or store customer passwords. Your contact and delivery details are gathered strictly for fulfilling your individual order.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">2. Information We Collect</h2>
              <p>When placing an order, we collect only the necessary information to prepare and deliver your items:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Customer Name:</strong> To identify recipient for delivery.</li>
                <li><strong>Mobile Phone Number:</strong> Captured via double-entry confirmation. Used for delivery coordination and manual admin verification calls/WhatsApp messages prior to processing.</li>
                <li><strong>Email Address:</strong> Used solely to send transactional order receipts and payment status confirmations.</li>
                <li><strong>Delivery Address:</strong> Used strictly for geocoding address validation (5 km delivery radius from Demo City) and physical delivery.</li>
                <li><strong>Special Instructions:</strong> Optional notes regarding cake messages or delivery preferences.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">3. Payment Processing &amp; Security</h2>
              <p>
                All online payments are securely processed through <strong>Razorpay</strong>. Velvet Crumb Bakery does not collect, process, or store credit/debit card numbers, UPI PINs, net banking credentials, or wallet auth codes on our servers. Razorpay processes all transactions adhering to PCI-DSS standards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">4. How We Use Your Data</h2>
              <p>Your information is exclusively used for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Processing and fulfilling your bakery order.</li>
                <li>Validating your address within our 5 km delivery radius.</li>
                <li>Sending transactional email receipts via Brevo.</li>
                <li>Enabling order tracking via your unique Receipt Number and Phone Number.</li>
              </ul>
              <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">5. Data Retention &amp; Contact</h2>
              <p>
                Order records (receipt number, items, fulfillment status) are retained in our database for accounting and administrative verification. If you have questions regarding your data, contact us at:
              </p>
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
