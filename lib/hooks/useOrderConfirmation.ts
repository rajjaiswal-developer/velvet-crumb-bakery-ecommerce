import { useState, useEffect, useCallback } from 'react';

export interface OrderItemData {
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  itemTotal: number;
}

export interface OrderConfirmationData {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerMobile: string;
  alternatePhone?: string | null;
  customerEmail?: string | null;
  shippingAddress: string;
  deliveryTimeSlot?: string | null;
  specialInstructions?: string | null;
  items: OrderItemData[];
  totalAmount: number;
  orderStatus?: string | null;
  paymentStatus: string;
  createdAt: string;
}

export function useOrderConfirmation(receiptNumber: string) {
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(
    async (attempt = 0) => {
      if (!receiptNumber) return;
      setLoading(true);

      try {
        const res = await fetch(`/api/orders/public?receiptNumber=${encodeURIComponent(receiptNumber)}`);
        const data = await res.json();
        if (data.success && data.data?.paymentStatus === 'SUCCESS') {
          setOrder(data.data);
          setLoading(false);
        } else if (attempt < 5) {
          // Poll every 1s up to 5 attempts to allow webhook transaction to finalize
          setTimeout(() => {
            loadOrder(attempt + 1);
          }, 1000);
        } else {
          setOrder(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching order confirmation:', err);
        if (attempt < 5) {
          setTimeout(() => {
            loadOrder(attempt + 1);
          }, 1000);
        } else {
          setOrder(null);
          setLoading(false);
        }
      }
    },
    [receiptNumber]
  );

  useEffect(() => {
    loadOrder(0);
  }, [loadOrder]);

  const invoiceUrl = order ? `/api/orders/${order.id}/invoice?phone=${encodeURIComponent(order.customerMobile)}` : '';
  const whatsappUrl = order
    ? `https://wa.me/919999900000?text=${encodeURIComponent(
        `Hi Velvet Crumb Bakery, I have confirmed order receipt #${order.receiptNumber}.`
      )}`
    : '';

  return {
    order,
    loading,
    invoiceUrl,
    whatsappUrl,
    loadOrder,
  };
}
