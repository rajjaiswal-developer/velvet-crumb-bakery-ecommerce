import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { releaseOrderReservation } from '@/lib/payments/reservation';
import { OrderStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, OrderStatus> = {
  ORDER_RECEIVED: 'PROCESSING',
  PROCESSING: 'PACKAGING',
  PACKAGING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch order detail' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { nextStatus, action, cancelOrder } = body;

    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Handle Admin Manual Cancel Action
    if (action === 'cancel' || cancelOrder || nextStatus === 'CANCELLED') {
      if (order.paymentStatus !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `Only Pending orders can be cancelled. Current payment status is ${order.paymentStatus}.` },
          { status: 400 }
        );
      }

      const updatedOrder = await releaseOrderReservation(order.id, 'CANCELLED');

      await createAuditLog({
        adminId: session.adminId,
        action: 'ADMIN_ORDER_CANCEL',
        details: {
          orderId: order.id,
          receiptNumber: order.receiptNumber,
          previousPaymentStatus: order.paymentStatus,
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: 'Pending order cancelled and reserved stock released successfully.',
      });
    }

    if (!nextStatus || typeof nextStatus !== 'string') {
      return NextResponse.json(
        { success: false, error: 'nextStatus parameter is required' },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Cannot update order status for an unpaid order' },
        { status: 400 }
      );
    }

    const currentStatus = order.orderStatus || 'ORDER_RECEIVED';
    const expectedNextStatus = VALID_TRANSITIONS[currentStatus];

    if (nextStatus !== expectedNextStatus) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from "${currentStatus}" to "${nextStatus}". Expected next stage is "${expectedNextStatus || 'None'}".`,
        },
        { status: 400 }
      );
    }

    const targetStatus = nextStatus as OrderStatus;

    const updatedOrder = await db.$transaction(
      async (tx) => {
        const updated = await tx.order.update({
          where: { id },
          data: {
            orderStatus: targetStatus,
          },
          include: {
            history: {
              orderBy: { changedAt: 'asc' },
            },
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: targetStatus,
          },
        });

        return updated;
      },
      { maxWait: 5000, timeout: 10000 }
    );

    await createAuditLog({
      adminId: session.adminId,
      action: 'ORDER_STATUS_UPDATE',
      details: {
        orderId: order.id,
        receiptNumber: order.receiptNumber,
        fromStatus: currentStatus,
        toStatus: nextStatus,
      },
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
