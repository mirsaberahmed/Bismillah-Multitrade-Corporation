import { SalesInvoice, DeliverySlip, Quotation, DeliverySlipItem, InvoiceItem } from '../types';

/**
 * Standardize phone number for WhatsApp wa.me links
 * Handles Bangladeshi (+880, 01...) and international numbers
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  // Strip spaces, dashes, brackets, plus
  let cleaned = phone.replace(/[^\d]/g, '');

  // Bangladeshi 11-digit local format: starts with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '88' + cleaned;
  } else if (cleaned.startsWith('8801') && cleaned.length === 13) {
    // already has 88 prefix
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '880' + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Build WhatsApp wa.me link
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  return `https://wa.me/?text=${encodedMsg}`;
}

/**
 * Generate formatted text message for a Sales Invoice
 */
export function generateInvoiceWhatsAppText(invoice: SalesInvoice, companyName = 'Business'): string {
  const currency = invoice.currency || 'BDT';
  const lines: string[] = [];

  lines.push(`*INVOICE: ${invoice.invoiceNumber}*`);
  lines.push(`*${companyName}*`);
  lines.push(`────────────────────`);
  lines.push(`Customer: *${invoice.customerName}*`);
  if (invoice.companyName) lines.push(`Company: ${invoice.companyName}`);
  lines.push(`Date: ${invoice.invoiceDate}`);
  if (invoice.dueDate) lines.push(`Due Date: ${invoice.dueDate}`);
  lines.push(`Payment Status: *${invoice.paymentStatus}*`);
  if (invoice.salesPerson) lines.push(`Executive: ${invoice.salesPerson}`);
  lines.push(`────────────────────`);
  lines.push(`*ITEMS ORDERED:*`);

  (invoice.items || []).forEach((item: InvoiceItem, index: number) => {
    lines.push(
      `${index + 1}. ${item.productName} × ${item.quantity} ${item.unit || 'units'} @ ${currency} ${item.unitPrice.toLocaleString()} = ${currency} ${item.amount.toLocaleString()}`
    );
  });

  lines.push(`────────────────────`);
  lines.push(`Subtotal: ${currency} ${invoice.subtotal.toLocaleString()}`);
  const discountTotal = (invoice.overallDiscount || 0) + (invoice.itemDiscount || 0);
  if (discountTotal > 0) {
    lines.push(`Discount: -${currency} ${discountTotal.toLocaleString()}`);
  }
  if (invoice.vatAmount && invoice.vatAmount > 0) {
    lines.push(`VAT: ${currency} ${invoice.vatAmount.toLocaleString()}`);
  }
  lines.push(`*GRAND TOTAL: ${currency} ${invoice.grandTotal.toLocaleString()}*`);
  lines.push(`Paid Amount: ${currency} ${invoice.paidAmount.toLocaleString()}`);
  lines.push(`*BALANCE DUE: ${currency} ${invoice.balanceDue.toLocaleString()}*`);

  if (invoice.paymentTerms) {
    lines.push(`Terms: ${invoice.paymentTerms}`);
  }

  lines.push(`────────────────────`);
  lines.push(`Thank you for your business!`);

  return lines.join('\n');
}

/**
 * Generate formatted text message for a Delivery Slip / Challan
 */
export function generateDeliverySlipWhatsAppText(slip: DeliverySlip, companyName = 'Business'): string {
  const lines: string[] = [];

  lines.push(`*DELIVERY CHALLAN / SLIP: ${slip.deliverySlipNumber}*`);
  lines.push(`*${companyName}*`);
  lines.push(`────────────────────`);
  lines.push(`Invoice Ref: #${slip.invoiceNumber}`);
  lines.push(`Customer: *${slip.customerName}*`);
  lines.push(`Date: ${slip.deliveryDate}`);
  lines.push(`Status: *${slip.deliveryStatus}*`);
  if (slip.deliveryMethod) lines.push(`Method: ${slip.deliveryMethod}`);

  lines.push(`────────────────────`);
  lines.push(`*RECEIVER / HANDOVER INFO:*`);
  if (slip.receiverName) lines.push(`Receiver: *${slip.receiverName}*`);
  if (slip.receiverPhone) lines.push(`Phone: ${slip.receiverPhone}`);
  if (slip.deliveryAddress) lines.push(`Address: ${slip.deliveryAddress}`);

  if (slip.driverName || slip.vehicleNumber) {
    lines.push(`────────────────────`);
    lines.push(`*DISPATCH LOGISTICS:*`);
    if (slip.driverName) lines.push(`Driver: ${slip.driverName}`);
    if (slip.driverPhone) lines.push(`Driver Phone: ${slip.driverPhone}`);
    if (slip.vehicleNumber) lines.push(`Vehicle: ${slip.vehicleNumber}`);
    if (slip.warehouse) lines.push(`Depot: ${slip.warehouse}`);
  }

  lines.push(`────────────────────`);
  lines.push(`*DELIVERED ITEMS:*`);

  (slip.items || []).forEach((item: DeliverySlipItem, index: number) => {
    let details = `${index + 1}. *${item.productName}* - Dispatched: *${item.deliveredQuantity}* / ${item.orderedQuantity} ${item.unit || 'units'}`;
    const boxInfo = item.boxCount || item.boxes;
    if (boxInfo) details += ` (${boxInfo})`;
    lines.push(details);
  });

  const notesText = slip.remarks || slip.deliveryInstructions;
  if (notesText) {
    lines.push(`────────────────────`);
    lines.push(`Notes: ${notesText}`);
  }

  lines.push(`────────────────────`);
  lines.push(`Please inspect goods upon receipt and acknowledge delivery.`);

  return lines.join('\n');
}

/**
 * Generate formatted text message for a Price Quotation
 */
export function generateQuotationWhatsAppText(qt: Quotation, companyName = 'Business'): string {
  const currency = qt.currency || 'BDT';
  const lines: string[] = [];

  lines.push(`*PRICE QUOTATION: ${qt.quotationNumber}*`);
  lines.push(`*${companyName}*`);
  lines.push(`────────────────────`);
  lines.push(`Customer: *${qt.customerName}*`);
  if (qt.customerCompany) lines.push(`Company: ${qt.customerCompany}`);
  lines.push(`Date: ${qt.quotationDate}`);
  lines.push(`Validity Until: ${qt.validityDate}`);
  lines.push(`Status: *${qt.status}*`);
  lines.push(`────────────────────`);
  lines.push(`*QUOTED PRODUCTS / ITEMS:*`);

  (qt.items || []).forEach((item: InvoiceItem, index: number) => {
    lines.push(
      `${index + 1}. ${item.productName} × ${item.quantity} ${item.unit || 'units'} @ ${currency} ${item.unitPrice.toLocaleString()} = ${currency} ${item.amount.toLocaleString()}`
    );
  });

  lines.push(`────────────────────`);
  lines.push(`Subtotal: ${currency} ${qt.subtotal.toLocaleString()}`);
  if (qt.discount && qt.discount > 0) {
    lines.push(`Discount: -${currency} ${qt.discount.toLocaleString()}`);
  }
  if (qt.vat && qt.vat > 0) {
    lines.push(`VAT: ${currency} ${qt.vat.toLocaleString()}`);
  }
  lines.push(`*GRAND TOTAL: ${currency} ${qt.grandTotal.toLocaleString()}*`);

  if (qt.terms) {
    lines.push(`────────────────────`);
    lines.push(`Terms: ${qt.terms}`);
  }

  lines.push(`────────────────────`);
  lines.push(`For inquiries or to confirm this quotation, please reply to this message.`);

  return lines.join('\n');
}
