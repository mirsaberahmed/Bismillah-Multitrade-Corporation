import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../src/data/signatureData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CompanySettings {
  companyName?: string;
  businessType?: string;
  address?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  email?: string;
  website?: string;
  termsAndConditions?: string;
  currency?: string;
  [key: string]: any;
}

function formatDateStr(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(num: number): string {
  if (isNaN(num) || num === null || num === undefined) num = 0;
  const parts = Math.abs(num).toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOther + ',' + lastThree;
  } else {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return `${num < 0 ? '-' : ''}৳ ${integerPart}.${decimalPart}`;
}

// Cache base64 font strings in memory for instant reuse
let cachedFonts: {
  regular?: string;
  bold?: string;
  italic?: string;
  bengali?: string;
} | null = null;

function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const fontsDir = path.join(__dirname, 'fonts');
  const readFont = (name: string, fallback?: string): string | undefined => {
    const primary = path.join(fontsDir, name);
    if (fs.existsSync(primary)) return fs.readFileSync(primary).toString('base64');
    if (fallback && fs.existsSync(fallback)) return fs.readFileSync(fallback).toString('base64');
    return undefined;
  };

  cachedFonts = {
    regular: readFont('LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'),
    bold: readFont('LiberationSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'),
    italic: readFont('LiberationSans-Italic.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf'),
    bengali: readFont('NotoSansBengali.ttf', '/tmp/NotoBengali.ttf')
  };
  return cachedFonts;
}

function setupFonts(doc: jsPDF): { hasBengali: boolean; fontName: string } {
  const fonts = loadFonts();
  let fontName = 'helvetica';

  if (fonts.regular) {
    doc.addFileToVFS('AppSans-Regular.ttf', fonts.regular);
    doc.addFont('AppSans-Regular.ttf', 'AppSans', 'normal');
    fontName = 'AppSans';
  }
  if (fonts.bold) {
    doc.addFileToVFS('AppSans-Bold.ttf', fonts.bold);
    doc.addFont('AppSans-Bold.ttf', 'AppSans', 'bold');
  }
  if (fonts.italic) {
    doc.addFileToVFS('AppSans-Italic.ttf', fonts.italic);
    doc.addFont('AppSans-Italic.ttf', 'AppSans', 'italic');
  }

  let hasBengali = false;
  if (fonts.bengali) {
    doc.addFileToVFS('NotoBengali.ttf', fonts.bengali);
    doc.addFont('NotoBengali.ttf', 'NotoBengali', 'normal');
    doc.addFont('NotoBengali.ttf', 'NotoBengali', 'bold');
    hasBengali = true;
  }

  return { hasBengali, fontName };
}

/**
 * Generate Exact Sample-Matching Invoice PDF
 * Matches the official on-screen sample:
 * - Clean white background
 * - 1px crisp black borders around all boxes & tables
 * - Exact Bismillah Multitrade Corporation letterhead
 * - Exact BILL TO and INVOICE INFORMATION boxes
 * - Exact table columns and gridlines
 * - Exact AMOUNT IN WORDS and Totals boxes
 * - Official Terms & Conditions
 * - Official circular blue seal & signature stamp at bottom right
 */
