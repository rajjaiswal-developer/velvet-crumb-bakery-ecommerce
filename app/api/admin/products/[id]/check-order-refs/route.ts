import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id },
      select: { id: true, name: true, isDeleted: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product ID appears in any order's items JSON using PostgreSQL jsonb containment
    const orderRefs: { count: bigint }[] = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${JSON.stringify([{ productId: id }])}::jsonb
    `;

    const orderCount = Number(orderRefs[0].count);
    const hasOrderReferences = orderCount > 0;

    return NextResponse.json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        isDeleted: product.isDeleted,
        hasOrderReferences,
        orderCount,
      },
    });
  } catch (error) {
    console.error('Error checking order references:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check order references' },
      { status: 500 }
    );
  }
}
