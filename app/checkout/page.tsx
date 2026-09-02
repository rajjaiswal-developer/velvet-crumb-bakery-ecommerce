'use client';

import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import CartDrawer from '@/components/storefront/CartDrawer';
import PaymentProcessingOverlay from '@/components/storefront/PaymentProcessingOverlay';
import {
  MapPin,
  Clock,
  User,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
  Edit3,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useCheckout } from '@/lib/hooks/useCheckout';
import { useAutoScrollToNotification } from '@/lib/hooks/useAutoScrollToNotification';

export default function CheckoutPage() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    loading,
    isConfirmingPayment,
    serviceableAreas,
    loadingAreas,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    confirmPhone,
    setConfirmPhone,
    alternatePhone,
    setAlternatePhone,
    flatBuilding,
    setFlatBuilding,
    street,
    setStreet,
    landmark,
    setLandmark,
    area,
    setArea,
    pincode,
    setPincode,
    city,
    getFormattedFullAddress,
    deliveryTimeSlot,
    setDeliveryTimeSlot,
    specialInstructions,
    setSpecialInstructions,
    radiusStatus,
    setRadiusStatus,
    handleCheckRadius,
    isReviewing,
    setIsReviewing,
    submitting,
    errorMessage,
    handleOpenReview,
    handleFinalSubmit,
    handleUpdateQuantity,
    handleRemoveItem,
  } = useCheckout();

  useAutoScrollToNotification(errorMessage || (radiusStatus.checked ? radiusStatus.message : null));

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <span className="eyebrow flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Guest Checkout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Checkout &amp; Order Confirmation
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Complete your delivery details to reserve your freshly baked vegetarian cakes.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)]">Loading checkout...</div>
        ) : cart.items.length === 0 ? (
          <div className="py-16 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">Your cart is empty</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
              Please add a cake to your cart before proceeding to checkout.
            </p>
            <Link
              href="/categories/cakes"
              className="inline-flex items-center gap-2 bg-[var(--accent-primary)] text-white font-bold px-6 py-2.5 rounded-xl text-xs"
            >
              Browse Cakes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 text-[var(--state-error)] text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleOpenReview} className="space-y-6">
                {/* 1. Customer Information */}
                <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[var(--bg-showcase)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                    <User className="h-4 w-4 text-[var(--accent-primary)]" />
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    {/* Double-entry phone field */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Mobile Number * (10 Digits)
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9999900000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Confirm Mobile Number * (Must Match)
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Re-enter 10-digit number"
                        value={confirmPhone}
                        onChange={(e) => setConfirmPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Alternate Phone Number (Optional) — in case we can&apos;t reach you on your primary number
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Optional 10-digit backup mobile number"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Double-entry ensures we call the correct primary mobile number to confirm delivery timing.
                  </p>
                </div>

                {/* 2. Shipping Address & Radius Validation */}
                <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[var(--bg-showcase)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <MapPin className="h-4 w-4 text-[var(--accent-primary)]" />
                    Delivery Address (Demo City 5 km Radius)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Flat/Building */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Flat / House No. &amp; Building Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={150}
                        placeholder="e.g. Flat 302, Sunshine Heights"
                        value={flatBuilding}
                        onChange={(e) => {
                          setFlatBuilding(e.target.value);
                          setRadiusStatus({ checked: false });
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Street / Road Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={150}
                        placeholder="e.g. 90 Feet Road, LBS Marg"
                        value={street}
                        onChange={(e) => {
                          setStreet(e.target.value);
                          setRadiusStatus({ checked: false });
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        placeholder="e.g. Near Garodia Hospital"
                        value={landmark}
                        onChange={(e) => {
                          setLandmark(e.target.value);
                          setRadiusStatus({ checked: false });
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    {/* Area Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        Area / Locality *
                      </label>
                      <select
                        required
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          setRadiusStatus({ checked: false });
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      >
                        {loadingAreas ? (
                          <option value="">Loading serviceable areas...</option>
                        ) : serviceableAreas.length === 0 ? (
                          <option value="">No serviceable areas available</option>
                        ) : (
                          serviceableAreas.map((loc) => (
                            <option key={loc.id} value={loc.name}>
                              {loc.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        PIN Code * (6-Digit Indian PIN)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 400077"
                        value={pincode}
                        onChange={(e) => {
                          setPincode(e.target.value.replace(/\D/g, ''));
                          setRadiusStatus({ checked: false });
                        }}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      />
                    </div>

                    {/* City (Fixed value "Mumbai") */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={city}
                        className="w-full px-3 py-2 bg-gray-100 border border-[var(--border-default)] rounded-xl text-xs text-gray-600 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>

                  {/* Formatted Address Preview */}
                  {(flatBuilding || street || area || pincode) && (
                    <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl space-y-1">
                      <p className="text-[11px] font-bold text-[var(--text-primary)]">Full Formatted Address Preview:</p>
                      <p className="text-xs text-[var(--accent-primary)] font-medium">{getFormattedFullAddress()}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCheckRadius}
                      disabled={radiusStatus.loading}
                      className="px-4 py-2 bg-[var(--bg-base)] hover:bg-black/5 text-[var(--text-primary)] border border-[var(--border-default)] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      {radiusStatus.loading ? 'Verifying Address...' : 'Verify 5 km Delivery Radius'}
                    </button>
                  </div>


                  {radiusStatus.checked && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        radiusStatus.isWithinRadius
                          ? 'bg-[var(--state-success)]/10 text-[var(--state-success)] border border-[var(--state-success)]/30'
                          : 'bg-[var(--state-error)]/10 text-[var(--state-error)] border border-[var(--state-error)]/30'
                      }`}
                    >
                      {radiusStatus.isWithinRadius ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      )}
                      {radiusStatus.message}
                    </div>
                  )}
                </div>

                {/* 3. Delivery Time Slot & Special Instructions */}
                <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[var(--bg-showcase)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
                    Delivery Time Slot &amp; Instructions
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                      Select Expected Delivery Window *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: '1-hour', label: 'Within 1 Hour' },
                        { id: '2-hours', label: 'Within 2 Hours' },
                        { id: '3-hours', label: 'Within 3 Hours' },
                        { id: '4-hours', label: 'Within 4 Hours' },
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setDeliveryTimeSlot(slot.id)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            deliveryTimeSlot === slot.id
                              ? 'bg-[var(--bg-showcase)] text-white border-[var(--bg-showcase)] shadow'
                              : 'bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Message on Cake / Special Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Write 'Happy Birthday Aarav!' on cake"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  Review Order &amp; Proceed to Payment
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Cart Summary Sidebar */}
            <div className="space-y-6">
              <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] shadow-sm space-y-4 lg:sticky lg:top-24">
                <h3 className="font-serif font-bold text-[var(--text-primary)] text-base border-b border-[var(--border-default)] pb-3 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-[var(--accent-primary)] font-semibold">{cart.itemCount} items</span>
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex items-center justify-between text-xs py-2 border-b border-[var(--border-default)]/60"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-[var(--text-primary)]">{item.productName}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {item.variantLabel} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-[var(--text-primary)]">₹{item.itemTotal}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-[var(--text-primary)]">
                    <span>Total Amount</span>
                    <span className="text-xl text-[var(--accent-primary)]">₹{cart.totalAmount}</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--accent-secondary)]/10 rounded-xl border border-[var(--accent-secondary)]/30 text-[#8a6a1f] text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Razorpay Secure Checkout:
                  </p>
                  <p>Stock will be atomically reserved for 15 minutes upon proceeding to payment.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Review Screen Modal */}
      {isReviewing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[var(--border-default)]">
            <div className="space-y-1">
              <span className="eyebrow">
                Confirm Phone &amp; Details
              </span>
              <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                We&apos;ll contact you at this number
              </h2>
            </div>

            <div className="p-4 bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30 rounded-2xl text-center space-y-1">
              <p className="text-xs text-[#8a6a1f] font-medium">Verified Phone Number:</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] tracking-wider">{phone}</p>
              <p className="text-[11px] text-[#8a6a1f]">
                Is this number correct? Our bakery team will call or WhatsApp this number regarding your cake order.
              </p>
            </div>

            <div className="space-y-2 text-xs text-[var(--text-muted)] bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-default)]">
              <p>
                <strong className="text-[var(--text-primary)]">Name:</strong> {name}
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Primary Mobile:</strong> {phone}
              </p>
              {alternatePhone && (
                <p>
                  <strong className="text-[var(--text-primary)]">Alternate Mobile:</strong> {alternatePhone}
                </p>
              )}
              <p>
                <strong className="text-[var(--text-primary)]">Email:</strong> {email || 'None provided'}
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Address:</strong> {getFormattedFullAddress()}
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Delivery Slot:</strong> {deliveryTimeSlot}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                className="flex-1 px-4 py-3 bg-[var(--bg-base)] hover:bg-black/5 text-[var(--text-primary)] border border-[var(--border-default)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {submitting ? 'Opening Razorpay...' : 'Pay with Razorpay'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <PaymentProcessingOverlay isVisible={isConfirmingPayment} />
    </div>
  );
}
