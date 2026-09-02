import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const areas = await db.serviceableArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, data: areas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch serviceable areas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
