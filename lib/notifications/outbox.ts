import { db } from '@/lib/db/client';
import { sendEmailViaBrevo } from './sender';

export async function processOutboxRow(outboxId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const outbox = await db.notificationOutbox.findUnique({
      where: { id: outboxId },
    });

    if (!outbox) {
      console.warn(`[Outbox Processor] Outbox entry ${outboxId} not found.`);
      return { success: false, error: 'Outbox entry not found' };
    }

    if (outbox.status === 'SENT') {
      return { success: true };
    }

    // Load template from DB
    const template = await db.notificationTemplate.findUnique({
      where: { key: outbox.type },
    });

    const payload = (outbox.payload as Record<string, unknown>) || {};

    let subject = template?.subject || `Order Confirmation - #${payload.receiptNumber || ''}`;
    let htmlBody = template?.body || getDefaultOrderConfirmationTemplate();

    // Format items table HTML
    const items = Array.isArray(payload.items) ? payload.items : [];
    const itemsTableHtml = items
      .map(
        (item: Record<string, unknown>) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || 'Cake'} (${item.variantLabel || ''})</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.itemTotal || item.price || 0}</td>
        </tr>`
      )
      .join('');

    const replacements: Record<string, string> = {
      '{{customerName}}': String(payload.customerName || 'Valued Customer'),
      '{{receiptNumber}}': String(payload.receiptNumber || 'N/A'),
      '{{itemsTable}}': itemsTableHtml || '<tr><td colspan="3">Cake Items</td></tr>',
      '{{totalAmount}}': payload.totalAmount ? `₹${payload.totalAmount}` : '₹0',
      '{{shippingAddress}}': String(payload.shippingAddress || '12 Bakers Lane, Demo City'),
      '{{deliveryTimeSlot}}': String(payload.deliveryTimeSlot || 'Within 2 Hours'),
      '{{specialInstructions}}': payload.specialInstructions ? `Special Note: ${payload.specialInstructions}` : 'None',
      '{{orderDate}}': new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replaceAll(key, value);
      htmlBody = htmlBody.replaceAll(key, value);
    }

    const result = await sendEmailViaBrevo({
      to: outbox.recipient,
      toName: typeof payload.customerName === 'string' ? payload.customerName : undefined,
      subject,
      htmlContent: htmlBody,
    });

    if (result.success) {
      await db.notificationOutbox.update({
        where: { id: outboxId },
        data: {
          status: 'SENT',
          lastError: null,
        },
      });
      return { success: true };
    } else {
      await db.notificationOutbox.update({
        where: { id: outboxId },
        data: {
          status: 'FAILED',
          lastError: result.error || 'Failed to dispatch email via Brevo',
        },
      });
      return { success: false, error: result.error };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Outbox processing exception';
    console.error('[Outbox Processor Exception]:', errorMsg);

    try {
      await db.notificationOutbox.update({
        where: { id: outboxId },
        data: { status: 'FAILED', lastError: errorMsg },
      });
    } catch {
      // Ignore secondary DB update error
    }

    return { success: false, error: errorMsg };
  }
}

function getDefaultOrderConfirmationTemplate(): string {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #FFF8F0; padding: 20px; color: #1B1F3B;">
    <div style="max-w: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #E8DCCB;">
      <h2 style="color: #F0791A; margin-top: 0;">Velvet Crumb Bakery - Order Receipt</h2>
      <p>Dear {{customerName}},</p>
      <p>Thank you for ordering with Velvet Crumb Bakery! Your order <strong>#{{receiptNumber}}</strong> has been confirmed.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #FFF8F0; text-align: left;">
            <th style="padding: 8px;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{itemsTable}}
        </tbody>
      </table>

      <p><strong>Delivery Fee:</strong> ₹0 (Free 5 km Delivery)</p>
      <p style="font-size: 18px; color: #F0791A;"><strong>Total Amount Paid:</strong> {{totalAmount}}</p>
      <p><strong>Delivery Slot:</strong> {{deliveryTimeSlot}}</p>
      <p><strong>Address:</strong> {{shippingAddress}}</p>
      <p><em>{{specialInstructions}}</em></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6B6B6B;">100% Eggless Pure Vegetarian Bakery • 12 Bakers Lane, Demo City</p>
    </div>
  </div>`;
}
