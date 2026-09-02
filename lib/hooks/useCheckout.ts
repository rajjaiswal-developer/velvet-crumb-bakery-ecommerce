'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CartDrawerItem } from '@/components/storefront/CartDrawer';
import { formatStructuredAddress } from '@/lib/delivery/address-formatter';

export interface CartData {
  items: CartDrawerItem[];
  totalAmount: number;
  itemCount: number;
}

export interface RadiusStatus {
  checked: boolean;
  isWithinRadius?: boolean;
  message?: string;
  loading?: boolean;
}

export interface ServiceableAreaOption {
  id: string;
  name: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function useCheckout() {
  const router = useRouter();

  // Cart & UI state
  const [cart, setCart] = useState<CartData>({ items: [], totalAmount: 0, itemCount: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Serviceable Areas from DB
  const [serviceableAreas, setServiceableAreas] = useState<ServiceableAreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Customer Contact Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');

  // Structured Address Fields
  const [flatBuilding, setFlatBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const city = 'Mumbai'; // Fixed non-editable city

  // Fallback single address string
  const [address, setAddress] = useState('');

  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('2-hours');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Radius Check State
  const [radiusStatus, setRadiusStatus] = useState<RadiusStatus>({ checked: false });

  // Review & Submit State
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadServiceableAreas = useCallback(async () => {
    try {
      const res = await fetch('/api/serviceable-areas');
      const data = await res.json();
      if (data.success) {
        setServiceableAreas(data.data);
        if (data.data.length > 0 && !area) {
          setArea(data.data[0].name);
        }
      }
    } catch (err) {
      console.error('Error loading serviceable areas:', err);
    } finally {
      setLoadingAreas(false);
    }
  }, [area]);

  useEffect(() => {
    loadCart();
    loadServiceableAreas();

    // Dynamically load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [loadServiceableAreas]);

  async function loadCart() {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get canonical formatted address string
  const getFormattedFullAddress = useCallback(() => {
    if (flatBuilding || street || area || pincode) {
      return formatStructuredAddress({
        flatBuilding,
        street,
        landmark,
        area,
        pincode,
      });
    }
    return address;
  }, [flatBuilding, street, landmark, area, pincode, address]);

  async function handleCheckRadius() {
    const fullAddr = getFormattedFullAddress();
    if (!flatBuilding.trim() || !street.trim() || !area || !pincode.trim()) {
      setRadiusStatus({
        checked: true,
        isWithinRadius: false,
        message: 'Please complete all required address fields (Building, Street, Area, and 6-digit PIN code).',
      });
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setRadiusStatus({
        checked: true,
        isWithinRadius: false,
        message: 'Please enter a valid 6-digit Indian PIN code (e.g. 400077).',
      });
      return;
    }

    setRadiusStatus({ checked: false, loading: true });
    try {
      const res = await fetch('/api/checkout/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flatBuilding: flatBuilding.trim(),
          street: street.trim(),
          landmark: landmark.trim() || null,
          area: area.trim(),
          pincode: pincode.trim(),
          address: fullAddr,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRadiusStatus({
          checked: true,
          isWithinRadius: data.isWithinRadius,
          message: data.message,
          loading: false,
        });
      } else {
        setRadiusStatus({
          checked: true,
          isWithinRadius: false,
          message: data.error || 'Address check failed.',
          loading: false,
        });
      }
    } catch {
      setRadiusStatus({
        checked: true,
        isWithinRadius: false,
        message: 'Could not check delivery radius. Please try again.',
        loading: false,
      });
    }
  }

  function handleOpenReview(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    // Basic frontend validations
    if (name.length > 100) {
      setErrorMessage('Full name must not exceed 100 characters.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    if (phone !== confirmPhone) {
      setErrorMessage('Mobile numbers do not match. Please verify your phone number entries.');
      return;
    }

    if (alternatePhone && alternatePhone.trim().length > 0 && !/^[6-9]\d{9}$/.test(alternatePhone.trim())) {
      setErrorMessage('Please enter a valid 10-digit alternate mobile number starting with 6-9.');
      return;
    }

    if (email && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Structured address validations
    if (!flatBuilding.trim()) {
      setErrorMessage('Please enter Flat / House No. & Building Name.');
      return;
    }
    if (flatBuilding.trim().length > 150) {
      setErrorMessage('Building name must not exceed 150 characters.');
      return;
    }

    if (!street.trim()) {
      setErrorMessage('Please enter Street / Road Name.');
      return;
    }
    if (street.trim().length > 150) {
      setErrorMessage('Street name must not exceed 150 characters.');
      return;
    }

    if (landmark && landmark.trim().length > 150) {
      setErrorMessage('Landmark must not exceed 150 characters.');
      return;
    }

    if (!area) {
      setErrorMessage('Please select an Area / Locality from the dropdown.');
      return;
    }

    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code (e.g. 400077).');
      return;
    }

    if (specialInstructions && specialInstructions.length > 500) {
      setErrorMessage('Special instructions must not exceed 500 characters.');
      return;
    }

    setIsReviewing(true);
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setErrorMessage(null);

    const formattedAddress = getFormattedFullAddress();

    try {
      // 1. Submit checkout details & reserve stock
      const submitRes = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim() || null,
          phone,
          confirmPhone,
          alternatePhone: alternatePhone.trim() || null,
          flatBuilding: flatBuilding.trim(),
          street: street.trim(),
          landmark: landmark.trim() || null,
          area: area.trim(),
          pincode: pincode.trim(),
          address: formattedAddress,
          deliveryTimeSlot,
          specialInstructions: specialInstructions || null,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitData.success) {
        setErrorMessage(submitData.error || 'Stock reservation failed');
        setIsReviewing(false);
        setSubmitting(false);
        return;
      }

      const pendingOrder = submitData.data;

      // 2. Create Razorpay Payment Order
      const rzpOrderRes = await fetch('/api/checkout/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pendingOrder.orderId }),
      });

      const rzpOrderData = await rzpOrderRes.json();
      if (!rzpOrderData.success) {
        setErrorMessage(rzpOrderData.error || 'Failed to initialize payment gateway');
        setIsReviewing(false);
        setSubmitting(false);
        return;
      }

      const rzpInfo = rzpOrderData.data;
      setIsReviewing(false);

      // 3. Open Razorpay Checkout Modal
      if (window.Razorpay) {
        const options = {
          key: rzpInfo.razorpayKeyId,
          amount: rzpInfo.amountInPaise,
          currency: rzpInfo.currency,
          name: 'Velvet Crumb Bakery',
          description: `Order Receipt #${rzpInfo.receiptNumber}`,
          image: '/logo-master.png',
          order_id: rzpInfo.razorpayOrderId,
          prefill: {
            name: rzpInfo.customerName,
            email: rzpInfo.customerEmail,
            contact: rzpInfo.customerMobile,
          },
          theme: {
            color: '#F0791A',
          },
          handler: async function (response: Record<string, string>) {
            // Immediately show full-screen payment confirmation loading overlay
            setIsConfirmingPayment(true);
            setSubmitting(true);

            // Trigger local confirmation & redirect to receipt page
            try {
              await fetch('/api/webhooks/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'payment.captured',
                  payload: {
                    payment: {
                      entity: {
                        id: response.razorpay_payment_id || `pay_${Date.now()}`,
                        order_id: response.razorpay_order_id || rzpInfo.razorpayOrderId,
                        notes: { orderId: pendingOrder.orderId },
                      },
                    },
                  },
                }),
              });
            } catch (err) {
              console.warn('Webhook notification fallback:', err);
            }
            router.push(`/orders/${encodeURIComponent(pendingOrder.receiptNumber)}`);
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setErrorMessage('Payment process was cancelled. Stock remains reserved for 15 minutes.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for offline/test redirect
        router.push(`/orders/${encodeURIComponent(pendingOrder.receiptNumber)}`);
      }
    } catch {
      setErrorMessage('An unexpected network error occurred.');
      setIsReviewing(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateQuantity(variantId: string, quantity: number) {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }

  async function handleRemoveItem(variantId: string) {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json();
      if (data.success) setCart(data.data);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }

  return {
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
    address,
    setAddress,
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
    setErrorMessage,
    handleOpenReview,
    handleFinalSubmit,
    handleUpdateQuantity,
    handleRemoveItem,
  };
}
