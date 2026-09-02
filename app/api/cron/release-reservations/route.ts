import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { releaseOrderReservation } from '@/lib/payments/reservation';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Cron Release Reservations Error]: CRON_SECRET is not configured in environment variables.');
      return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 });
    }

    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : secretHeader;

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    const now = new Date();
    const expiredOrders = await db.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        reservationExpiry: { lt: now },
      },
    });

    let sweptCount = 0;
    let releasedItemsCount = 0;

    for (const expOrder of expiredOrders) {
      const expItems = (expOrder.items as Array<{ variantId: string; quantity: number }>) || [];
      const qtySum = expItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
      await releaseOrderReservation(expOrder.id, 'EXPIRED');
      releasedItemsCount += qtySum;
      sweptCount++;
    }

    console.log(`[Cron Release Reservations]: Swept ${sweptCount} expired orders, released ${releasedItemsCount} reserved item units.`);

    return NextResponse.json({
      success: true,
      data: {
        sweptOrdersCount: sweptCount,
        releasedItemsCount,
        timestamp: now.toISOString(),
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Cron job exception';
    console.error('[Cron Release Reservations Error]:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
