import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        category: {
          include: { parent: true },
        },
        flavor: true,
        variants: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { success: true, data: products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/products/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public products' },
      { status: 500 }
    );
  }
}

