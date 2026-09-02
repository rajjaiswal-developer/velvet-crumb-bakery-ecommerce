import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { processOutboxRow } from '@/lib/notifications/outbox';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Cron Process Outbox Error]: CRON_SECRET is not configured in environment variables.');
      return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 });
    }

    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : secretHeader;

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    // Query PENDING or FAILED outbox rows with attempts < 3
    const pendingOutboxRows = await db.notificationOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: 3 },
      },
      take: 20,
    });

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const row of pendingOutboxRows) {
      await db.notificationOutbox.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });

      const result = await processOutboxRow(row.id);
      processedCount++;
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    console.log(`[Cron Process Outbox]: Processed ${processedCount} outbox rows (Success: ${successCount}, Failed: ${failedCount}).`);

    return NextResponse.json({
      success: true,
      data: {
        processedCount,
        successCount,
        failedCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Cron job exception';
    console.error('[Cron Process Outbox Error]:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
