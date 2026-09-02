import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { setActiveOrderCookie } from '@/lib/auth/order-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptNumber = searchParams.get('receiptNumber');

    if (!receiptNumber) {
      return NextResponse.json(
        { success: false, error: 'Order not found or payment pending' },
        { status: 404 }
      );
    }

    const order = await db.order.findUnique({
      where: { receiptNumber },
    });

    // Payment Verification Gate:
    // Only genuinely completed orders (paymentStatus === SUCCESS) may be viewed on confirmation page.
    if (!order || order.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Order not found or payment pending' },
        { status: 404 }
      );
    }

    // Single Server-Side Cookie Issuance Mechanism:
    // Issued ONLY when a genuinely completed successful order is queried/loaded.
    await setActiveOrderCookie(order.id);

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        receiptNumber: order.receiptNumber,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        alternatePhone: order.alternatePhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        deliveryTimeSlot: order.deliveryTimeSlot,
        specialInstructions: order.specialInstructions,
        items: order.items,
        totalAmount: Number(order.totalAmount),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/orders/public:', error);
    return NextResponse.json(
      { success: false, error: 'Order not found or payment pending' },
      { status: 404 }
    );
  }
}
