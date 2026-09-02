import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { flavorSchema } from '@/lib/validation/schemas';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';
import { CACHE_TAGS, revalidateCatalog } from '@/lib/cache';

export async function GET() {
  try {
    const flavors = await db.flavor.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: flavors });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const validation = flavorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    const existing = await db.flavor.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Flavor name already exists' },
        { status: 400 }
      );
    }

    const flavor = await db.flavor.create({
      data: { name },
    });

    await createAuditLog({
      adminId: session?.adminId,
      action: 'FLAVOR_CREATE',
      details: { flavorId: flavor.id, name: flavor.name },
    });

    revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.FLAVORS]);

    return NextResponse.json({ success: true, data: flavor }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create flavor' },
      { status: 500 }
    );
  }
}
