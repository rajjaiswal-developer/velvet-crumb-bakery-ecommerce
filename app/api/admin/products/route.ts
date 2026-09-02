import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { productSchema } from '@/lib/validation/schemas';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const products = await db.product.findMany({
      where: includeDeleted ? {} : { isDeleted: false },
      include: {
        category: true,
        flavor: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      categoryId,
      description,
      images,
      flavorId,
      isActive,
      isFeatured,
      seoTitle,
      metaDescription,
      variants,
    } = validation.data;

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product must have at least one variant' },
        { status: 400 }
      );
    }

    const existingSlug = await db.product.findFirst({ where: { slug, isDeleted: false } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'Product slug already exists' },
        { status: 400 }
      );
    }

    const categoryExists = await db.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Category does not exist' },
        { status: 400 }
      );
    }

    if (flavorId) {
      const flavorExists = await db.flavor.findUnique({ where: { id: flavorId } });
      if (!flavorExists) {
        return NextResponse.json(
          { success: false, error: 'Selected flavor does not exist' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        categoryId,
        description,
        images: (images ?? []) as unknown as Prisma.InputJsonValue,
        flavorId: flavorId || null,
        isActive,
        isFeatured: isFeatured || false,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        variants: {
          create: variants.map((v) => ({
            label: v.label,
            price: v.price,
            stockQuantity: v.stockQuantity,
            reservedQuantity: v.reservedQuantity || 0,
          })),
        },
      },
      include: {
        category: true,
        flavor: true,
        variants: true,
      },
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'PRODUCT_CREATE',
      details: { productId: product.id, name: product.name, slug: product.slug },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS]);

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
