import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    let settings = await db.shopSettings.findUnique({
      where: { id: 'singleton' },
      select: {
        isOpen: true,
        openingHours: true,
        whatsappNumber: true,
        contactEmail: true,
        businessName: true,
        businessAddress: true,
      },
    });

    if (!settings) {
      settings = {
        isOpen: true,
        openingHours: '10:00 AM - 10:00 PM',
        whatsappNumber: '9999900000',
        contactEmail: 'admin@velvetcrumbdemo.com',
        businessName: 'Velvet Crumb Bakery',
        businessAddress: "12 Baker's Lane, Demo City",
      };
    }

    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/shop-settings/public:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shop settings' },
      { status: 500 }
    );
  }
}
