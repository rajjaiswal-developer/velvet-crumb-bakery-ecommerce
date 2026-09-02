import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { categoryUpdateSchema } from '@/lib/validation/schemas';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    const { id } = params;
    const body = await request.json();
    const validation = categoryUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    if (validation.data.slug && validation.data.slug !== existing.slug) {
      const slugConflict = await db.category.findUnique({
        where: { slug: validation.data.slug },
      });
      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Category slug already in use' },
          { status: 400 }
        );
      }
    }

    const updated = await db.category.update({
      where: { id },
      data: validation.data,
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'CATEGORY_UPDATE',
      details: { categoryId: id, changes: validation.data },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.CATEGORIES]);

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
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

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Pre-check 1: Block deletion if category has child subcategories
    const subcategoryCount = await db.category.count({ where: { parentId: id } });
    if (subcategoryCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category "${existing.name}" because it still has ${subcategoryCount} subcategory/subcategories assigned to it. Please reassign or remove subcategories first.`,
        },
        { status: 400 }
      );
    }

    // Pre-check 2: Block deletion if category has ANY products assigned to it (active or soft-deleted)
    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category "${existing.name}" because it still has ${productCount} product(s) assigned to it (including soft-deleted products). Please reassign or remove products first.`,
        },
        { status: 400 }
      );
    }

    try {
      await db.category.delete({ where: { id } });
    } catch (deleteError) {
      console.error('[Category Delete Error]:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category "${existing.name}" because it is still referenced by existing database records.`,
        },
        { status: 400 }
      );
    }

    await createAuditLog({
      adminId: session?.adminId,
      action: 'CATEGORY_DELETE',
      details: { categoryId: id, name: existing.name },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.CATEGORIES]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 400 }
    );
  }
}
