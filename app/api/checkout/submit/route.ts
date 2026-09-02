import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { Prisma } from '@prisma/client';
import { getCart } from '@/lib/cart/cart';
import { geocodeAddress } from '@/lib/delivery/geocode';
import { calculateHaversineDistance } from '@/lib/delivery/distance';
import { checkoutInputSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { cookies } from 'next/headers';
import { releaseOrderReservation, reserveStockAtomic } from '@/lib/payments/reservation';
import { formatStructuredAddress } from '@/lib/delivery/address-formatter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = await checkRateLimit(`submit_checkout_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many checkout submission attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = checkoutInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      alternatePhone,
      flatBuilding,
      street,
      landmark,
      area,
      pincode,
      address: rawAddress,
      deliveryTimeSlot,
      specialInstructions,
    } = validation.data;

    // Check if shop is open for new orders
    const shopSettings = await db.shopSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (shopSettings && !shopSettings.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: `Our bakery is currently closed for new orders (${shopSettings.openingHours || 'Opening Soon'}). Browsing is open!`,
        },
        { status: 400 }
      );
    }

    // 1. Mandatory Server-Side Serviceable Area Validation
    let targetAddress = '';
    if (flatBuilding && street && area && pincode) {
      const activeArea = await db.serviceableArea.findFirst({
        where: { name: area.trim(), isActive: true },
      });

      if (!activeArea) {
        return NextResponse.json(
          {
            success: false,
            error: `The selected area "${area}" is currently not in our active list of serviceable localities. Please select an active area.`,
          },
          { status: 400 }
        );
      }

      targetAddress = formatStructuredAddress({
        flatBuilding,
        street,
        landmark,
        area,
        pincode,
      });
    } else if (rawAddress && rawAddress.trim().length >= 5) {
      targetAddress = rawAddress.trim();
    } else {
      return NextResponse.json(
        { success: false, error: 'Please enter a complete delivery address.' },
        { status: 400 }
      );
    }

    // 2. Lazy cleanup of customer's previous expired reservations
    const now = new Date();
    const customerMatchConditions: Prisma.OrderWhereInput[] = [{ customerMobile: phone }];
    if (email && email.trim()) {
      customerMatchConditions.push({ customerEmail: email.trim() });
    }
    if (alternatePhone && alternatePhone.trim()) {
      customerMatchConditions.push({ customerMobile: alternatePhone.trim() });
      customerMatchConditions.push({ alternatePhone: phone });
      customerMatchConditions.push({ alternatePhone: alternatePhone.trim() });
    }

    const expiredOrders = await db.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        reservationExpiry: { lt: now },
        OR: customerMatchConditions,
      },
    });

    for (const expOrder of expiredOrders) {
      await releaseOrderReservation(expOrder.id, 'EXPIRED');
    }

    // 3. Server-side Delivery Radius Check (Google Geocoding + Haversine 5km)
    const shopLat = shopSettings?.shopLatitude ?? 19.0760;
    const shopLng = shopSettings?.shopLongitude ?? 72.8777;
    const radiusKm = shopSettings?.deliveryRadiusKm ?? 5.0;

    const geocoded = await geocodeAddress(targetAddress);
    const distanceKm = calculateHaversineDistance(
      shopLat,
      shopLng,
      geocoded.lat,
      geocoded.lng
    );

    if (distanceKm > radiusKm) {
      return NextResponse.json(
        {
          success: false,
          error: `Sorry, we only deliver within 5 km of our bakery in Demo City. Your address is ${distanceKm} km away.`,
        },
        { status: 400 }
      );
    }

    // 4. Server-side Cart Lookup & Re-validation
    const cart = await getCart();
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Your cart is empty' },
        { status: 400 }
      );
    }

    // 5. Atomic Inventory Reservation & Order Creation
    const receiptNumber = `AC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min TTL

    const createdOrder = await db.$transaction(
      async (tx) => {
        // Atomically reserve stock for each variant in transaction
        await reserveStockAtomic(cart.items, tx);

        // Create Order row with canonical formatted address
        const order = await tx.order.create({
          data: {
            receiptNumber,
            customerName: name,
            customerMobile: phone,
            alternatePhone: alternatePhone || null,
            customerEmail: email || null,
            shippingAddress: geocoded.formattedAddress || targetAddress,
            deliveryTimeSlot,
            specialInstructions: specialInstructions || null,
            items: JSON.parse(JSON.stringify(cart.items)),
            totalAmount: cart.totalAmount,
            paymentStatus: 'PENDING',
            // orderStatus is left NULL until payment is successful
            reservationExpiry,
          },
        });

        return order;
      },
      { maxWait: 5000, timeout: 10000 }
    );

    // 6. Clear cart session cookie
    const cookieStore = cookies();
    cookieStore.delete('cart_session');

    return NextResponse.json({
      success: true,
      data: {
        orderId: createdOrder.id,
        receiptNumber: createdOrder.receiptNumber,
        totalAmount: Number(createdOrder.totalAmount),
        reservationExpiry: createdOrder.reservationExpiry,
        customerName: createdOrder.customerName,
        customerMobile: createdOrder.customerMobile,
        alternatePhone: createdOrder.alternatePhone,
        customerEmail: createdOrder.customerEmail,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
