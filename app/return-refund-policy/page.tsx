import type { Metadata } from 'next';
import LegalPageLayout from '@/components/storefront/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Velvet Crumb Bakery Demo City',
  description: 'Return and refund policy for freshly baked cakes and celebration items from Velvet Crumb Bakery.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/return-refund-policy',
  },
};

export default function ReturnRefundPolicyPage() {
  return (
    <LegalPageLayout>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="bg-[var(--bg-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-8 text-[var(--text-primary)]">
          <div>
            <span className="eyebrow block mb-1">
              Legal Information
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Return &amp; Refund Policy</h1>
            <p className="text-xs text-[var(--text-muted)] mt-2">Last Updated: July 2026</p>
          </div>

          <div className="prose prose-stone max-w-none text-sm text-[var(--text-muted)] leading-relaxed space-y-6">
            <p>
              Due to the perishable and food-grade nature of our freshly baked 100% vegetarian cakes and confectioneries delivered locally within our <strong>5 km delivery radius in Demo City</strong>, our return and refund policy is specifically structured to ensure food safety and quality assurance.
            </p>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">1. Perishable Goods — No Physical Returns</h2>
              <p>
                Once an order has been delivered within our 5 km coverage zone and accepted by the customer, physical returns of cakes, pastries, or food products cannot be accepted under any circumstances.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">2. Order Cancellation Policy</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Prior to Baking / Processing:</strong> You may request an order cancellation by contacting us immediately via phone/WhatsApp (+91 9999900000) before your order status advances to <em>Processing</em>. If cancelled in time, a full refund will be initiated to your original payment method.</li>
                <li><strong>After Processing / Baking Starts:</strong> Once our bakers have begun preparing your custom cake, cancellations cannot be accepted, and no refund will be issued.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">3. Damaged or Incorrect Goods Upon Delivery</h2>
              <p>
                We take extreme care in packaging and handling your orders. However, if your cake arrives severely damaged during transit or if an incorrect item was delivered:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Inspect your item immediately upon arrival in the presence of the delivery person.</li>
                <li>Take a clear photo/video of the damaged cake or wrong product.</li>
                <li>Contact us within <strong>1 hour of delivery</strong> at +91 9999900000 or via email at hello@velvetcrumbdemo.com along with your Receipt Number and photos.</li>
              </ol>
              <p>
                Upon verification, Velvet Crumb Bakery will offer either an immediate replacement item or a full/partial refund back to your original payment source via Razorpay.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">4. Refund Processing Timeline</h2>
              <p>
                Approved refunds are processed through Razorpay directly to your original payment method (Credit/Debit Card, Net Banking, or UPI). Refunds typically reflect in your account within 5–7 business days, depending on your bank processing speed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">5. Need Assistance?</h2>
              <p className="font-semibold text-[var(--text-primary)]">
                Velvet Crumb Bakery Support Team<br />
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
