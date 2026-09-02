import { NextResponse } from 'next/server';
import { getCachedPublicProducts } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getCachedPublicProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error in GET /api/products/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public products' },
      { status: 500 }
    );
  }
}
