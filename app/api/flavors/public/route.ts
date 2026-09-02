import { NextResponse } from 'next/server';
import { getCachedPublicFlavors } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flavors = await getCachedPublicFlavors();
    return NextResponse.json({ success: true, data: flavors });
  } catch (error) {
    console.error('Error in GET /api/flavors/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
}
