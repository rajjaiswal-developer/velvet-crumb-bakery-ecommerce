import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getActiveOrderSession } from '@/lib/auth/order-session';
import { getAdminSession } from '@/lib/auth/session';
import { generateOrderInvoicePdf } from '@/lib/invoices/pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Payment Verification Gate
    if (order.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Invoice is only available for completed orders.' },
        { status: 403 }
      );
    }

    // Defense-in-Depth Authorization Gate:
    // 1. Signed active_order_session cookie matching order.id
    // 2. Authenticated Admin session
    // 3. Phone parameter matching customerMobile (for direct 2-factor link)
    const activeSession = await getActiveOrderSession();
    const adminSession = await getAdminSession();
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get('phone')?.trim().replace(/\D/g, '') || '';

    const isSessionOwner = activeSession?.orderId === order.id;
    const isAdmin = !!adminSession;
    const isPhoneMatched = phoneParam.length > 0 && phoneParam === order.customerMobile;

    if (!isSessionOwner && !isAdmin && !isPhoneMatched) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Unauthorized invoice access.' },
        { status: 403 }
      );
    }

    const pdfBuffer = await generateOrderInvoicePdf(order.id);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.receiptNumber}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF invoice' },
      { status: 500 }
    );
  }
}
