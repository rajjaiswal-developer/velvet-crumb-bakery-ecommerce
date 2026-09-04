import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`track_${ip}`, 25, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many tracking attempts. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { receiptNumber, phone } = body;

    const normalizedReceipt = typeof receiptNumber === 'string' ? receiptNumber.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim().replace(/\D/g, '') : '';

    if (!normalizedReceipt || !normalizedPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'No matching order found for the provided receipt number and phone number.',
        },
        { status: 404 }
      );
    }

    const order = await db.order.findFirst({
      where: {
        receiptNumber: normalizedReceipt,
        OR: [{ customerMobile: normalizedPhone }, { alternatePhone: normalizedPhone }],
      },
      include: {
        history: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'No matching order found for the provided receipt number and phone number.',
        },
        { status: 404 }
      );
    }

    const currentStatus = order.orderStatus || 'ORDER_RECEIVED';

    // 1-Hour Post-Delivery Auto-Expiry Check
    if (currentStatus === 'DELIVERED') {
      const deliveredEntry = (order.history || []).find((h) => h.status === 'DELIVERED');
      const deliveredAt = deliveredEntry ? new Date(deliveredEntry.changedAt).getTime() : new Date(order.updatedAt).getTime();
      const ONE_HOUR_MS = 60 * 60 * 1000;

      if (Date.now() - deliveredAt > ONE_HOUR_MS) {
        // Return identical 404 generic error response to prevent enumeration
        return NextResponse.json(
          {
            success: false,
            error: 'No matching order found for the provided receipt number and phone number.',
          },
          { status: 404 }
        );
      }
    }

    const STAGES = ['ORDER_RECEIVED', 'PROCESSING', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentStageIndex = STAGES.indexOf(currentStatus);

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        receiptNumber: order.receiptNumber,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        shippingAddress: order.shippingAddress,
        deliveryTimeSlot: order.deliveryTimeSlot,
        totalAmount: Number(order.totalAmount),
        paymentStatus: order.paymentStatus,
        orderStatus: currentStatus,
        currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
        items: order.items,
        statusHistory: order.history,
        createdAt: order.createdAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to track order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
