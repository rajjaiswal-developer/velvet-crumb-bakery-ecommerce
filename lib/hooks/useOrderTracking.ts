import { useState } from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, ShieldCheck } from 'lucide-react';

export interface StatusHistoryItem {
  id: string;
  status: string;
  createdAt: string;
}

export interface OrderTrackingData {
  receiptNumber: string;
  customerName: string;
  customerMobile: string;
  shippingAddress: string;
  deliveryTimeSlot?: string | null;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  currentStageIndex: number;
  items: Array<{
    variantId: string;
    productName: string;
    variantLabel: string;
    quantity: number;
    itemTotal: number;
  }>;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
}

export const STAGES = [
  { key: 'ORDER_RECEIVED', label: 'Order Received', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Baking & Processing', icon: Clock },
  { key: 'PACKAGING', label: 'Cake Packaging', icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: ShieldCheck },
];

export function useOrderTracking() {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);

  async function handleTrackOrder(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setTrackingData(null);

    if (!receiptNumber.trim()) {
      setErrorMessage('Please enter your Order Receipt Number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber, phone }),
      });

      const data = await res.json();
      if (data.success) {
        setTrackingData(data.data);
      } else {
        setErrorMessage(data.error || 'No matching order found for the provided receipt number and phone number.');
      }
    } catch {
      setErrorMessage('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return {
    receiptNumber,
    setReceiptNumber,
    phone,
    setPhone,
    loading,
    errorMessage,
    setErrorMessage,
    trackingData,
    STAGES,
    handleTrackOrder,
  };
}
