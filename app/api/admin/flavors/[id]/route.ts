import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { flavorUpdateSchema } from '@/lib/validation/schemas';
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
    const validation = flavorUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await db.flavor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Flavor not found' },
        { status: 404 }
      );
    }

    if (validation.data.name && validation.data.name !== existing.name) {
      const nameConflict = await db.flavor.findUnique({
        where: { name: validation.data.name },
      });
      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Flavor name already in use' },
          { status: 400 }
        );
      }
    }

    const updated = await db.flavor.update({
      where: { id },
      data: validation.data,
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'FLAVOR_UPDATE',
      details: { flavorId: id, changes: validation.data },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.FLAVORS, CACHE_TAGS.PRODUCTS]);

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update flavor' },
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

    const existing = await db.flavor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Flavor not found' },
        { status: 404 }
      );
    }

    await db.flavor.delete({ where: { id } });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'FLAVOR_DELETE',
      details: { flavorId: id, name: existing.name },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.FLAVORS, CACHE_TAGS.PRODUCTS]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete flavor' },
      { status: 500 }
    );
  }
}
