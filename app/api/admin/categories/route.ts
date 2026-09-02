import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { categorySchema } from '@/lib/validation/schemas';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, slug, type, parentId } = validation.data;

    const existingSlug = await db.category.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'Category slug already exists' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: { name, slug, type, parentId: parentId || null },
      include: { parent: true, children: true },
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'CATEGORY_CREATE',
      details: { categoryId: category.id, name: category.name, slug: category.slug },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.CATEGORIES]);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
