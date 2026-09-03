import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const flavors = await db.flavor.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      { success: true, data: flavors },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/flavors/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
}

