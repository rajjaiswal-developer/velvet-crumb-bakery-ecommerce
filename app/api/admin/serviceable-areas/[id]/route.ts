import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { serviceableAreaUpdateSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validation = serviceableAreaUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await db.serviceableArea.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Serviceable area not found' },
        { status: 404 }
      );
    }

    const { name, isActive } = validation.data;

    // Check unique constraint if name is changing
    if (name && name !== existing.name) {
      const duplicate = await db.serviceableArea.findUnique({
        where: { name },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Serviceable area "${name}" already exists` },
          { status: 400 }
        );
      }
    }

    const updatedArea = await db.serviceableArea.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        adminId: session.adminId,
        action: 'UPDATE_SERVICEABLE_AREA',
        details: { areaId: id, name: updatedArea.name, isActive: updatedArea.isActive },
      },
    });

    return NextResponse.json({ success: true, data: updatedArea });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update serviceable area';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existing = await db.serviceableArea.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Serviceable area not found' },
        { status: 404 }
      );
    }

    await db.serviceableArea.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        adminId: session.adminId,
        action: 'DELETE_SERVICEABLE_AREA',
        details: { areaId: id, name: existing.name },
      },
    });

    return NextResponse.json({ success: true, message: `Area "${existing.name}" deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete serviceable area';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
