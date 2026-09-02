import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { geocodeAddress } from '@/lib/delivery/geocode';
import { calculateHaversineDistance } from '@/lib/delivery/distance';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { formatStructuredAddress } from '@/lib/delivery/address-formatter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`val_addr_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many address validation requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { flatBuilding, street, landmark, area, pincode, address: rawAddress } = body;

    let fullAddress = '';

    if (flatBuilding && street && area && pincode) {
      // Validate area against active ServiceableArea records server-side
      const activeArea = await db.serviceableArea.findFirst({
        where: { name: area.trim(), isActive: true },
      });

      if (!activeArea) {
        return NextResponse.json(
          { success: false, error: `The selected area "${area}" is not in our list of active serviceable localities.` },
          { status: 400 }
        );
      }

      fullAddress = formatStructuredAddress({
        flatBuilding,
        street,
        landmark,
        area,
        pincode,
      });
    } else if (rawAddress && typeof rawAddress === 'string' && rawAddress.trim().length >= 5) {
      fullAddress = rawAddress.trim();
    } else {
      return NextResponse.json(
        { success: false, error: 'Please enter a complete delivery address with building, street, area, and 6-digit PIN code.' },
        { status: 400 }
      );
    }

    const shopSettings = await db.shopSettings.findUnique({
      where: { id: 'singleton' },
    });

    const shopLat = shopSettings?.shopLatitude ?? 19.0760;
    const shopLng = shopSettings?.shopLongitude ?? 72.8777;
    const radiusKm = shopSettings?.deliveryRadiusKm ?? 5.0;

    const geocoded = await geocodeAddress(fullAddress);
    const distanceKm = calculateHaversineDistance(
      shopLat,
      shopLng,
      geocoded.lat,
      geocoded.lng
    );

    const isWithinRadius = distanceKm <= radiusKm;

    return NextResponse.json({
      success: true,
      isWithinRadius,
      distanceKm,
      radiusKm,
      formattedAddress: geocoded.formattedAddress,
      message: isWithinRadius
        ? `Delivery available! Your location is ${distanceKm} km from our bakery (within ${radiusKm} km limit).`
        : `Sorry, we only deliver within ${radiusKm} km of our bakery in Demo City. Your address is ${distanceKm} km away.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Address validation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
