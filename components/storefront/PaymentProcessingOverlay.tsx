'use client';

import React, { useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface PaymentProcessingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export default function PaymentProcessingOverlay({
  isVisible,
  title = 'Confirming Your Payment...',
  message = 'Please do not close or refresh this page. We are securing your order receipt and inventory.',
}: PaymentProcessingOverlayProps) {
  useEffect(() => {
    if (!isVisible) return;

    // Prevent accidental unload / back navigation warning while payment confirmation is in flight
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your payment confirmation is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[var(--bg-showcase)]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-default)] shadow-2xl text-center space-y-5 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-base)] border-t-[var(--accent-primary)] border-r-[var(--accent-secondary)] animate-spin"></div>
          <div className="w-12 h-12 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[var(--accent-primary)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{message}</p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-[var(--accent-primary)] bg-[var(--bg-base)] py-2 px-3 rounded-xl border border-[var(--border-default)]">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Securing Velvet Crumb Bakery Receipt...</span>
        </div>
      </div>
    </div>
  );
}
