import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : null;
    const isValidSince = sinceDate && !isNaN(sinceDate.getTime());

    const now = new Date().toISOString();

    if (!isValidSince) {
      // If no valid since parameter is provided (e.g. initial poll), return current baseline timestamp
      const latestOrder = await db.order.findFirst({
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        newPaidOrderIds: [],
        hasChanges: false,
        timestamp: latestOrder?.updatedAt ? latestOrder.updatedAt.toISOString() : now,
      });
    }

    const [newPaidOrders, latestOrder] = await Promise.all([
      db.order.findMany({
        where: {
          paymentStatus: 'SUCCESS',
          createdAt: { gt: sinceDate },
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.order.findFirst({
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const newPaidOrderIds = newPaidOrders.map((o) => o.id);
    const hasChanges =
      newPaidOrderIds.length > 0 ||
      (latestOrder?.updatedAt ? latestOrder.updatedAt.getTime() > sinceDate.getTime() : false);

    return NextResponse.json({
      success: true,
      newPaidOrderIds,
      hasChanges,
      timestamp: now,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to perform lightweight poll check';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
