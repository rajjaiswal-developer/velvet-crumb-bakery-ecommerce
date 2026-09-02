import type { Metadata } from 'next';
import OrderTrackingClient from '@/components/storefront/OrderTrackingClient';

export const metadata: Metadata = {
  title: 'Track Your Cake Order | Velvet Crumb Bakery Demo City',
  description:
    'Track your cake order preparation, packaging, and delivery status in real-time using your Receipt Number and phone number.',
  alternates: {
    canonical: 'https://velvetcrumbdemo.com/orders/track',
  },
};

export default function OrderTrackingPage() {
  return <OrderTrackingClient />;
}
