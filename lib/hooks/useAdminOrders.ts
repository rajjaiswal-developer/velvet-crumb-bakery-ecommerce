'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OrderItemProduct {
  id?: string;
  productId: string;
  variantId: string;
  productName?: string;
  name?: string;
  variantLabel?: string;
  label?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderItem {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerMobile: string;
  alternatePhone?: string | null;
  customerEmail?: string | null;
  shippingAddress: string;
  deliveryTimeSlot?: string | null;
  specialInstructions?: string | null;
  items?: OrderItemProduct[];
  totalAmount: number;
  paymentStatus: string;
  orderStatus?: string | null;
  createdAt: string;
}

export const NEXT_STAGE_MAP: Record<string, string> = {
  ORDER_RECEIVED: 'PROCESSING',
  PROCESSING: 'PACKAGING',
  PACKAGING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

export function useAdminOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'SUCCESS' | 'ALL' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'CANCELLED'>('SUCCESS');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState('');

  const loadOrders = useCallback(async (targetPage?: number | unknown) => {
    try {
      const pageNum = typeof targetPage === 'number' ? targetPage : undefined;
      const p = pageNum !== undefined ? pageNum : page;
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(pageSize));
      if (orderSearch) params.set('search', orderSearch);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalOrders(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }, [orderSearch, paymentFilter, page, pageSize]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearchChange = (search: string) => {
    setOrderSearch(search);
    setPage(1);
  };

  const handlePaymentFilterChange = (filter: 'SUCCESS' | 'ALL' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'CANCELLED') => {
    setPaymentFilter(filter);
    setPage(1);
  };

  async function handleAdvanceOrderStatus(orderId: string, currentStatus?: string | null) {
    if (processingOrderId) return;
    const status = currentStatus || 'ORDER_RECEIVED';
    const nextStatus = NEXT_STAGE_MAP[status];
    if (!nextStatus) return;

    setProcessingOrderId(orderId);
    setOrderMessage('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderMessage(`Order #${data.data.receiptNumber} status advanced to ${nextStatus}!`);
        loadOrders();
      } else {
        setOrderMessage(`Error advancing order: ${data.error}`);
      }
    } catch {
      setOrderMessage('Error advancing order status.');
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (processingOrderId) return;
    if (!confirm('Are you sure you want to cancel this pending order and release its reserved stock?')) {
      return;
    }
    setProcessingOrderId(orderId);
    setOrderMessage('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderMessage(`Order #${data.data?.receiptNumber || orderId} cancelled and reserved stock released!`);
        loadOrders();
      } else {
        setOrderMessage(`Error cancelling order: ${data.error}`);
      }
    } catch {
      setOrderMessage('Error cancelling order.');
    } finally {
      setProcessingOrderId(null);
    }
  }

  return {
    orders,
    orderSearch,
    setOrderSearch: handleSearchChange,
    paymentFilter,
    setPaymentFilter: handlePaymentFilterChange,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalOrders,
    processingOrderId,
    orderMessage,
    setOrderMessage,
    loadOrders,
    handleAdvanceOrderStatus,
    handleCancelOrder,
  };
}

