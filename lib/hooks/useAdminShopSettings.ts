'use client';

import { useState, useCallback } from 'react';

export interface ShopSettingsData {
  isOpen: boolean;
  openingHours: string;
}

export function useAdminShopSettings() {
  const [shopSettings, setShopSettings] = useState<ShopSettingsData>({
    isOpen: true,
    openingHours: '10:00 AM - 10:00 PM',
  });
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [shopMessage, setShopMessage] = useState('');

  const loadShopSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shop-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setShopSettings({
          isOpen: data.data.isOpen,
          openingHours: data.data.openingHours || '10:00 AM - 10:00 PM',
        });
      }
    } catch (err) {
      console.error('Failed to load shop settings:', err);
    }
  }, []);

  async function handleToggleShopStatus() {
    if (isTogglingShop) return;
    setIsTogglingShop(true);
    setShopMessage('');
    try {
      const newIsOpen = !shopSettings.isOpen;
      const res = await fetch('/api/admin/shop-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newIsOpen, openingHours: shopSettings.openingHours }),
      });
      const data = await res.json();
      if (data.success) {
        setShopSettings({ isOpen: data.data.isOpen, openingHours: data.data.openingHours });
        setShopMessage(`Shop is now ${data.data.isOpen ? 'OPEN' : 'CLOSED'} for new checkout orders!`);
      } else {
        setShopMessage(`Error toggling shop: ${data.error}`);
      }
    } catch {
      setShopMessage('Error toggling shop status.');
    } finally {
      setIsTogglingShop(false);
    }
  }

  return {
    shopSettings,
    isTogglingShop,
    shopMessage,
    setShopMessage,
    loadShopSettings,
    handleToggleShopStatus,
  };
}
