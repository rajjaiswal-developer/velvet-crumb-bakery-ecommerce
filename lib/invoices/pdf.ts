import PDFDocument from 'pdfkit';
import { db } from '../db/client';

export interface OrderItemPdfData {
  productName?: string;
  variantLabel?: string;
  quantity?: number;
  price?: number;
  itemTotal?: number;
}

export async function generateOrderInvoicePdf(orderId: string): Promise<Buffer> {
  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found for PDF invoice generation');
  }

  if (order.paymentStatus !== 'SUCCESS') {
    throw new Error('Invoice generation requires a successful order payment');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Brand Header
      doc.fontSize(22).fillColor('#F0791A').text('Velvet Crumb Bakery', 40, 40);
      doc.fontSize(9).fillColor('#6B6B6B').text('100% Eggless Pure Vegetarian Bakery');
      doc.text('12 Bakers Lane, Demo City, Maharashtra 400086');
      doc.text('Phone: +91 9999900000 | Email: hello@velvetcrumbdemo.com');

      // Invoice Title & Meta (Right Column)
      doc.fontSize(16).fillColor('#1B1F3B').text('TAX INVOICE / RECEIPT', 350, 40, { align: 'right' });
      doc.fontSize(10).fillColor('#6B6B6B').text(`Receipt #: ${order.receiptNumber}`, 350, 60, { align: 'right' });
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`,
        350,
        75,
        { align: 'right' }
      );
      doc.text(`Payment Status: ${order.paymentStatus}`, 350, 90, { align: 'right' });

      // Horizontal Divider
      doc.moveTo(40, 115).lineTo(555, 115).strokeColor('#E8DCCB').lineWidth(1).stroke();

      // Customer & Shipping Info Box
      const boxTop = 125;
      doc.rect(40, boxTop, 515, 80).fillColor('#FFF8F0').fillAndStroke('#FFF8F0', '#E8DCCB');

      doc.fontSize(11).fillColor('#F0791A').text('Customer & Delivery Details', 50, boxTop + 10);
      doc.fontSize(9).fillColor('#1B1F3B');
      doc.text(`Name: ${order.customerName}`, 50, boxTop + 28);
      doc.text(`Mobile: ${order.customerMobile}${order.alternatePhone ? ` / ${order.alternatePhone}` : ''}`, 50, boxTop + 42);
      doc.text(`Email: ${order.customerEmail || 'No email provided'}`, 50, boxTop + 56);

      doc.text(`Address: ${order.shippingAddress}`, 280, boxTop + 28, { width: 260 });
      doc.text(`Time Slot: ${order.deliveryTimeSlot || 'Within 2 Hours'}`, 280, boxTop + 56);

      // Line Items Table Header
      const tableTop = 220;
      doc.rect(40, tableTop, 515, 22).fill('#141414');
      doc.fontSize(9).fillColor('#FFFFFF');
      doc.text('Item Description', 50, tableTop + 6);
      doc.text('Qty', 330, tableTop + 6, { width: 40, align: 'center' });
      doc.text('Unit Price', 380, tableTop + 6, { width: 80, align: 'right' });
      doc.text('Amount', 470, tableTop + 6, { width: 75, align: 'right' });

      // Line Items Rows
      let y = tableTop + 25;
      const rawItems = Array.isArray(order.items) ? (order.items as OrderItemPdfData[]) : [];

      for (const item of rawItems) {
        const prodName = item.productName || 'Vegetarian Cake';
        const label = item.variantLabel ? ` (${item.variantLabel})` : '';
        const qty = item.quantity || 1;
        const total = item.itemTotal || item.price || 0;
        const unitPrice = qty > 0 ? total / qty : total;

        doc.fontSize(9).fillColor('#1B1F3B');
        doc.text(`${prodName}${label}`, 50, y, { width: 270 });
        doc.text(String(qty), 330, y, { width: 40, align: 'center' });
        doc.text(`INR ${unitPrice.toFixed(2)}`, 380, y, { width: 80, align: 'right' });
        doc.text(`INR ${Number(total).toFixed(2)}`, 470, y, { width: 75, align: 'right' });

        y += 20;
        doc.moveTo(40, y - 5).lineTo(555, y - 5).strokeColor('#F5EFE6').lineWidth(0.5).stroke();
      }

      // Summary / Total Box
      y += 10;
      doc.rect(340, y, 215, 30).fillColor('#FFF8F0').fillAndStroke('#FFF8F0', '#E8DCCB');
      doc.fontSize(11).fillColor('#1B1F3B').text('Total Paid:', 350, y + 9);
      doc.fontSize(12).fillColor('#F0791A').text(`INR ${Number(order.totalAmount).toFixed(2)}`, 450, y + 8, {
        align: 'right',
        width: 95,
      });

      // Special Instructions if present
      if (order.specialInstructions) {
        y += 45;
        doc.fontSize(9).fillColor('#6B6B6B').text(`Special Instructions: ${order.specialInstructions}`, 40, y, {
          width: 515,
        });
      }

      // Footer
      const footerY = 780;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E8DCCB').lineWidth(1).stroke();
      doc.fontSize(8).fillColor('#6B6B6B').text(
        'Thank you for ordering with Velvet Crumb Bakery! 100% Eggless Pure Vegetarian Bakery • 12 Bakers Lane, Demo City',
        40,
        footerY + 8,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
