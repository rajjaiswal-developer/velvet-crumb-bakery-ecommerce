'use client';

import { useState } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useCart } from '@/lib/hooks/useCart';
import { useOrderTracking } from '@/lib/hooks/useOrderTracking';
import { useAutoScrollToNotification } from '@/lib/hooks/useAutoScrollToNotification';
import { Search, MapPin, ShoppingBag, AlertCircle } from 'lucide-react';

export default function OrderTrackingClient() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, handleUpdateQuantity, handleRemoveItem } = useCart();

  const {
    receiptNumber,
    setReceiptNumber,
    phone,
    setPhone,
    loading,
    errorMessage,
    trackingData,
    STAGES,
    handleTrackOrder,
  } = useOrderTracking();

  useAutoScrollToNotification(errorMessage);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <Breadcrumbs items={[{ label: 'Track Order', url: '/orders/track' }]} />

        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="eyebrow block">
            Real-Time Order Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Track Your Bakery Order
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Enter your Receipt Number and 10-digit Mobile Number to check your cake preparation status.
          </p>
        </div>

        {/* Tracking Search Form */}
        <div className="bg-[var(--bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] shadow-lg mb-10">
          {errorMessage && (
            <div className="p-4 mb-6 rounded-xl bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 text-[var(--state-error)] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleTrackOrder} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label htmlFor="track-receipt" className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Receipt Number *
              </label>
              <input
                id="track-receipt"
                type="text"
                required
                placeholder="e.g. CK-1785050611182-001"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="track-phone" className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Mobile Number *
              </label>
              <input
                id="track-phone"
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Results Card */}
        {trackingData && (
          <div className="bg-[var(--bg-surface)] p-6 sm:p-10 rounded-3xl border border-[var(--border-default)] shadow-xl space-y-8 animate-fade-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[var(--border-default)] gap-4">
              <div>
                <span className="eyebrow block">
                  Order Receipt Status
                </span>
                <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                  #{trackingData.receiptNumber}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Ordered by <strong>{trackingData.customerName}</strong> ({trackingData.customerMobile})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-[var(--state-success)]/15 text-[var(--state-success)] text-xs font-bold rounded-full">
                  Status: {trackingData.orderStatus}
                </span>
                <span className="px-3.5 py-1.5 bg-[var(--accent-secondary)]/15 text-[#8a6a1f] text-xs font-bold rounded-full">
                  Payment: {trackingData.paymentStatus}
                </span>
              </div>
            </div>

            {/* 5-Stage Timeline */}
            <div className="py-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-6">
                Preparation &amp; Delivery Progress
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isCompleted = idx <= trackingData.currentStageIndex;
                  const isCurrent = idx === trackingData.currentStageIndex;

                  return (
                    <div
                      key={stage.key}
                      className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${isCurrent
                        ? 'bg-[var(--bg-base)] border-[var(--accent-primary)] shadow-md'
                        : isCompleted
                          ? 'bg-[var(--state-success)]/5 border-[var(--state-success)]/30 text-[var(--state-success)]'
                          : 'bg-gray-50 border-gray-100 opacity-50'
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isCurrent
                          ? 'bg-[var(--accent-primary)] text-white shadow'
                          : isCompleted
                            ? 'bg-[var(--state-success)] text-white'
                            : 'bg-gray-200 text-gray-400'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="font-bold text-xs text-[var(--text-primary)] mb-0.5">{stage.label}</span>
                      <span className="text-[10px] text-gray-500">
                        {isCompleted ? (isCurrent ? (idx === STAGES.length - 1 ? 'Completed' : 'In Progress') : 'Completed') : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[var(--text-primary)] bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border-default)]">
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-[var(--accent-primary)] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Delivery Location
                </h4>
                <p><strong>Address:</strong> {trackingData.shippingAddress}</p>
                <p><strong>Window:</strong> {trackingData.deliveryTimeSlot || 'Within 2 Hours'}</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-[var(--accent-primary)] flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" /> Summary
                </h4>
                <p><strong>Items:</strong> {trackingData.items?.length || 0} cake item(s)</p>
                <p><strong>Total Amount Paid:</strong> <span className="font-bold text-[var(--accent-primary)]">₹{trackingData.totalAmount}</span></p>
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
