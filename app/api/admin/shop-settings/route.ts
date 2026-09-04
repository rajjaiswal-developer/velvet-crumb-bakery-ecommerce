import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await db.shopSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await db.shopSettings.create({
        data: {
          id: 'singleton',
          isOpen: true,
          openingHours: '10:00 AM - 10:00 PM',
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch shop settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isOpen, openingHours, whatsappNumber, contactEmail } = body;

    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isOpen parameter must be a boolean' },
        { status: 400 }
      );
    }

    const updated = await db.shopSettings.upsert({
      where: { id: 'singleton' },
      update: {
        isOpen,
        openingHours: openingHours || '10:00 AM - 10:00 PM',
        whatsappNumber: whatsappNumber || undefined,
        contactEmail: contactEmail || undefined,
      },
      create: {
        id: 'singleton',
        isOpen,
        openingHours: openingHours || '10:00 AM - 10:00 PM',
      },
    });

    await createAuditLog({
      adminId: session.adminId,
      action: 'SHOP_SETTINGS_UPDATE',
      details: { isOpen: updated.isOpen, openingHours: updated.openingHours },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update shop settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
