import { NextResponse } from 'next/server';
import { getCachedPublicCategories } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCachedPublicCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error in GET /api/categories/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
