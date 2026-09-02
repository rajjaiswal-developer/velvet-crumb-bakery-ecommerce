import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const rawSlug = params.slug;
    if (!rawSlug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const decodedSlug = decodeURIComponent(rawSlug).trim();

    const product = await db.product.findFirst({
      where: {
        slug: decodedSlug,
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
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/products/public/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}
