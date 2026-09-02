import { db } from '../db/client';
import { Prisma } from '@prisma/client';

export type ReleaseTargetStatus = 'FAILED' | 'CANCELLED' | 'EXPIRED';

/**
 * Release reserved stock for an order and transition its payment status.
 */
export async function releaseOrderReservation(
  orderId: string,
  targetPaymentStatus: ReleaseTargetStatus,
  client?: Prisma.TransactionClient
) {
  const runner = async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Only pending orders can have their reservations released
    if (order.paymentStatus !== 'PENDING') {
      return order;
    }

    const items = (order.items as Array<{ variantId: string; quantity: number }>) || [];

    // Decrement reservedQuantity for all items in the order using batched variant lookup
    if (items.length > 0) {
      const variantIds = items.map((i) => i.variantId).filter(Boolean);
      const variants = await tx.variant.findMany({
        where: { id: { in: variantIds } },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of items) {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: {
              reservedQuantity: Math.max(0, variant.reservedQuantity - item.quantity),
            },
          });
        }
      }
    }

    // Update order payment status and clear reservationExpiry
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: targetPaymentStatus,
        reservationExpiry: null,
      },
    });

    return updatedOrder;
  };

  if (client) {
    return runner(client);
  } else {
    return db.$transaction(runner, { maxWait: 5000, timeout: 10000 });
  }
}

/**
 * Atomically reserve stock for items in a Prisma transaction.
 * Enforces stockQuantity - reservedQuantity >= quantity.
 */
export async function reserveStockAtomic(
  items: Array<{ variantId: string; quantity: number; productName?: string; variantLabel?: string }>,
  tx: Prisma.TransactionClient
) {
  if (items.length === 0) return;

  const variantIds = items.map((i) => i.variantId).filter(Boolean);
  const variants = await tx.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of items) {
    const variant = variantMap.get(item.variantId);

    if (
      !variant ||
      !variant.product ||
      variant.product.isDeleted ||
      !variant.product.isActive
    ) {
      const label = item.productName || 'Item';
      throw new Error(`"${label}" is no longer available in our store.`);
    }

    const availableStock = variant.stockQuantity - variant.reservedQuantity;
    if (item.quantity > availableStock) {
      const label = item.productName
        ? `${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ''}`
        : 'Item';
      throw new Error(
        `"${label}" is no longer available in the requested quantity (Only ${Math.max(
          0,
          availableStock
        )} remaining).`
      );
    }

    await tx.variant.update({
      where: { id: item.variantId },
      data: {
        reservedQuantity: { increment: item.quantity },
      },
    });
  }
}

/**
 * Permanently confirm order stock on payment success.
 * Decrements stockQuantity and reservedQuantity together.
 */
export async function confirmOrderStock(
  items: Array<{ variantId: string; quantity: number }>,
  tx: Prisma.TransactionClient
) {
  if (items.length === 0) return;

  const variantIds = items.map((i) => i.variantId).filter(Boolean);
  const variants = await tx.variant.findMany({
    where: { id: { in: variantIds } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of items) {
    const v = variantMap.get(item.variantId);
    if (v) {
      await tx.variant.update({
        where: { id: item.variantId },
        data: {
          stockQuantity: Math.max(0, v.stockQuantity - item.quantity),
          reservedQuantity: Math.max(0, v.reservedQuantity - item.quantity),
        },
      });
    }
  }
}
