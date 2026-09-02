import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getActiveOrderSession, clearActiveOrderCookie } from '@/lib/auth/order-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getActiveOrderSession();

    if (!session || !session.orderId) {
      return NextResponse.json({ success: true, active: false });
    }

    const order = await db.order.findUnique({
      where: { id: session.orderId },
      select: {
        id: true,
        receiptNumber: true,
        orderStatus: true,
        paymentStatus: true,
      },
    });

    if (!order || order.paymentStatus !== 'SUCCESS' || order.orderStatus === 'DELIVERED') {
      await clearActiveOrderCookie();
      return NextResponse.json({ success: true, active: false });
    }

    return NextResponse.json({
      success: true,
      active: true,
      data: {
        receiptNumber: order.receiptNumber,
        orderStatus: order.orderStatus || 'ORDER_RECEIVED',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching active order status:', error);
    return NextResponse.json({ success: true, active: false });
  }
}
