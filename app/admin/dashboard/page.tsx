'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/admin/LoadingOverlay';

import { useAdminCategories } from '@/lib/hooks/useAdminCategories';
import { useAdminFlavors } from '@/lib/hooks/useAdminFlavors';
import { useAdminProducts } from '@/lib/hooks/useAdminProducts';
import { useAdminOrders, NEXT_STAGE_MAP, OrderItemProduct } from '@/lib/hooks/useAdminOrders';
import { useAdminShopSettings } from '@/lib/hooks/useAdminShopSettings';
import { useAdminServiceableAreas } from '@/lib/hooks/useAdminServiceableAreas';
import { useAutoScrollToNotification } from '@/lib/hooks/useAutoScrollToNotification';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'categories' | 'flavors' | 'products' | 'shop' | 'areas'>('orders');

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Hook composition
  const {
    products,
    prodSearchQuery,
    setProdSearchQuery,
    prodCategoryFilter,
    setProdCategoryFilter,
    editingProductId,
    prodName,
    setProdName,
    prodSlug,
    setProdSlug,
    prodCatId,
    setProdCatId,
    prodDesc,
    setProdDesc,
    prodFlavor,
    setProdFlavor,
    prodIsFeatured,
    setProdIsFeatured,
    prodImages,
    uploadingImage,
    formVariants,
    isSubmittingProd,
    deletingProdId,
    permanentDeletingProdId,
    checkingOrderRefsProdId,
    prodMessage,
    filteredProducts,
    loadProducts,
    handleImageUpload,
    handleRemoveImage,
    handleAddVariantRow,
    handleRemoveVariantRow,
    handleVariantChange,
    resetProductForm,
    handleEditProduct,
    handleDeleteProduct,
    handlePermanentDeleteProduct,
    handleSaveProduct,
  } = useAdminProducts();

  const {
    categories,
    catName,
    setCatName,
    catSlug,
    setCatSlug,
    catType,
    setCatType,
    catParentId,
    setCatParentId,
    isSubmittingCat,
    deletingCatId,
    catMessage,
    loadCategories,
    handleCreateCategory,
    handleDeleteCategory,
  } = useAdminCategories();

  const {
    flavors,
    flavorName,
    setFlavorName,
    editingFlavorId,
    setEditingFlavorId,
    editingFlavorName,
    setEditingFlavorName,
    deletingFlavorId,
    isSubmittingFlavor,
    isSubmittingEditFlavor,
    flavorMessage,
    loadFlavors,
    handleCreateFlavor,
    handleStartEditFlavor,
    handleSaveEditFlavor,
    handleDeleteFlavor: handleDeleteFlavorHook,
  } = useAdminFlavors(loadProducts);

  const {
    orders,
    orderSearch,
    setOrderSearch,
    paymentFilter,
    setPaymentFilter,
    page,
    setPage,
    pageSize,
    totalPages,
    totalOrders,
    processingOrderId,
    orderMessage,
    loadOrders,
    handleAdvanceOrderStatus,
    handleCancelOrder,
  } = useAdminOrders();

  const {
    shopSettings,
    isTogglingShop,
    shopMessage,
    loadShopSettings,
    handleToggleShopStatus,
  } = useAdminShopSettings();

  const {
    areas,
    areaName,
    setAreaName,
    editingAreaId,
    setEditingAreaId,
    editingAreaName,
    setEditingAreaName,
    deletingAreaId,
    togglingAreaId,
    isSubmittingArea,
    isSubmittingEditArea,
    areaMessage,
    loadAreas,
    handleCreateArea,
    handleStartEditArea,
    handleSaveEditArea,
    handleToggleAreaActive,
    handleDeleteArea,
  } = useAdminServiceableAreas();

  const message = prodMessage || catMessage || flavorMessage || orderMessage || shopMessage || areaMessage;

  useAutoScrollToNotification(message);


  // Real-time polling & audio notification state
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const lastPollTimestampRef = useRef<string | null>(null);

  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn('Audio playback failed or restricted:', err);
    }
  }, []);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleEnableAudio = () => {
    setAudioEnabled(true);
    playNotificationChime();
  };

  // Consolidated lightweight single-request poll check (12 seconds)
  const pollLightweight = useCallback(async () => {
    try {
      const url = lastPollTimestampRef.current
        ? `/api/admin/orders/poll?since=${encodeURIComponent(lastPollTimestampRef.current)}`
        : '/api/admin/orders/poll';
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) return;

      if (!lastPollTimestampRef.current) {
        lastPollTimestampRef.current = data.timestamp;
        return;
      }

      lastPollTimestampRef.current = data.timestamp;

      if (Array.isArray(data.newPaidOrderIds) && data.newPaidOrderIds.length > 0) {
        if (audioEnabled) {
          playNotificationChime();
        }
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          data.newPaidOrderIds.forEach((id: string) => next.add(id));
          return next;
        });
        loadOrders();
      } else if (data.hasChanges) {
        // Perform silent background refresh of visible page
        loadOrders();
      }
    } catch (err) {
      console.error('Failed to perform lightweight poll check:', err);
    }
  }, [audioEnabled, loadOrders, playNotificationChime]);

  // Polling scoped ONLY to Orders tab
  useEffect(() => {
    if (activeTab !== 'orders') return;

    pollLightweight();

    const intervalId = setInterval(() => {
      pollLightweight();
    }, 12000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeTab, pollLightweight]);


  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAdminEmail(data.data.email);
        } else {
          router.push('/admin/login');
        }
      });
    loadCategories();
    loadFlavors();
    loadProducts();
    loadOrders();
    loadShopSettings();
    loadAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  const handleDeleteFlavor = (f: Parameters<typeof handleDeleteFlavorHook>[0]) => {
    handleDeleteFlavorHook(f, products);
  };

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => !!c.parentId);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <header className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Velvet Crumb Bakery Admin</h1>
          <p className="text-xs text-[var(--text-muted)]">Logged in as {adminEmail}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs bg-[var(--bg-surface)] px-3 py-1.5 rounded-xl border border-[var(--border-default)]">
            <span className={`w-2.5 h-2.5 rounded-full ${shopSettings.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-bold">{shopSettings.isOpen ? 'Bakery Open' : 'Bakery Closed'}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {message && (
        <div className="mb-6 p-3 bg-amber-100 border border-amber-300 text-amber-900 text-xs rounded-xl font-medium">
          {message}
        </div>
      )}

      {/* Tabs Nav */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-default)] pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'orders' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Orders & Fulfillment ({totalOrders})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'categories' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('flavors')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'flavors' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Flavors ({flavors.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'products' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'shop' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Shop Status Settings
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'areas' ? 'bg-[var(--bg-showcase)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-gray-100'
          }`}
        >
          Serviceable Areas ({areas.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)] flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search receipt #, customer name or phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs w-64 focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">Filter:</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as 'SUCCESS' | 'ALL' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'CANCELLED')}
                  className="px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="SUCCESS">Confirmed Paid Orders (Default)</option>
                  <option value="ALL">All Orders (Including Phantom/Failed)</option>
                  <option value="PENDING">Pending Payment</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableAudio}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  audioEnabled
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
                title={audioEnabled ? 'Order sound notifications are active' : 'Click once to enable sound alerts for new orders'}
              >
                {audioEnabled ? '🔊 Sound Enabled' : '🔔 Enable Sound Alerts'}
              </button>
              <button
                onClick={() => {
                  loadOrders();
                  pollLightweight();
                }}
                className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Refresh Orders
              </button>
            </div>
          </div>

          <LoadingOverlay isLoading={!!processingOrderId} message="Updating order fulfillment status..." className="rounded-2xl">
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-base)] border-b border-[var(--border-default)] text-[var(--text-primary)] font-bold">
                  <tr>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3">Fulfillment Status</th>
                    <th className="p-3 text-right">Fulfillment / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        No orders found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const currentStatus = o.orderStatus || 'ORDER_RECEIVED';
                      const nextStage = NEXT_STAGE_MAP[currentStatus];
                      const isSuccess = o.paymentStatus === 'SUCCESS';
                      const isExpanded = expandedOrderIds.has(o.id);
                      const isNewOrder = newOrderIds.has(o.id);

                      let paymentBadgeColor = 'bg-amber-100 text-amber-800';
                      if (o.paymentStatus === 'SUCCESS') paymentBadgeColor = 'bg-green-100 text-green-800';
                      else if (o.paymentStatus === 'FAILED') paymentBadgeColor = 'bg-red-100 text-red-800';
                      else if (o.paymentStatus === 'EXPIRED') paymentBadgeColor = 'bg-gray-100 text-gray-700';
                      else if (o.paymentStatus === 'CANCELLED') paymentBadgeColor = 'bg-rose-100 text-rose-800';

                      return (
                        <Fragment key={o.id}>
                          <tr className={`hover:bg-amber-50/30 transition-colors ${isNewOrder ? 'bg-emerald-50/50' : ''}`}>
                            <td className="p-3 font-bold text-[var(--text-primary)]">
                              <div className="flex items-center gap-1.5">
                                <span>{o.receiptNumber}</span>
                                {isNewOrder && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-bold animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleOrderExpand(o.id)}
                                className="mt-1 text-[11px] text-[var(--accent-primary)] hover:underline font-bold flex items-center gap-1"
                              >
                                {isExpanded ? '▲ Hide Details' : '▼ Details'}
                              </button>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-[var(--text-primary)]">{o.customerName}</p>
                              <p className="text-[11px] text-gray-600 font-medium">
                                Primary: {o.customerMobile}
                                {o.alternatePhone ? ` | Alt: ${o.alternatePhone}` : ''}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {o.customerEmail ? (
                                  o.customerEmail
                                ) : (
                                  <span className="italic text-gray-400">No email provided</span>
                                )}
                              </p>
                            </td>
                            <td className="p-3 font-bold text-[var(--accent-primary)]">₹{o.totalAmount}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentBadgeColor}`}
                              >
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              {isSuccess ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                                  {currentStatus}
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {isSuccess && nextStage ? (
                                <button
                                  onClick={() => handleAdvanceOrderStatus(o.id, o.orderStatus)}
                                  disabled={!!processingOrderId}
                                  className="bg-[var(--bg-showcase)] hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingOrderId === o.id ? 'Updating...' : `Advance to: ${nextStage}`}
                                </button>
                              ) : isSuccess && !nextStage ? (
                                <span className="text-[11px] font-bold text-green-600">✓ Delivered</span>
                              ) : o.paymentStatus === 'PENDING' ? (
                                <button
                                  onClick={() => handleCancelOrder(o.id)}
                                  disabled={!!processingOrderId}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl font-bold text-[11px] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingOrderId === o.id ? 'Cancelling...' : 'Cancel & Release Stock'}
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400">{o.paymentStatus}</span>
                              )}
                            </td>
                          </tr>

                          {/* EXPANDABLE ORDER DETAILS SUB-ROW */}
                          {isExpanded && (
                            <tr className="bg-amber-50/60 border-b border-amber-200">
                              <td colSpan={6} className="p-4 space-y-3 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[var(--text-primary)] mb-1">📍 Delivery Address</p>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{o.shippingAddress || 'No address specified'}</p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[var(--text-primary)] mb-1">⏰ Delivery Time Slot</p>
                                    <p className="text-gray-700 font-medium">{o.deliveryTimeSlot || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[var(--text-primary)] mb-1">📝 Special Instructions</p>
                                    {o.specialInstructions ? (
                                      <p className="text-gray-700 whitespace-pre-wrap italic bg-amber-50 p-2 rounded-lg border border-amber-100">{o.specialInstructions}</p>
                                    ) : (
                                      <p className="italic text-gray-400">None provided</p>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
                                  <p className="font-bold text-[var(--text-primary)] mb-2">📦 Ordered Items ({Array.isArray(o.items) ? o.items.length : 0})</p>
                                  {Array.isArray(o.items) && o.items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                                            <th className="pb-1.5">Item</th>
                                            <th className="pb-1.5">Variant</th>
                                            <th className="pb-1.5 text-center">Qty</th>
                                            <th className="pb-1.5 text-right">Price</th>
                                            <th className="pb-1.5 text-right">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {o.items.map((item: OrderItemProduct, idx: number) => {
                                            const itemName = item.productName || item.name || 'Product';
                                            const variantLabel = item.variantLabel || item.label || 'Standard';
                                            const qty = item.quantity || 1;
                                            const price = Number(item.price || 0);
                                            const subtotal = price * qty;
                                            return (
                                              <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-1.5 font-bold text-gray-800">{itemName}</td>
                                                <td className="py-1.5 text-gray-600 font-medium">{variantLabel}</td>
                                                <td className="py-1.5 text-center font-bold text-gray-700">{qty}</td>
                                                <td className="py-1.5 text-right text-gray-600">₹{price.toFixed(2)}</td>
                                                <td className="py-1.5 text-right font-bold text-[var(--accent-primary)]">₹{subtotal.toFixed(2)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 italic">No item details recorded for this order.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* PAGINATION CONTROLS */}
              {totalOrders > 0 && (
                <div className="p-3 bg-[var(--bg-base)] border-t border-[var(--border-default)] flex flex-wrap justify-between items-center text-xs font-medium text-[var(--text-primary)] gap-2">
                  <div>
                    Showing <span className="font-bold">{Math.min((page - 1) * pageSize + 1, totalOrders)}</span> to{' '}
                    <span className="font-bold">{Math.min(page * pageSize, totalOrders)}</span> of{' '}
                    <span className="font-bold">{totalOrders}</span> orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Previous
                    </button>
                    <span className="font-[#d6650f] text-[11px] font-bold px-2.5 py-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </LoadingOverlay>
        </div>
      )}

      {/* CATEGORIES TAB (TOP-LEVEL & SUBCATEGORIES) */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingOverlay isLoading={isSubmittingCat} message="Saving category..." className="rounded-2xl">
            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Create Category / Subcategory</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Parent Category (Leave empty for Top-Level)
                  </label>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    disabled={isSubmittingCat || !!deletingCatId}
                    className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs font-bold text-[var(--text-primary)] disabled:opacity-60"
                  >
                    <option value="">None (Top-Level Category e.g. Cakes)</option>
                    {topLevelCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        Parent: {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Category / Subcategory Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Birthday Cakes"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    disabled={isSubmittingCat || !!deletingCatId}
                    className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. birthday-cakes"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    disabled={isSubmittingCat || !!deletingCatId}
                    className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Type</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as 'CAKE' | 'CELEBRATION')}
                    disabled={isSubmittingCat || !!deletingCatId}
                    className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs disabled:opacity-60"
                  >
                    <option value="CAKE">CAKE</option>
                    <option value="CELEBRATION">CELEBRATION</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingCat || !!deletingCatId}
                  className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-2 rounded-xl text-xs shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmittingCat ? 'Saving...' : 'Save Category'}
                </button>
              </form>
            </div>
          </LoadingOverlay>

          <LoadingOverlay isLoading={!!deletingCatId} message="Deleting category..." className="rounded-2xl">
            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Category Hierarchy Tree</h2>
              <div className="space-y-4 text-xs">
                {topLevelCategories.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No categories created yet.</p>
                ) : (
                  topLevelCategories.map((top) => {
                    const children = subCategories.filter((sub) => sub.parentId === top.id);
                    return (
                      <div key={top.id} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] space-y-2">
                        <div className="flex justify-between items-center font-bold text-[var(--text-primary)] text-xs">
                          <span>
                            📁 Top-Level: {top.name} ({top.type})
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">/{top.slug}</span>
                            <button
                              onClick={() => handleDeleteCategory(top.id, top.name)}
                              disabled={!!deletingCatId || isSubmittingCat}
                              className="text-red-600 hover:text-red-800 font-bold text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingCatId === top.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {/* Subcategories list */}
                        {children.length > 0 ? (
                          <div className="pl-4 space-y-1.5 border-l-2 border-[var(--accent-primary)]/30 mt-2">
                            {children.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex justify-between items-center p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]"
                              >
                                <span className="font-semibold text-[var(--text-primary)]">
                                  └ 📄 Subcategory: {sub.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400">/{sub.slug}</span>
                                  <button
                                    onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                    disabled={!!deletingCatId || isSubmittingCat}
                                    className="text-red-600 hover:text-red-800 font-bold text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingCatId === sub.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="pl-4 text-[11px] text-gray-400 italic">No subcategories under this parent yet.</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </LoadingOverlay>
        </div>
      )}

      {/* FLAVORS TAB */}
      {activeTab === 'flavors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingOverlay isLoading={isSubmittingFlavor} message="Saving flavor..." className="rounded-2xl">
            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Create Flavor</h2>
              <form onSubmit={handleCreateFlavor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Flavor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chocolate Truffle"
                    value={flavorName}
                    onChange={(e) => setFlavorName(e.target.value)}
                    disabled={isSubmittingFlavor}
                    className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingFlavor}
                  className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-2 rounded-xl text-xs shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmittingFlavor ? 'Saving...' : 'Save Flavor'}
                </button>
              </form>
            </div>
          </LoadingOverlay>

          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
            <h2 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Existing Flavors ({flavors.length})</h2>
            <ul className="space-y-2 text-xs">
              {flavors.map((f) => {
                const count = f._count?.products ?? products.filter((p) => p.flavorId === f.id || p.flavor?.id === f.id).length;
                const isEditing = editingFlavorId === f.id;

                return (
                  <li key={f.id} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] font-bold">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingFlavorName}
                          onChange={(e) => setEditingFlavorName(e.target.value)}
                          disabled={isSubmittingEditFlavor}
                          className="flex-1 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-xs font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditFlavor(f.id)}
                          disabled={isSubmittingEditFlavor || !editingFlavorName.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold disabled:opacity-50"
                        >
                          {isSubmittingEditFlavor ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingFlavorId(null); setEditingFlavorName(''); }}
                          disabled={isSubmittingEditFlavor}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-primary)]">{f.name}</span>
                          <span className="text-[10px] font-normal text-gray-500 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                            {count} product(s)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditFlavor(f)}
                            disabled={!!deletingFlavorId || isSubmittingFlavor || isSubmittingEditFlavor}
                            className="bg-[var(--bg-showcase)] hover:bg-black text-white px-2 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFlavor(f)}
                            disabled={!!deletingFlavorId || isSubmittingFlavor || isSubmittingEditFlavor}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                          >
                            {deletingFlavorId === f.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PRODUCT FORM (CREATE / EDIT) */}
          <div className="lg:col-span-7">
            <LoadingOverlay
              isLoading={isSubmittingProd || uploadingImage}
              message={uploadingImage ? 'Uploading to ImageKit...' : editingProductId ? 'Updating product...' : 'Creating product...'}
              className="rounded-2xl"
            >
              <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-[var(--text-primary)] text-sm">
                    {editingProductId ? `Edit Product (ID: ${editingProductId.substring(0, 8)}...)` : 'Create New Product'}
                  </h2>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                      className="text-xs text-red-600 hover:text-red-800 font-bold underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Edit & Reset
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[var(--text-primary)] mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[var(--text-primary)] mb-1">Slug</label>
                      <input
                        type="text"
                        required
                        value={prodSlug}
                        onChange={(e) => setProdSlug(e.target.value)}
                        disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[var(--text-primary)] mb-1">
                        Subcategory (Product Assignment)
                      </label>
                      <select
                        required
                        value={prodCatId}
                        onChange={(e) => setProdCatId(e.target.value)}
                        disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl font-medium disabled:opacity-60"
                      >
                        <option value="">Select Subcategory</option>
                        {topLevelCategories.map((top) => {
                          const subs = subCategories.filter((s) => s.parentId === top.id);
                          return (
                            <optgroup key={top.id} label={`Category: ${top.name}`}>
                              {subs.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {top.name} › {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[var(--text-primary)] mb-1">Flavor (Optional)</label>
                      <select
                        value={prodFlavor}
                        onChange={(e) => setProdFlavor(e.target.value)}
                        disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                        className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl disabled:opacity-60"
                      >
                        <option value="">None / Standard</option>
                        {flavors.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1">Description</label>
                    <textarea
                      required
                      rows={2}
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                      className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl disabled:opacity-60"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="featuredToggle"
                      checked={prodIsFeatured}
                      onChange={(e) => setProdIsFeatured(e.target.checked)}
                      disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                      className="rounded text-[var(--accent-primary)]"
                    />
                    <label htmlFor="featuredToggle" className="font-bold text-[var(--text-primary)]">
                      Featured in Homepage Hero
                    </label>
                  </div>

                  {/* IMAGE UPLOAD UI SECTION (IMAGEKIT BACKED) */}
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-2">
                    <label className="block font-bold text-[var(--text-primary)]">
                      Product Photography (ImageKit File Upload)
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Upload genuine image files (JPEG, PNG, WEBP, GIF up to 5 MB). Validated via Phase 6 magic-byte inspection.
                    </p>

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingImage || isSubmittingProd || !!deletingProdId}
                        onChange={handleImageUpload}
                        className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--bg-showcase)] file:text-white hover:file:bg-black file:cursor-pointer cursor-pointer disabled:opacity-50"
                      />
                      {uploadingImage && (
                        <span className="text-xs text-[var(--accent-primary)] font-bold animate-pulse">
                          Uploading to ImageKit...
                        </span>
                      )}
                    </div>

                    {prodImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {prodImages.map((imgItem, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border-default)] aspect-square bg-gray-100">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img src={imgItem.url} alt={`Product ${idx}`} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow disabled:opacity-50"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DYNAMIC MULTI-VARIANT MANAGER SECTION */}
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">Product Variants (Weights & Sizes)</p>
                        <p className="text-[11px] text-gray-500">Add multiple variants with independent pricing & stock quantity.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                        className="bg-[var(--bg-showcase)] hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow disabled:opacity-50"
                      >
                        + Add Variant Row
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formVariants.map((varRow, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)]">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Label (e.g. 500g, 1kg)</label>
                              <input
                                type="text"
                                required
                                placeholder="Variant Label"
                                value={varRow.label}
                                onChange={(e) => handleVariantChange(idx, 'label', e.target.value)}
                                disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                                className="w-full px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-xs disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Price (₹)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="1"
                                placeholder="Price"
                                value={varRow.price}
                                onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                                className="w-full px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-xs disabled:opacity-60"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 font-bold mb-0.5">
                                Stock Qty {varRow.reservedQuantity ? `(${varRow.reservedQuantity} Reserved)` : ''}
                              </label>
                              <input
                                type="number"
                                required
                                min={varRow.reservedQuantity || 0}
                                step="1"
                                placeholder="Stock"
                                value={varRow.stockQuantity}
                                onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                                disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                                className="w-full px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-xs disabled:opacity-60"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            disabled={formVariants.length <= 1 || isSubmittingProd || uploadingImage || !!deletingProdId}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-300 font-bold text-xs px-2 py-1"
                            title="Delete variant"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingProd || uploadingImage || !!deletingProdId}
                    className="w-full bg-[var(--accent-primary)] hover:bg-[#d6650f] text-white font-bold py-2.5 rounded-xl shadow mt-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingProd ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                  </button>
                </form>
              </div>
            </LoadingOverlay>
          </div>

          {/* EXISTING PRODUCTS LIST WITH EDIT & DELETE ACTIONS */}
          <div className="lg:col-span-5">
            <LoadingOverlay isLoading={!!deletingProdId} message="Deleting product..." className="rounded-2xl">
              <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold text-[var(--text-primary)] text-sm">
                    Existing Products ({filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''})
                  </h2>
                </div>

                {/* SEARCH & FILTER CONTROLS (TASK 1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-primary)] mb-0.5">Search Products</label>
                    <input
                      type="text"
                      placeholder="Search name or slug..."
                      value={prodSearchQuery}
                      onChange={(e) => setProdSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-primary)] mb-0.5">Filter by Subcategory</label>
                    <select
                      value={prodCategoryFilter}
                      onChange={(e) => setProdCategoryFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl text-xs"
                    >
                      <option value="">All Categories & Subcategories</option>
                      {topLevelCategories.map((top) => {
                        const subs = subCategories.filter((s) => s.parentId === top.id);
                        return (
                          <optgroup key={top.id} label={`Category: ${top.name}`}>
                            <option value={top.id}>All {top.name}</option>
                            {subs.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {top.name} › {sub.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <ul className="space-y-3 text-xs max-h-[750px] overflow-y-auto pr-1">
                  {filteredProducts.length === 0 ? (
                    <li className="p-4 text-center text-gray-400 italic bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)]">
                      No products found matching filters.
                    </li>
                  ) : (
                    filteredProducts.map((p) => {
                      let thumb = '';
                      if (Array.isArray(p.images) && p.images.length > 0) {
                        const first = p.images[0];
                        thumb = typeof first === 'string' ? first : (first as { url: string })?.url || '';
                      }

                      const catNameDisplay = p.category?.parent
                        ? `${p.category.parent.name} › ${p.category.name}`
                        : p.category?.name || 'N/A';

                      return (
                        <li key={p.id} className={`p-3 rounded-xl border space-y-2 ${p.isDeleted ? 'bg-red-50/60 border-red-200/80 opacity-75' : 'bg-[var(--bg-base)] border-[var(--border-default)]'}`}>
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              /* eslint-disable-next-html-element-suppression */
                              <img src={thumb} alt={p.name} className={`w-12 h-12 rounded-lg object-cover border border-[var(--border-default)] ${p.isDeleted ? 'grayscale' : ''}`} />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-amber-200/50 flex items-center justify-center text-[10px] text-amber-800 font-bold">
                                No Img
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                                <span className={`truncate ${p.isDeleted ? 'line-through text-red-700/70' : ''}`}>{p.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {p.isDeleted && (
                                    <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                      Soft-Deleted
                                    </span>
                                  )}
                                  {p.isFeatured && !p.isDeleted && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                                      Featured
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">
                                Category: {catNameDisplay} {(typeof p.flavor === 'object' ? p.flavor?.name : p.flavor) ? `• Flavor: ${typeof p.flavor === 'object' ? p.flavor?.name : p.flavor}` : ''} • {p.variants?.length || 0} variant(s)
                              </p>
                            </div>
                          </div>

                          {/* Variant details list */}
                          {p.variants && p.variants.length > 0 && (
                            <div className="bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-default)]/60 text-[11px] space-y-1">
                              {p.variants.map((v) => (
                                <div key={v.id || v.label} className="flex justify-between text-gray-600">
                                  <span className="font-bold">{v.label}:</span>
                                  <span>₹{v.price} • Stock: {v.stockQuantity} {v.reservedQuantity ? `(${v.reservedQuantity} reserved)` : ''}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {!p.isDeleted && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(p)}
                                  disabled={isSubmittingProd || uploadingImage || !!deletingProdId || !!permanentDeletingProdId}
                                  className="bg-[var(--bg-showcase)] hover:bg-black text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p)}
                                  disabled={isSubmittingProd || uploadingImage || !!deletingProdId || !!permanentDeletingProdId}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingProdId === p.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                            {p.isDeleted && (
                              <button
                                type="button"
                                onClick={() => handlePermanentDeleteProduct(p)}
                                disabled={isSubmittingProd || !!deletingProdId || !!permanentDeletingProdId || !!checkingOrderRefsProdId}
                                className="bg-red-800 hover:bg-red-900 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Permanently remove this product from the database (only if it has zero order references)"
                              >
                                {checkingOrderRefsProdId === p.id
                                  ? 'Checking orders...'
                                  : permanentDeletingProdId === p.id
                                    ? 'Permanently Deleting...'
                                    : '🗑️ Permanently Delete'}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </LoadingOverlay>
          </div>
        </div>
      )}

      {/* SHOP SETTINGS TAB */}
      {activeTab === 'shop' && (
        <LoadingOverlay isLoading={isTogglingShop} message="Updating shop status..." className="max-w-xl mx-auto rounded-3xl">
          <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-default)] shadow-sm space-y-6">
            <div className="space-y-1 border-b border-gray-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Shop Status Settings</h2>
              <p className="text-xs text-gray-500">Toggle whether Velvet Crumb Bakery is open for customer checkout submissions.</p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">Storefront Ordering Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {shopSettings.isOpen
                    ? 'Currently OPEN: Customers can add items to cart and submit checkout orders.'
                    : 'Currently CLOSED: Checkout submission is blocked and storefront notice is shown.'}
                </p>
              </div>

              <button
                onClick={handleToggleShopStatus}
                disabled={isTogglingShop}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  shopSettings.isOpen
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isTogglingShop ? 'Updating...' : shopSettings.isOpen ? 'Set to CLOSED' : 'Set to OPEN'}
              </button>
            </div>
          </div>
        </LoadingOverlay>
      )}

      {/* SERVICEABLE AREAS TAB */}
      {activeTab === 'areas' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-default)] shadow-sm space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Serviceable Localities & Areas</h2>
              <p className="text-xs text-gray-500 mt-1">
                Manage local areas shown in the storefront checkout dropdown. Customers select an active locality for fast, guided input.
              </p>
            </div>

            {/* Add New Locality Form */}
            <form onSubmit={handleCreateArea} className="flex gap-3 items-end bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border-default)]">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Add New Locality Name</label>
                <input
                  type="text"
                  placeholder="e.g. Demo City, Powai, Chembur..."
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  disabled={isSubmittingArea}
                  className="w-full px-3 py-2 bg-white border border-[var(--border-default)] rounded-xl text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingArea || !areaName.trim()}
                className="bg-[var(--accent-primary)] hover:bg-[#d66712] text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingArea ? 'Adding...' : 'Add Locality'}
              </button>
            </form>

            {/* Localities Table / List */}
            <LoadingOverlay isLoading={isSubmittingArea || isSubmittingEditArea || !!togglingAreaId || !!deletingAreaId} message="Processing area action...">
              <div className="bg-white border border-[var(--border-default)] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-[var(--bg-base)] border-b border-[var(--border-default)] flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Active & Inactive Localities ({areas.length})</span>
                  <span className="text-[11px] text-gray-500">{areas.filter((a) => a.isActive).length} Active for Checkout</span>
                </div>

                {areas.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No serviceable areas added yet. Add your first locality above!
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {areas.map((a) => (
                      <li key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                        {editingAreaId === a.id ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input
                              type="text"
                              value={editingAreaName}
                              onChange={(e) => setEditingAreaName(e.target.value)}
                              className="px-3 py-1.5 border border-amber-300 rounded-lg text-xs flex-1 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditArea(a.id)}
                              disabled={isSubmittingEditArea || !editingAreaName.trim()}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAreaId(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleAreaActive(a)}
                                disabled={!!togglingAreaId}
                                title={a.isActive ? 'Click to deactivate' : 'Click to activate'}
                                className={`w-4 h-4 rounded-full border transition flex items-center justify-center ${
                                  a.isActive ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-400'
                                }`}
                              >
                                {a.isActive && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </button>
                              <div>
                                <span className={`text-xs font-bold ${a.isActive ? 'text-[var(--text-primary)]' : 'text-gray-400 line-through'}`}>
                                  {a.name}
                                </span>
                                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  a.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {a.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditArea(a)}
                                className="text-xs text-amber-700 hover:text-amber-900 font-bold px-2.5 py-1 rounded-lg hover:bg-amber-50"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteArea(a)}
                                disabled={deletingAreaId === a.id}
                                className="text-xs text-red-600 hover:text-red-800 font-bold px-2.5 py-1 rounded-lg hover:bg-red-50"
                              >
                                {deletingAreaId === a.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </LoadingOverlay>
          </div>
        </div>
      )}
    </div>
  );
}

