import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { productUpdateSchema } from '@/lib/validation/schemas';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';
import { Prisma } from '@prisma/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        flavor: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    const { id } = params;
    const body = await request.json();
    const validation = productUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const { variants, images, ...updateFields } = validation.data;

    if (updateFields.slug && updateFields.slug !== existing.slug) {
      const slugConflict = await db.product.findFirst({
        where: { slug: updateFields.slug, isDeleted: false, id: { not: id } },
      });
      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    if (variants !== undefined && variants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product must have at least one variant' },
        { status: 400 }
      );
    }

    const txStart = Date.now();
    const updated = await db.$transaction(
      async (tx) => {
        if (variants) {
          const updatedVariantIds = variants.map((v) => v.id).filter(Boolean) as string[];

          // Fetch all existing variants for this product in a single batched query
          const existingVariants = await tx.variant.findMany({
            where: { productId: id },
          });
          const existingVariantMap = new Map(existingVariants.map((v) => [v.id, v]));

          // Check if any variant being deleted has active reservations
          const variantsToDelete = existingVariants.filter((v) => !updatedVariantIds.includes(v.id));
          const blockedDeletion = variantsToDelete.find((v) => v.reservedQuantity > 0);
          if (blockedDeletion) {
            throw new Error(
              `Cannot remove variant "${blockedDeletion.label}" because it has ${blockedDeletion.reservedQuantity} active order reservation(s).`
            );
          }

          // Delete unreferenced variants
          if (variantsToDelete.length > 0) {
            await tx.variant.deleteMany({
              where: {
                productId: id,
                id: { notIn: updatedVariantIds },
              },
            });
          }

          // Upsert variants using upfront in-memory Map lookups (no in-loop findUnique DB roundtrips)
          for (const variant of variants) {
            if (variant.id) {
              const currentVar = existingVariantMap.get(variant.id);
              const currentReserved = currentVar?.reservedQuantity ?? 0;

              if (variant.stockQuantity < currentReserved) {
                throw new Error(
                  `Cannot set stock quantity (${variant.stockQuantity}) below currently reserved quantity (${currentReserved}) for variant "${variant.label}".`
                );
              }

              await tx.variant.update({
                where: { id: variant.id },
                data: {
                  label: variant.label,
                  price: variant.price,
                  stockQuantity: variant.stockQuantity,
                  reservedQuantity: currentReserved,
                },
              });
            } else {
              await tx.variant.create({
                data: {
                  productId: id,
                  label: variant.label,
                  price: variant.price,
                  stockQuantity: variant.stockQuantity,
                  reservedQuantity: variant.reservedQuantity ?? 0,
                },
              });
            }
          }
        }

        const productResult = await tx.product.update({
          where: { id },
          data: {
            ...updateFields,
            images: images !== undefined ? ((images ?? []) as unknown as Prisma.InputJsonValue) : undefined,
          },
          include: {
            category: true,
            flavor: true,
            variants: true,
          },
        });

        return productResult;
      },
      { maxWait: 5000, timeout: 10000 }
    );

    const txDuration = Date.now() - txStart;
    console.log(`[Product Update Transaction] Duration: ${txDuration}ms for productId: ${id}`);

    await createAuditLog({
      adminId: session?.adminId,
      action: 'PRODUCT_UPDATE',
      details: { productId: id, changes: validation.data },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/admin/products/[id]:', error);
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    const { id } = params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete per architecture.md
    const updated = await db.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'PRODUCT_DELETE',
      details: { productId: id, name: existing.name, isDeleted: true },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS]);

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to soft delete product' },
      { status: 500 }
    );
  }
}
