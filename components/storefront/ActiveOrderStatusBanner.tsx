'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cake, ArrowRight, X } from 'lucide-react';

interface ActiveStatusData {
  receiptNumber: string;
  orderStatus: string;
}

export default function ActiveOrderStatusBanner() {
  const [activeOrder, setActiveOrder] = useState<ActiveStatusData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkActiveStatus() {
      try {
        const res = await fetch('/api/orders/active-status');
        const data = await res.json();
        if (data.success && data.active && data.data) {
          setActiveOrder(data.data);
        } else {
          setActiveOrder(null);
        }
      } catch (err) {
        console.error('Failed to fetch active order status:', err);
      }
    }

    checkActiveStatus();
  }, []);

  if (!activeOrder || dismissed) {
    return null;
  }

  const statusDisplayMap: Record<string, string> = {
    ORDER_RECEIVED: 'Order Received',
    PROCESSING: 'Baking & Processing',
    PACKAGING: 'Packaging',
    OUT_FOR_DELIVERY: 'Out for Delivery',
  };

  const statusLabel = statusDisplayMap[activeOrder.orderStatus] || activeOrder.orderStatus;

  return (
    <div className="bg-[#141414] text-white text-xs py-2 px-4 border-b border-[#2A2A2A] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-[#F0791A]/20 flex items-center justify-center text-[#F0791A] flex-shrink-0">
            <Cake className="h-3 w-3" />
          </div>
          <span className="truncate">
            <strong className="text-[#F0791A]">Active Order #{activeOrder.receiptNumber}:</strong>{' '}
            <span className="text-gray-200">{statusLabel}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={`/orders/track?receiptNumber=${encodeURIComponent(activeOrder.receiptNumber)}`}
            className="inline-flex items-center gap-1 bg-[#F0791A] hover:bg-[#d6650f] text-white px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm"
          >
            Track Order
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
