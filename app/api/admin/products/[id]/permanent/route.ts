import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';

export async function DELETE(
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

    // Step 1: Verify product exists and is already soft-deleted
    const product = await db.product.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, isDeleted: true, categoryId: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only soft-deleted products can be permanently deleted. Please soft-delete the product first.',
        },
        { status: 400 }
      );
    }

    // Step 2: Critical safety check — block if product appears in ANY order
    const orderRefs: { count: bigint }[] = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Order"
      WHERE items::jsonb @> ${JSON.stringify([{ productId: id }])}::jsonb
    `;

    const orderCount = Number(orderRefs[0].count);
    if (orderCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `This product was part of ${orderCount} real customer order(s) and cannot be permanently deleted, to preserve order history accuracy.`,
        },
        { status: 400 }
      );
    }

    // Step 3: Permanently delete (Variants cascade via onDelete: Cascade in schema)
    await db.product.delete({ where: { id } });

    // Step 4: Audit log
    await createAuditLog({
      adminId: session.adminId,
      action: 'PRODUCT_PERMANENT_DELETE',
      details: {
        productId: id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        reason: 'Orphaned product with zero order references permanently removed',
      },
    });

    // Step 5: Revalidate catalog cache (category may now be deletable)
    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS, CACHE_TAGS.CATEGORIES]);

    return NextResponse.json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        message: `Product "${product.name}" has been permanently and irreversibly deleted.`,
      },
    });
  } catch (error) {
    console.error('Error in permanent product delete:', error);
    const message = error instanceof Error ? error.message : 'Failed to permanently delete product';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