export function generateInvoicePdf(invoice: any, settings: CompanySettings): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const { hasBengali, fontName } = setupFonts(doc);

  // Page dimensions: 210mm x 297mm. Margins: left 14mm, right 196mm (Width: 182mm)
  const leftX = 14;
  const rightX = 196;
  const contentWidth = 182;

  // 1. TOP HEADER (Exact 1-to-1 match with PrintableInvoice.tsx)
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text((settings.companyName || 'BISMILLAH MULTITRADE CORPORATION').toUpperCase(), leftX, 17);

  doc.setFontSize(8.5);
  doc.setFont(fontName, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text((settings.businessType || 'IMPORT & EXPORT CONCERN / TRADING COMPANY').toUpperCase(), leftX, 22.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text(settings.address || 'Ananda Nibash, South Shewrapara, Mirpur, Dhaka-1216, Bangladesh', leftX, 27.5);
  doc.text(`Phone: ${settings.phonePrimary || '+880 1312-893729'}${settings.phoneSecondary ? ` | ${settings.phoneSecondary}` : ' | +880 1400-967693'}`, leftX, 31.8);
  doc.text(`Email: ${settings.email || 'info@bismillahmultitrade.com'}${settings.website ? ` | ${settings.website}` : ' | www.bismillahmultitrade.com'}`, leftX, 36);

  // Top Right: INVOICE Badge Box & Details
  const badgeW = 42;
  const badgeH = 8.5;
  const badgeX = rightX - badgeW;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(badgeX, 10.5, badgeW, badgeH);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', badgeX + (badgeW / 2), 16.5, { align: 'center' });

  // Invoice Metadata (under badge, right-aligned)
  const printHeaderRightRow = (label: string, value: string, yPos: number) => {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8);
    const valWidth = doc.getTextWidth(value);
    doc.text(value, rightX, yPos, { align: 'right' });

    doc.setFont(fontName, 'normal');
    doc.text(label, rightX - valWidth - 1, yPos, { align: 'right' });
  };

  printHeaderRightRow('Invoice No: ', String(invoice.invoiceNumber || 'INV_2026-161426'), 24.5);
  printHeaderRightRow('Date: ', formatDateStr(invoice.invoiceDate) || '12 Oct 2026', 29);
  printHeaderRightRow('Due Date: ', formatDateStr(invoice.dueDate) || '04 Nov 2026', 33.5);

  // Divider Line below Header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(leftX, 39, rightX, 39);

  // 2. TWO COLUMN INFO BOXES
  const boxY = 44;
  const boxH = 34;
  const boxW = 88;

  // Left: BILL TO
  doc.rect(leftX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('BILL TO', leftX + 4, boxY + 5.5);

  doc.setFontSize(9.5);
  doc.setFont(fontName, 'bold');
  doc.text(String(invoice.customerName || 'MUAJ AHMED'), leftX + 4, boxY + 11.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  const cAddr = String(invoice.customerAddress || 'SA PARIBAHAN, COX\'SBAZAR');
  doc.text(doc.splitTextToSize(cAddr, 80), leftX + 4, boxY + 16.5);

  // Inner divider line in BILL TO box
  doc.line(leftX + 4, boxY + 24, leftX + boxW - 4, boxY + 24);
  doc.text(`Phone: ${invoice.customerPhone || '01822037606'}`, leftX + 4, boxY + 29.5);

  // Right: INVOICE INFORMATION
  const rightBoxX = rightX - boxW;
  doc.rect(rightBoxX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('INVOICE INFORMATION', rightBoxX + 4, boxY + 5.5);

  const printInfoRow = (label: string, val: string, yPos: number) => {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.text(label, rightBoxX + 4, yPos);
    doc.setFont(fontName, 'bold');
    doc.text(val, rightBoxX + boxW - 4, yPos, { align: 'right' });
  };

  printInfoRow('Payment Terms:', String(invoice.paymentTerms || '1 Days Credit'), boxY + 11.5);
  printInfoRow('Executive:', String(invoice.salesPerson || 'Executive'), boxY + 17.5);
  printInfoRow('Delivery Status:', String(invoice.deliveryStatus || 'DELIVERED').toUpperCase(), boxY + 23.5);

  // 3. ITEMS TABLE
  let tableY = 84;
  const colW = {
    sl: 12,
    desc: 80,
    qty: 18,
    unit: 16,
    rate: 26,
    amount: 30
  };

  const colX = {
    sl: leftX,
    desc: leftX + colW.sl,
    qty: leftX + colW.sl + colW.desc,
    unit: leftX + colW.sl + colW.desc + colW.qty,
    rate: leftX + colW.sl + colW.desc + colW.qty + colW.unit,
    amount: leftX + colW.sl + colW.desc + colW.qty + colW.unit + colW.rate
  };

  // Header Row (White bg with black lines, bold text)
  const headerH = 8;
  doc.rect(leftX, tableY, contentWidth, headerH);
  // Column dividers
  doc.line(colX.desc, tableY, colX.desc, tableY + headerH);
  doc.line(colX.qty, tableY, colX.qty, tableY + headerH);
  doc.line(colX.unit, tableY, colX.unit, tableY + headerH);
  doc.line(colX.rate, tableY, colX.rate, tableY + headerH);
  doc.line(colX.amount, tableY, colX.amount, tableY + headerH);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.text('SL', colX.sl + (colW.sl / 2), tableY + 5.2, { align: 'center' });
  doc.text('Product Details', colX.desc + 4, tableY + 5.2);
  doc.text('Qty', colX.qty + (colW.qty / 2), tableY + 5.2, { align: 'center' });
  doc.text('Unit', colX.unit + (colW.unit / 2), tableY + 5.2, { align: 'center' });
  doc.text('Unit Price', colX.rate + colW.rate - 4, tableY + 5.2, { align: 'right' });
  doc.text('Total Amount', colX.amount + colW.amount - 4, tableY + 5.2, { align: 'right' });

  tableY += headerH;

  // Body Rows
  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ productName: 'BURMIS PAIN RELIEF BALM', quantity: 168, unit: 'Pcs', unitPrice: 58.34, amount: 9800.28 }];

  items.forEach((item: any, idx: number) => {
    const rowH = 8.5;
    doc.rect(leftX, tableY, contentWidth, rowH);
    doc.line(colX.desc, tableY, colX.desc, tableY + rowH);
    doc.line(colX.qty, tableY, colX.qty, tableY + rowH);
    doc.line(colX.unit, tableY, colX.unit, tableY + rowH);
    doc.line(colX.rate, tableY, colX.rate, tableY + rowH);
    doc.line(colX.amount, tableY, colX.amount, tableY + rowH);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.text(String(idx + 1), colX.sl + (colW.sl / 2), tableY + 5.5, { align: 'center' });

    doc.setFont(fontName, 'bold');
    doc.text(String(item.productName || 'Item ' + (idx + 1)), colX.desc + 4, tableY + 5.5);

    doc.setFont(fontName, 'bold');
    doc.text(String(item.quantity || 0), colX.qty + (colW.qty / 2), tableY + 5.5, { align: 'center' });
    doc.setFont(fontName, 'normal');
    doc.text(String(item.unit || 'Pcs'), colX.unit + (colW.unit / 2), tableY + 5.5, { align: 'center' });

    // Unit Price (with Bengali Taka font)
    if (hasBengali) {
      doc.setFont('NotoBengali', 'normal');
    } else {
      doc.setFont(fontName, 'normal');
    }
    doc.text(formatAmount(item.unitPrice || 0), colX.rate + colW.rate - 4, tableY + 5.5, { align: 'right' });

    // Total Amount (with Bengali Taka font, bold)
    if (hasBengali) {
      doc.setFont('NotoBengali', 'bold');
    } else {
      doc.setFont(fontName, 'bold');
    }
    doc.text(formatAmount(item.amount || (item.quantity * item.unitPrice) || 0), colX.amount + colW.amount - 4, tableY + 5.5, { align: 'right' });

    tableY += rowH;
  });

  // 4. SUMMARY BOXES
  const sumY = tableY + 6;
  const wordsBoxW = 104;
  const totalsBoxW = 72;
  const sumBoxH = 20;

  // Left: AMOUNT IN WORDS Box
  doc.rect(leftX, sumY, wordsBoxW, sumBoxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('AMOUNT IN WORDS', leftX + 4, sumY + 5.5);

  doc.setFont(fontName, 'italic');
  doc.setFontSize(8);
  const words = invoice.amountInWords || 'Nine Thousand Eight Hundred Taka and Twenty Eight Paisa Only.';
  doc.text(doc.splitTextToSize(words, wordsBoxW - 8), leftX + 4, sumY + 11.5);

  // Right: Subtotal & GRAND TOTAL Box
  const totalsBoxX = rightX - totalsBoxW;
  doc.rect(totalsBoxX, sumY, totalsBoxW, sumBoxH);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal:', totalsBoxX + 4, sumY + 6);
  if (hasBengali) doc.setFont('NotoBengali', 'bold');
  else doc.setFont(fontName, 'bold');
  doc.text(formatAmount(invoice.subtotal || invoice.grandTotal || 9800.28), rightX - 4, sumY + 6, { align: 'right' });

  // Dividing line
  doc.line(totalsBoxX, sumY + 10, rightX, sumY + 10);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL:', totalsBoxX + 4, sumY + 16.5);
  if (hasBengali) doc.setFont('NotoBengali', 'bold');
  else doc.setFont(fontName, 'bold');
  doc.text(formatAmount(invoice.grandTotal || 9800.28), rightX - 4, sumY + 16.5, { align: 'right' });

  // 5. TERMS & CONDITIONS
  const termsY = sumY + sumBoxH + 9;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('TERMS & CONDITIONS:', leftX, termsY);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.text('1. All payments must be made to Bismillah Multitrade Corporation official accounts.', leftX, termsY + 5);
  doc.text('2. Goods once sold and delivered in good condition will not be returned unless covered under manufacturing warranty.', leftX, termsY + 9.5);
  doc.text('3. Discrepancies in goods or delivery slip must be reported in writing within 48 hours.', leftX, termsY + 14);

  // 6. OFFICIAL CIRCULAR BLUE SEAL & SIGNATURE STAMP AT BOTTOM RIGHT
  const sigY = 248;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(leftX + 4, sigY, leftX + 56, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('CUSTOMER SIGNATURE', leftX + 30, sigY + 4.5, { align: 'center' });

  if (BISMILLAH_SIGNATURE_DATA_URI) {
    try {
      doc.addImage(BISMILLAH_SIGNATURE_DATA_URI, 'PNG', 146, sigY - 30, 36, 36);
    } catch (sigErr) {
      console.warn('Signature image embed error:', sigErr);
    }
  }
  doc.line(rightX - 60, sigY, rightX - 4, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('BISMILLAH MULTITRADE CORPORATION', rightX - 32, sigY + 4.5, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Exact Sample-Matching Delivery Slip / Challan PDF
 */
export function generateDeliverySlipPdf(slip: any, settings: CompanySettings): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const { fontName } = setupFonts(doc);

  const leftX = 14;
  const rightX = 196;
  const contentWidth = 182;

  // Header
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.text((settings.companyName || 'BISMILLAH MULTITRADE CORPORATION').toUpperCase(), leftX, 17);

  doc.setFontSize(8.5);
  doc.setFont(fontName, 'bold');
  doc.text((settings.businessType || 'IMPORT & EXPORT CONCERN / TRADING COMPANY').toUpperCase(), leftX, 22.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text(settings.address || 'Ananda Nibash, South Shewrapara, Mirpur, Dhaka-1216, Bangladesh', leftX, 27.5);
  doc.text(`Phone: ${settings.phonePrimary || '+880 1312-893729'}${settings.phoneSecondary ? ` | ${settings.phoneSecondary}` : ' | +880 1400-967693'}`, leftX, 31.8);
  doc.text(`Email: ${settings.email || 'info@bismillahmultitrade.com'}${settings.website ? ` | ${settings.website}` : ' | www.bismillahmultitrade.com'}`, leftX, 36);

  // Badge
  const badgeW = 54;
  const badgeH = 8.5;
  const badgeX = rightX - badgeW;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(badgeX, 10.5, badgeW, badgeH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.text('DELIVERY CHALLAN', badgeX + (badgeW / 2), 16.5, { align: 'center' });

  // Challan Info
  const printSlipRightRow = (label: string, value: string, yPos: number) => {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8);
    const valWidth = doc.getTextWidth(value);
    doc.text(value, rightX, yPos, { align: 'right' });

    doc.setFont(fontName, 'normal');
    doc.text(label, rightX - valWidth - 1, yPos, { align: 'right' });
  };

  printSlipRightRow('Challan No: ', String(slip.deliverySlipNumber || 'DS-2026-4700'), 24.5);
  printSlipRightRow('Date: ', formatDateStr(slip.slipDate || slip.deliveryDate) || '12 Oct 2026', 29);
  printSlipRightRow('Invoice No: ', String(slip.invoiceNumber || 'INV_2026-161426'), 33.5);

  doc.line(leftX, 39, rightX, 39);

  // Two Boxes
  const boxY = 44;
  const boxH = 34;
  const boxW = 88;

  // Deliver To
  doc.rect(leftX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('DELIVER TO (CUSTOMER)', leftX + 4, boxY + 5.5);

  doc.setFontSize(9.5);
  doc.text(String(slip.customerName || 'MUAJ AHMED'), leftX + 4, boxY + 11.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  const sAddr = String(slip.deliveryAddress || slip.address || 'SA PARIBAHAN, COX\'SBAZAR');
  doc.text(doc.splitTextToSize(sAddr, 80), leftX + 4, boxY + 16.5);
  doc.line(leftX + 4, boxY + 24, leftX + boxW - 4, boxY + 24);
  doc.text(`Contact: ${slip.receiverPhone || slip.phone || '01822037606'}`, leftX + 4, boxY + 29.5);

  // Transport Details
  const rightBoxX = rightX - boxW;
  doc.rect(rightBoxX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('DISPATCH INFORMATION', rightBoxX + 4, boxY + 5.5);

  const printChallanRow = (label: string, val: string, yPos: number) => {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.text(label, rightBoxX + 4, yPos);
    doc.setFont(fontName, 'bold');
    doc.text(val, rightBoxX + boxW - 4, yPos, { align: 'right' });
  };

  printChallanRow('Vehicle Number:', String(slip.vehicleNumber || 'Direct Logistics'), boxY + 11.5);
  printChallanRow('Driver Name:', String(slip.driverName || 'Designated Driver'), boxY + 17.5);
  printChallanRow('Delivery Status:', String(slip.deliveryStatus || 'DELIVERED').toUpperCase(), boxY + 23.5);

  // Table
  let tableY = 84;
  const colW = { sl: 12, desc: 90, ord: 24, del: 24, unit: 16, rem: 16 };
  const colX = {
    sl: leftX,
    desc: leftX + colW.sl,
    ord: leftX + colW.sl + colW.desc,
    del: leftX + colW.sl + colW.desc + colW.ord,
    unit: leftX + colW.sl + colW.desc + colW.ord + colW.del,
    rem: leftX + colW.sl + colW.desc + colW.ord + colW.del + colW.unit
  };

  const headerH = 8;
  doc.rect(leftX, tableY, contentWidth, headerH);
  doc.line(colX.desc, tableY, colX.desc, tableY + headerH);
  doc.line(colX.ord, tableY, colX.ord, tableY + headerH);
  doc.line(colX.del, tableY, colX.del, tableY + headerH);
  doc.line(colX.unit, tableY, colX.unit, tableY + headerH);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('SL', colX.sl + (colW.sl / 2), tableY + 5.2, { align: 'center' });
  doc.text('Product Description', colX.desc + 4, tableY + 5.2);
  doc.text('Ordered', colX.ord + (colW.ord / 2), tableY + 5.2, { align: 'center' });
  doc.text('Delivered', colX.del + (colW.del / 2), tableY + 5.2, { align: 'center' });
  doc.text('Unit', colX.unit + (colW.unit / 2), tableY + 5.2, { align: 'center' });

  tableY += headerH;

  const items = Array.isArray(slip.items) && slip.items.length > 0
    ? slip.items
    : [{ productName: 'BURMIS PAIN RELIEF BALM', orderedQuantity: 168, deliveredQuantity: 168, unit: 'Pcs' }];

  items.forEach((item: any, idx: number) => {
    const rowH = 8.5;
    doc.rect(leftX, tableY, contentWidth, rowH);
    doc.line(colX.desc, tableY, colX.desc, tableY + rowH);
    doc.line(colX.ord, tableY, colX.ord, tableY + rowH);
    doc.line(colX.del, tableY, colX.del, tableY + rowH);
    doc.line(colX.unit, tableY, colX.unit, tableY + rowH);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.text(String(idx + 1), colX.sl + (colW.sl / 2), tableY + 5.5, { align: 'center' });
    doc.setFont(fontName, 'bold');
    doc.text(String(item.productName || 'Item ' + (idx + 1)), colX.desc + 4, tableY + 5.5);
    doc.text(String(item.orderedQuantity || item.deliveredQuantity || 0), colX.ord + (colW.ord / 2), tableY + 5.5, { align: 'center' });
    doc.text(String(item.deliveredQuantity || 0), colX.del + (colW.del / 2), tableY + 5.5, { align: 'center' });
    doc.setFont(fontName, 'normal');
    doc.text(String(item.unit || 'Pcs'), colX.unit + (colW.unit / 2), tableY + 5.5, { align: 'center' });

    tableY += rowH;
  });

  // Acknowledgement Box
  const ackY = tableY + 6;
  doc.rect(leftX, ackY, contentWidth, 20);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('DELIVERY ACKNOWLEDGEMENT & RECEIPT', leftX + 4, ackY + 5.5);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.text('Received the above goods in full quantity and sound condition. Any discrepancy must be reported within 24 hours.', leftX + 4, ackY + 11);
  doc.text(`Status: ${slip.deliveryStatus || 'Delivered'} | Reference: ${slip.deliverySlipNumber}`, leftX + 4, ackY + 16);

  // Seal & Signature
  const sigY = 248;
  doc.line(leftX + 4, sigY, leftX + 56, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('RECEIVER SIGNATURE', leftX + 30, sigY + 4.5, { align: 'center' });

  if (BISMILLAH_SIGNATURE_DATA_URI) {
    try {
      doc.addImage(BISMILLAH_SIGNATURE_DATA_URI, 'PNG', 146, sigY - 30, 36, 36);
    } catch {}
  }
  doc.line(rightX - 60, sigY, rightX - 4, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('BISMILLAH MULTITRADE CORPORATION', rightX - 32, sigY + 4.5, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Exact Sample-Matching Expense Sheet PDF
 */
export function generateExpensePdf(expense: any, settings: CompanySettings): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const { hasBengali, fontName } = setupFonts(doc);

  const leftX = 14;
  const rightX = 196;
  const contentWidth = 182;

  // Header
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.text((settings.companyName || 'BISMILLAH MULTITRADE CORPORATION').toUpperCase(), leftX, 17);

  doc.setFontSize(8.5);
  doc.setFont(fontName, 'bold');
  doc.text((settings.businessType || 'IMPORT & EXPORT CONCERN / TRADING COMPANY').toUpperCase(), leftX, 22.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text(settings.address || 'Ananda Nibash, South Shewrapara, Mirpur, Dhaka-1216, Bangladesh', leftX, 27.5);
  doc.text(`Phone: ${settings.phonePrimary || '+880 1312-893729'}`, leftX, 31.8);

  const badgeW = 54;
  const badgeH = 8.5;
  const badgeX = rightX - badgeW;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(badgeX, 10.5, badgeW, badgeH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.text('EXPENSE SHEET', badgeX + (badgeW / 2), 16.5, { align: 'center' });

  const printExpRightRow = (label: string, value: string, yPos: number) => {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8);
    const valWidth = doc.getTextWidth(value);
    doc.text(value, rightX, yPos, { align: 'right' });

    doc.setFont(fontName, 'normal');
    doc.text(label, rightX - valWidth - 1, yPos, { align: 'right' });
  };

  printExpRightRow('Voucher No: ', String(expense.expenseNumber || expense.id || 'EXP-001'), 24.5);
  printExpRightRow('Date: ', formatDateStr(expense.expenseDate || expense.date) || '12 Oct 2026', 29);

  doc.line(leftX, 39, rightX, 39);

  // Payee Box
  const boxY = 44;
  const boxH = 30;
  const boxW = 88;
  doc.rect(leftX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('PAYEE / BENEFICIARY', leftX + 4, boxY + 5.5);
  doc.setFontSize(9.5);
  doc.text(String(expense.payee || expense.paidTo || 'Operational Vendor / Staff'), leftX + 4, boxY + 11.5);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text(`Category: ${expense.category || 'General Operations'}`, leftX + 4, boxY + 17.5);
  doc.text(`Payment Method: ${expense.paymentMethod || 'Cash / Bank Transfer'}`, leftX + 4, boxY + 23.5);

  // Voucher details
  const rightBoxX = rightX - boxW;
  doc.rect(rightBoxX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('SETTLEMENT DETAILS', rightBoxX + 4, boxY + 5.5);
  doc.setFont(fontName, 'normal');
  doc.text('Status:', rightBoxX + 4, boxY + 11.5);
  doc.setFont(fontName, 'bold');
  doc.text('SETTLED & APPROVED', rightBoxX + boxW - 4, boxY + 11.5, { align: 'right' });
  doc.setFont(fontName, 'normal');
  doc.text('Reference:', rightBoxX + 4, boxY + 17.5);
  doc.setFont(fontName, 'bold');
  doc.text(String(expense.reference || 'N/A'), rightBoxX + boxW - 4, boxY + 17.5, { align: 'right' });

  // Table
  let tableY = 80;
  doc.rect(leftX, tableY, contentWidth, 8);
  doc.line(leftX + 120, tableY, leftX + 120, tableY + 8);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('Description / Purpose', leftX + 4, tableY + 5.2);
  doc.text('Total Amount', rightX - 4, tableY + 5.2, { align: 'right' });

  tableY += 8;
  const rowH = 10;
  doc.rect(leftX, tableY, contentWidth, rowH);
  doc.line(leftX + 120, tableY, leftX + 120, tableY + rowH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  const expDesc = String(expense.description || expense.purpose || expense.category || 'Official Operating Expense');
  doc.text(doc.splitTextToSize(expDesc, 110), leftX + 4, tableY + 6);
  if (hasBengali) doc.setFont('NotoBengali', 'bold');
  else doc.setFont(fontName, 'bold');
  doc.text(formatAmount(expense.amount || 0), rightX - 4, tableY + 6, { align: 'right' });

  // Seal
  const sigY = 248;
  doc.line(leftX + 4, sigY, leftX + 56, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('AUTHORIZED BY', leftX + 30, sigY + 4.5, { align: 'center' });

  if (BISMILLAH_SIGNATURE_DATA_URI) {
    try {
      doc.addImage(BISMILLAH_SIGNATURE_DATA_URI, 'PNG', 146, sigY - 30, 36, 36);
    } catch {}
  }
  doc.line(rightX - 60, sigY, rightX - 4, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('BISMILLAH MULTITRADE CORPORATION', rightX - 32, sigY + 4.5, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Exact Sample-Matching Money Receipt PDF
 */
export function generateMoneyReceiptPdf(payment: any, settings: CompanySettings): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const { hasBengali, fontName } = setupFonts(doc);

  const leftX = 14;
  const rightX = 196;
  const contentWidth = 182;

  // Header
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.text((settings.companyName || 'BISMILLAH MULTITRADE CORPORATION').toUpperCase(), leftX, 17);

  doc.setFontSize(8.5);
  doc.setFont(fontName, 'bold');
  doc.text((settings.businessType || 'IMPORT & EXPORT CONCERN / TRADING COMPANY').toUpperCase(), leftX, 22.5);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text(settings.address || 'Ananda Nibash, South Shewrapara, Mirpur, Dhaka-1216, Bangladesh', leftX, 27.5);
  doc.text(`Phone: ${settings.phonePrimary || '+880 1312-893729'}`, leftX, 31.8);

  const badgeW = 54;
  const badgeH = 8.5;
  const badgeX = rightX - badgeW;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(badgeX, 10.5, badgeW, badgeH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.text('MONEY RECEIPT', badgeX + (badgeW / 2), 16.5, { align: 'center' });

  const printReceiptRightRow = (label: string, value: string, yPos: number) => {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8);
    const valWidth = doc.getTextWidth(value);
    doc.text(value, rightX, yPos, { align: 'right' });

    doc.setFont(fontName, 'normal');
    doc.text(label, rightX - valWidth - 1, yPos, { align: 'right' });
  };

  printReceiptRightRow('Receipt No: ', String(payment.receiptNumber || payment.id || 'MR-001'), 24.5);
  printReceiptRightRow('Date: ', formatDateStr(payment.paymentDate || payment.date) || '12 Oct 2026', 29);

  doc.line(leftX, 39, rightX, 39);

  // Received From Box
  const boxY = 44;
  const boxH = 30;
  const boxW = 88;
  doc.rect(leftX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('RECEIVED FROM', leftX + 4, boxY + 5.5);
  doc.setFontSize(9.5);
  doc.text(String(payment.customerName || payment.receivedFrom || 'MUAJ AHMED'), leftX + 4, boxY + 11.5);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.text(`Payment Mode: ${payment.paymentMethod || payment.mode || 'Cash / Online Transfer'}`, leftX + 4, boxY + 17.5);
  doc.text(`Invoice Ref: ${payment.invoiceNumber || 'N/A'}`, leftX + 4, boxY + 23.5);

  // Amount Box
  const rightBoxX = rightX - boxW;
  doc.rect(rightBoxX, boxY, boxW, boxH);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('AMOUNT RECEIVED', rightBoxX + 4, boxY + 5.5);
  doc.setFontSize(14);
  if (hasBengali) doc.setFont('NotoBengali', 'bold');
  else doc.setFont(fontName, 'bold');
  doc.text(formatAmount(payment.amount || 0), rightBoxX + 4, boxY + 16);
  doc.setFont(fontName, 'italic');
  doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize(String(payment.amountInWords || 'Amount received in full.'), boxW - 8), rightBoxX + 4, boxY + 23.5);

  // Seal
  const sigY = 248;
  doc.line(leftX + 4, sigY, leftX + 56, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('RECEIVED BY', leftX + 30, sigY + 4.5, { align: 'center' });

  if (BISMILLAH_SIGNATURE_DATA_URI) {
    try {
      doc.addImage(BISMILLAH_SIGNATURE_DATA_URI, 'PNG', 146, sigY - 30, 36, 36);
    } catch {}
  }
  doc.line(rightX - 60, sigY, rightX - 4, sigY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.text('BISMILLAH MULTITRADE CORPORATION', rightX - 32, sigY + 4.5, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
