import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { confirmOrderStock, releaseOrderReservation } from '@/lib/payments/reservation';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Signature Verification
    if (signature && secret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing Razorpay signature header' },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { success: false, error: 'Invalid Razorpay webhook signature' },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity || {};
    const razorpayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
    const razorpayPaymentId = paymentEntity.id;
    const noteOrderId = paymentEntity.notes?.orderId;

    if (!razorpayOrderId && !noteOrderId) {
      return NextResponse.json(
        { success: true, message: 'Ignored webhook event without order identifier' },
        { status: 200 }
      );
    }

    // Look up Order
    const order = await db.order.findFirst({
      where: {
        OR: [
          razorpayOrderId ? { razorpayOrderId } : undefined,
          noteOrderId ? { id: noteOrderId } : undefined,
        ].filter(Boolean) as unknown as Prisma.OrderWhereInput[],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Associated order not found in database' },
        { status: 404 }
      );
    }

    // 2. Handle Success Events
    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      // Idempotency Check: if order is already marked SUCCESS, return 200 immediately
      if (order.paymentStatus === 'SUCCESS') {
        return NextResponse.json({
          success: true,
          message: 'Webhook already processed (Idempotent)',
        });
      }

      const items = (order.items as Array<{ variantId: string; quantity: number }>) || [];

      const outboxRow = await db.$transaction(
        async (tx) => {
          // Confirm inventory: decrement stockQuantity & reservedQuantity together
          await confirmOrderStock(items, tx);

          // State Machine transition: paymentStatus = SUCCESS, orderStatus = ORDER_RECEIVED
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'SUCCESS',
              orderStatus: 'ORDER_RECEIVED',
              razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
            },
          });

          // Add OrderStatusHistory row
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: 'ORDER_RECEIVED',
            },
          });

          // Write NotificationOutbox row for receipt email IF customer email exists
          let outbox = null;
          if (order.customerEmail && order.customerEmail.trim()) {
            outbox = await tx.notificationOutbox.create({
              data: {
                type: 'ORDER_CONFIRMATION_EMAIL',
                recipient: order.customerEmail.trim(),
                payload: {
                  orderId: order.id,
                  receiptNumber: order.receiptNumber,
                  customerName: order.customerName,
                  customerMobile: order.customerMobile,
                  totalAmount: Number(order.totalAmount),
                  items: updatedOrder.items,
                  shippingAddress: order.shippingAddress,
                  deliveryTimeSlot: order.deliveryTimeSlot,
                  specialInstructions: order.specialInstructions,
                },
              },
            });
          }

          return outbox;
        },
        { maxWait: 5000, timeout: 10000 }
      );

      // Trigger immediate non-blocking notification dispatch
      if (outboxRow?.id) {
        import('@/lib/notifications/outbox')
          .then(({ processOutboxRow }) => processOutboxRow(outboxRow.id))
          .catch((err) => console.error('[Webhook Notification Dispatch Error]:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order finalized successfully',
      });
    }

    // 3. Handle Failure Events
    if (event === 'payment.failed') {
      if (order.paymentStatus === 'SUCCESS') {
        return NextResponse.json({
          success: true,
          message: 'Order was already confirmed as success; ignoring failure webhook',
        });
      }

      await releaseOrderReservation(order.id, 'FAILED');

      if (razorpayPaymentId && razorpayPaymentId !== order.razorpayPaymentId) {
        await db.order.update({
          where: { id: order.id },
          data: { razorpayPaymentId },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded and reserved stock released',
      });
    }

    return NextResponse.json({ success: true, message: 'Event acknowledged' });
  } catch (error: unknown) {
    console.error('Error processing Razorpay webhook:', error);
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
