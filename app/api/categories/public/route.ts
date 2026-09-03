import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/categories/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

