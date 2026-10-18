import { SalesInvoice, DeliverySlip, PaymentRecord, DeliverySlipItem, InvoiceItem, ExpenseRecord } from '../types';

/**
 * STRICT BUSINESS LOGIC:
 * WhatsApp integration is strictly restricted to target documents:
 * 1. Invoice
 * 2. Delivery Slip
 * 3. Expense Sheet
 * 4. Money Receipt
 */
export const ALLOWED_WHATSAPP_DOCS = ['Invoice', 'Delivery Slip', 'Expense Sheet', 'Money Receipt'] as const;
export type AllowedWhatsAppDocumentType = typeof ALLOWED_WHATSAPP_DOCS[number];

export function isAllowedWhatsAppDocument(type?: string): type is AllowedWhatsAppDocumentType {
  return ALLOWED_WHATSAPP_DOCS.includes(type as AllowedWhatsAppDocumentType);
}

/**
 * Standardize phone number for WhatsApp wa.me links and API delivery
 * Handles Bangladeshi (+880, 01...) and international E.164 formats
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
 * Validate phone number format
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const formatted = formatWhatsAppPhone(phone);
  // Must be between 10 and 15 digits
  return formatted.length >= 10 && formatted.length <= 15;
}

/**
 * Build WhatsApp wa.me direct chat link
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
 * Generate formatted companion text message for a Sales Invoice (Target Document #1)
 */
export function generateInvoiceWhatsAppText(invoice: SalesInvoice, companyName = 'Bismillah Multitrade Corporation'): string {
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
 * Generate formatted companion text message for a Delivery Slip / Challan (Target Document #2)
 */
export function generateDeliverySlipWhatsAppText(slip: DeliverySlip, companyName = 'Bismillah Multitrade Corporation'): string {
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
 * Generate formatted companion text message for a Money Receipt (Target Document #3)
 */
export function generateMoneyReceiptWhatsAppText(payment: PaymentRecord, companyName = 'Bismillah Multitrade Corporation'): string {
  const currency = 'BDT';
  const lines: string[] = [];

  lines.push(`*OFFICIAL MONEY RECEIPT: ${payment.receiptNumber}*`);
  lines.push(`*${companyName}*`);
  lines.push(`────────────────────`);
  lines.push(`Customer / Party: *${payment.entityName}*`);
  if (payment.invoiceNumber) lines.push(`Invoice Ref: #${payment.invoiceNumber}`);
  lines.push(`Receipt Date: ${payment.paymentDate}`);
  lines.push(`Payment Method: *${payment.paymentMethod}*`);
  if (payment.transactionReference) lines.push(`Txn / Cheque Ref: ${payment.transactionReference}`);
  if (payment.bank) lines.push(`Bank: ${payment.bank}`);
  lines.push(`────────────────────`);
  lines.push(`*RECEIVED AMOUNT: ${currency} ${Number(payment.amount || 0).toLocaleString()}*`);

  if (payment.totalAmount !== undefined && payment.totalAmount > 0) {
    lines.push(`Total Bill Amount: ${currency} ${Number(payment.totalAmount).toLocaleString()}`);
  }
  if (payment.dueAmount !== undefined) {
    lines.push(`*Remaining Balance Due: ${currency} ${Number(payment.dueAmount).toLocaleString()}*`);
  }
  if (payment.paymentStatus) {
    lines.push(`Payment Status: *${payment.paymentStatus.toUpperCase()}*`);
  }
  if (payment.collectedBy || payment.receivedBy) {
    lines.push(`Collected By: ${payment.collectedBy || payment.receivedBy}`);
  }
  if (payment.notes) {
    lines.push(`Note: ${payment.notes}`);
  }

  lines.push(`────────────────────`);
  lines.push(`Payment acknowledged and credited to your ledger.`);
  lines.push(`Thank you for your business!`);

  return lines.join('\n');
}

/**
 * Generate formatted companion text message for an Expense Sheet (Target Document #3)
 */
export function generateExpenseWhatsAppText(expense: ExpenseRecord, companyName = 'Bismillah Multitrade Corporation'): string {
  const currency = expense.currency || 'BDT';
  const lines: string[] = [];

  const expNumber = expense.voucherNumber || expense.expenseNumber || expense.id;
  lines.push(`*EXPENSE VOUCHER / SHEET: #${expNumber}*`);
  lines.push(`*${companyName}*`);
  lines.push(`────────────────────`);
  lines.push(`Date: ${expense.expenseDate || expense.date}`);
  lines.push(`Category: *${expense.category}*`);
  if (expense.paidTo) lines.push(`Paid To / Beneficiary: *${expense.paidTo}*`);
  lines.push(`Payment Method: *${expense.paymentMethod}*`);
  if (expense.referenceNumber || expense.reference) {
    lines.push(`Ref / Cheque: ${expense.referenceNumber || expense.reference}`);
  }
  lines.push(`────────────────────`);

  if (expense.items && expense.items.length > 0) {
    lines.push(`*EXPENSE PARTICULARS:*`);
    expense.items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.particulars} - ${currency} ${Number(it.amount || 0).toLocaleString()}`);
    });
    lines.push(`────────────────────`);
  } else if (expense.description) {
    lines.push(`Description: ${expense.description}`);
    lines.push(`────────────────────`);
  }

  lines.push(`*TOTAL EXPENSE AMOUNT: ${currency} ${Number(expense.amount || 0).toLocaleString()}*`);

  if (expense.preparedBy) lines.push(`Prepared By: ${expense.preparedBy}`);
  if (expense.approvedBy) lines.push(`Approved By: ${expense.approvedBy}`);
  if (expense.notes) lines.push(`Notes: ${expense.notes}`);

  lines.push(`────────────────────`);
  lines.push(`Official record from ${companyName}.`);

  return lines.join('\n');
}

