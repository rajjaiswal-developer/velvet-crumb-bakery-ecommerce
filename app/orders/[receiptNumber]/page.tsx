'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { CheckCircle2, MapPin, Phone, ShieldCheck, ShoppingBag, Cake, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import PaymentProcessingOverlay from '@/components/storefront/PaymentProcessingOverlay';
import { useOrderConfirmation, OrderItemData } from '@/lib/hooks/useOrderConfirmation';

export default function OrderConfirmationPage() {
  const params = useParams();
  const receiptNumber = params?.receiptNumber as string;

  const { order, loading, invoiceUrl, loadOrder } = useOrderConfirmation(receiptNumber);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
        <PaymentProcessingOverlay isVisible={loading} />

        {loading ? (
          <div className="py-24 text-center text-[#6B6B6B]">
            <p className="font-bold text-sm text-[#1B1F3B]">Securing your order confirmation...</p>
          </div>
        ) : !order || order.paymentStatus !== 'SUCCESS' ? (
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E8DCCB] shadow-sm text-center space-y-5 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto">
              <Cake className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-[#1B1F3B]">Payment Confirmation Pending</h1>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                No confirmed order was found for &quot;{receiptNumber}&quot; yet. If you recently completed payment, please allow a moment for confirmation or check order tracking.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadOrder(0)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F0791A] hover:bg-[#d6650f] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all"
              >
                Refresh Receipt
              </button>
              <Link
                href="/orders/track"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFF8F0] hover:bg-[#F5EFE6] text-[#1B1F3B] border border-[#E8DCCB] font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
              >
                Track Your Order
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DCCB] shadow-xl space-y-8">
            {/* Header Status */}
            <div className="text-center space-y-3 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#F0791A] block">
                Payment Successful & Order Confirmed
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1B1F3B]">
                Receipt #{order.receiptNumber}
              </h1>
              <div className="flex justify-center items-center gap-2 pt-1">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                  Status: {order.orderStatus || 'ORDER_RECEIVED'}
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                  Payment: {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Action Buttons Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#FFF8F0] rounded-2xl border border-[#E8DCCB]">
              <div className="text-xs text-[#1B1F3B]">
                <p className="font-bold">Need a physical copy for your records?</p>
                <p className="text-[#6B6B6B] text-[11px]">Download your itemized GST tax invoice below.</p>
              </div>
              <a
                href={invoiceUrl}
                download={`Invoice-${order.receiptNumber}.pdf`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F0791A] hover:bg-[#d6650f] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex-shrink-0"
              >
                <Download className="h-4 w-4" />
                Download PDF Invoice
              </a>
            </div>

            {/* Customer & Delivery Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#1B1F3B] bg-[#FFF8F0] p-5 rounded-2xl border border-[#E8DCCB]">
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#F0791A] flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> Customer Details
                </h3>
                <p><strong>Name:</strong> {order.customerName}</p>
                <p><strong>Mobile:</strong> {order.customerMobile}{order.alternatePhone ? ` (Alt: ${order.alternatePhone})` : ''}</p>
                <p><strong>Email:</strong> {order.customerEmail || 'No email provided'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#F0791A] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Delivery Info
                </h3>
                <p><strong>Address:</strong> {order.shippingAddress}</p>
                <p><strong>Time Slot:</strong> {order.deliveryTimeSlot || 'Within 2 Hours'}</p>
                {order.specialInstructions && (
                  <p><strong>Note:</strong> {order.specialInstructions}</p>
                )}
              </div>
            </div>

            {/* Purchased Items Table */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#1B1F3B] flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#F0791A]" />
                Purchased Cake Items
              </h3>

              <div className="border border-[#E8DCCB] rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
                {(order.items || []).map((item: OrderItemData) => (
                  <div key={item.variantId} className="p-4 flex justify-between items-center bg-white">
                    <div>
                      <p className="font-bold text-[#1B1F3B] text-sm">{item.productName}</p>
                      <p className="text-gray-500">{item.variantLabel} × {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#F0791A] text-sm">₹{item.itemTotal}</span>
                  </div>
                ))}

                <div className="p-4 bg-[#FFF8F0] flex justify-between items-center text-sm font-bold text-[#1B1F3B]">
                  <span>Total Amount Paid</span>
                  <span className="text-xl text-[#F0791A]">₹{Number(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Shop Assurance */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-green-700" />
                100% Eggless & Fresh Vegetarian Preparation
              </div>
              <p className="text-[11px] text-green-800">
                Our Demo City bakery team has received your order. We will contact your mobile number ({order.customerMobile}) prior to dispatch.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/categories/cakes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFF8F0] hover:bg-[#F5EFE6] text-[#1B1F3B] border border-[#E8DCCB] font-bold px-6 py-3 rounded-xl text-xs transition-all"
              >
                Continue Shopping
                <ArrowRight className="h-3.5 w-3.5 text-[#F0791A]" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-black text-white font-bold px-8 py-3 rounded-xl transition-all text-xs shadow-md"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

