import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const orderStatus = searchParams.get('orderStatus');
    const paymentStatus = searchParams.get('paymentStatus');

    const where: Prisma.OrderWhereInput = {};
    if (orderStatus) where.orderStatus = orderStatus as OrderStatus;

    if (paymentStatus === 'ALL' || paymentStatus === 'all') {
      // Show all payment statuses
    } else if (paymentStatus) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    } else {
      // Default to showing only SUCCESS (real paid transactions)
      where.paymentStatus = 'SUCCESS';
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerMobile: { contains: search, mode: 'insensitive' } },
        { alternatePhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const isAll = searchParams.get('pageSize') === 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = isAll ? 0 : Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '25', 10)));

    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
    ]);

    const totalPages = isAll ? 1 : Math.ceil(total / (pageSize || 1)) || 1;

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page: isAll ? 1 : page,
        pageSize: isAll ? total : pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin orders';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

