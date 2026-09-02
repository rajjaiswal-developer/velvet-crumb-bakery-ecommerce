import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { serviceableAreaSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const areas = await db.serviceableArea.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: areas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch serviceable areas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = serviceableAreaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, isActive } = validation.data;

    const existing = await db.serviceableArea.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Serviceable area "${name}" already exists` },
        { status: 400 }
      );
    }

    const newArea = await db.serviceableArea.create({
      data: { name, isActive: isActive ?? true },
    });

    await db.auditLog.create({
      data: {
        adminId: session.adminId,
        action: 'CREATE_SERVICEABLE_AREA',
        details: { areaId: newArea.id, name: newArea.name, isActive: newArea.isActive },
      },
    });

    return NextResponse.json({ success: true, data: newArea }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create serviceable area';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
