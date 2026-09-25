import React from 'react';
import { SalesInvoice, CompanySettings, DeliverySlip } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Scissors } from 'lucide-react';

interface Props {
  invoice: SalesInvoice;
  settings: CompanySettings;
  deliverySlip?: DeliverySlip;
  showPaymentDetails?: boolean;
}

export const PrintableInvoiceAndChallan: React.FC<Props> = ({
  invoice,
  settings,
  deliverySlip,
  showPaymentDetails = false
}) => {
  const challanNo = deliverySlip?.deliverySlipNumber || `DC-${invoice.invoiceNumber.replace(/^INV-?/i, '')}`;
  const totalQty = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="bg-white text-zinc-950 w-full max-w-4xl mx-auto p-4 sm:p-6 font-sans print:p-2 print:max-w-none text-[11px] leading-tight print:leading-none">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .same-page-container {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="same-page-container flex flex-col justify-between" style={{ minHeight: '960px' }}>
        {/* ========================================================================= */}
        {/* SECTION 1: SALES INVOICE (Top Half) */}
        {/* ========================================================================= */}
        <div className="border border-zinc-300 rounded-lg p-3.5 mb-2 bg-white relative">
          {/* Header */}
          <div className="border-b border-amber-500 pb-2 mb-2 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-zinc-950 uppercase">
                  {settings.companyName}
                </h1>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                  {settings.businessType || 'Commercial & Indenting Concern'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">{settings.address}</p>
              <div className="text-[10px] text-zinc-600 flex flex-wrap gap-x-2">
                <span><strong>Phone:</strong> {settings.phonePrimary}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="inline-block bg-amber-500 text-zinc-950 px-2.5 py-0.5 font-black text-xs tracking-wider uppercase rounded-sm">
                SALES INVOICE
              </div>
              <div className="text-[10px] text-zinc-700 mt-1 space-y-0.5 font-mono">
                <p>Inv No: <strong className="text-zinc-900">{invoice.invoiceNumber}</strong></p>
                <p>Date: {formatDate(invoice.invoiceDate)}</p>
                {invoice.poNumber && <p>PO: {invoice.poNumber}</p>}
              </div>
            </div>
          </div>

          {/* Bill To & Meta */}
          <div className="grid grid-cols-12 gap-2 mb-2 bg-zinc-50/80 p-2 rounded border border-zinc-200 text-[10px]">
            <div className="col-span-8">
              <span className="font-bold text-amber-900 uppercase text-[9px] block">Bill To / Customer:</span>
              <p className="font-bold text-zinc-900 text-xs">{invoice.customerName}</p>
              {invoice.companyName && invoice.companyName !== invoice.customerName && (
                <p className="text-zinc-700 font-semibold">{invoice.companyName}</p>
              )}
              <p className="text-zinc-600">{invoice.customerAddress || 'Address on record'}</p>
              <p className="text-zinc-500">
                {invoice.customerPhone && <span>Phone: {invoice.customerPhone}</span>}
              </p>
            </div>
            <div className="col-span-4 text-right space-y-0.5 border-l border-zinc-200 pl-2">
              <p><span className="text-zinc-500">Terms:</span> <strong>{invoice.paymentTerms || 'Cash / Credit'}</strong></p>
              {invoice.salesPerson && <p><span className="text-zinc-500">Sales:</span> {invoice.salesPerson}</p>}
              {showPaymentDetails && (
                <p>
                  <span className="text-zinc-500">Status:</span>{' '}
                  <span className="font-bold text-amber-900">{invoice.paymentStatus}</span>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse text-left text-[10px] mb-2">
            <thead>
              <tr className="bg-zinc-900 text-white font-semibold">
                <th className="p-1 w-6 text-center">SL</th>
                <th className="p-1">Product Description / Specifications</th>
                <th className="p-1 w-12 text-center">Unit</th>
                <th className="p-1 w-12 text-right">Qty</th>
                <th className="p-1 w-16 text-right">Rate</th>
                <th className="p-1 w-20 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className={`border-b border-zinc-200 ${idx % 2 === 1 ? 'bg-zinc-50/50' : ''}`}>
                  <td className="p-1 text-center text-zinc-500">{idx + 1}</td>
                  <td className="p-1">
                    <span className="font-bold text-zinc-900">{item.productName}</span>
                    {item.description && <span className="text-zinc-500 block text-[9px]">{item.description}</span>}
                  </td>
                  <td className="p-1 text-center text-zinc-600">{item.unit}</td>
                  <td className="p-1 text-right font-semibold text-zinc-900">{item.quantity}</td>
                  <td className="p-1 text-right font-mono text-zinc-700">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="p-1 text-right font-mono font-bold text-zinc-950">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary: Grand Total & (Optional) Payment Details */}
          <div className="grid grid-cols-12 gap-2 items-start text-[10px]">
            <div className="col-span-7">
              <p className="text-zinc-600 italic">
                <strong className="text-zinc-800 not-italic">In Words:</strong> {invoice.amountInWords}
              </p>
              
              {/* Payment Details shown ONLY if showPaymentDetails is true */}
              {showPaymentDetails && (
                <div className="mt-1.5 p-1.5 bg-amber-50/60 border border-amber-200 rounded text-[9px] text-zinc-700">
                  <span className="font-bold text-amber-900 uppercase block mb-0.5">Payment Bank / MFS Details:</span>
                  <div className="grid grid-cols-2 gap-x-2">
                    <p>Bank: <strong>{settings.bankName}</strong></p>
                    <p>A/C: <strong className="font-mono">{settings.accountNumber}</strong></p>
                    {settings.bkashNumber && <p>bKash: {settings.bkashNumber}</p>}
                    {settings.nagadNumber && <p>Nagad: {settings.nagadNumber}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="border border-zinc-300 rounded overflow-hidden text-[10px]">
                <div className="flex justify-between p-1 px-2 border-b border-zinc-200">
                  <span className="text-zinc-600">Subtotal:</span>
                  <span className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {(invoice.overallDiscount > 0 || invoice.itemDiscount > 0) && (
                  <div className="flex justify-between p-1 px-2 border-b border-zinc-200 text-red-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(invoice.overallDiscount + invoice.itemDiscount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.vatAmount > 0 && (
                  <div className="flex justify-between p-1 px-2 border-b border-zinc-200 text-zinc-600">
                    <span>VAT ({invoice.items[0]?.vatRate || 5}%):</span>
                    <span className="font-mono">{formatCurrency(invoice.vatAmount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.previousDue > 0 && (
                  <div className="flex justify-between p-1 px-2 border-b border-zinc-200 text-amber-900 bg-amber-50/40">
                    <span>Previous Due:</span>
                    <span className="font-mono">{formatCurrency(invoice.previousDue, invoice.currency)}</span>
                  </div>
                )}
                {/* Grand Total */}
                <div className="flex justify-between p-1 px-2 bg-amber-400 font-black text-zinc-950">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-xs">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                </div>
                {/* Paid & Due ONLY if payment option is checked */}
                {showPaymentDetails && (
                  <>
                    <div className="flex justify-between p-1 px-2 border-t border-zinc-200 text-emerald-800 bg-emerald-50/50">
                      <span>Paid Amount:</span>
                      <span className="font-mono font-bold">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between p-1 px-2 bg-zinc-100 font-bold">
                      <span>Balance Due:</span>
                      <span className={`font-mono ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {formatCurrency(invoice.balanceDue, invoice.currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Signatures */}
          <div className="flex justify-between items-end pt-4 mt-2 text-center text-[9px] text-zinc-600 px-3">
            <div>
              <div className="h-10 flex items-end justify-center pb-0.5">
                <div className="w-32 border-b border-zinc-400"></div>
              </div>
              <div className="pt-1 font-bold text-zinc-800 uppercase">Customer Acceptance</div>
              <p className="text-[8px] text-zinc-400">Received Goods in Good Condition</p>
            </div>
            <div>
              <div className="h-10 flex flex-col items-center justify-end pb-0.5">
                <span className="font-serif italic text-xs text-zinc-800">
                  {settings.authorizedSignatureName}
                </span>
                <div className="w-36 border-b border-zinc-500 mt-0.5"></div>
              </div>
              <div className="pt-1 font-bold text-zinc-900 uppercase">
                {settings.authorizedSignatureName}
              </div>
              <p className="text-[8px] text-zinc-500 font-semibold">Bismillah Multitrade Corporation</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PERFORATION SEPARATOR (CUT LINE) */}
        {/* ========================================================================= */}
        <div className="my-1.5 flex items-center justify-center gap-2 text-zinc-400 text-[10px] font-mono select-none">
          <div className="flex-1 border-b-2 border-dashed border-zinc-300"></div>
          <span className="flex items-center gap-1 font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[9px] uppercase tracking-wider">
            <Scissors size={11} className="text-zinc-500" />
            <span>Delivery Challan / চালান (Separate Along Perforation)</span>
          </span>
          <div className="flex-1 border-b-2 border-dashed border-zinc-300"></div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: DELIVERY CHALLAN (Bottom Half) */}
        {/* ========================================================================= */}
        <div className="border border-zinc-300 rounded-lg p-3.5 bg-white relative">
          {/* Challan Header */}
          <div className="border-b border-blue-600 pb-2 mb-2 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-zinc-950 uppercase">
                  {settings.companyName}
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-300">
                  DELIVERY CHALLAN / চালান
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5">{settings.address} • Phone: {settings.phonePrimary}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="inline-block bg-blue-600 text-white px-2.5 py-0.5 font-black text-xs tracking-wider uppercase rounded-sm">
                DELIVERY CHALLAN
              </div>
              <div className="text-[10px] text-zinc-700 mt-1 space-y-0.5 font-mono">
                <p>Challan No: <strong className="text-zinc-900">{challanNo}</strong></p>
                <p>Ref Invoice: <strong>{invoice.invoiceNumber}</strong></p>
                <p>Delivery Date: {formatDate(deliverySlip?.deliveryDate || invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Recipient & Transport Meta */}
          <div className="grid grid-cols-12 gap-2 mb-2 bg-blue-50/40 p-2 rounded border border-blue-200 text-[10px]">
            <div className="col-span-7">
              <span className="font-bold text-blue-900 uppercase text-[9px] block">Deliver To / Consignee:</span>
              <p className="font-bold text-zinc-900 text-xs">{deliverySlip?.customerName || invoice.customerName}</p>
              <p className="text-zinc-700 font-medium">{deliverySlip?.companyName || invoice.companyName}</p>
              <p className="text-zinc-600">{deliverySlip?.deliveryAddress || invoice.customerAddress || 'Customer Warehouse / Site Address'}</p>
              <p className="text-zinc-500">Contact: {deliverySlip?.contactPerson || invoice.customerName} • {deliverySlip?.phone || invoice.customerPhone}</p>
            </div>
            <div className="col-span-5 text-right space-y-0.5 border-l border-blue-200 pl-2 text-zinc-700">
              <p><span className="text-zinc-500">Transport Method:</span> <strong>{deliverySlip?.deliveryMethod || 'Direct Company Transport'}</strong></p>
              {deliverySlip?.vehicleNumber && (
                <p><span className="text-zinc-500">Vehicle No:</span> <strong className="font-mono">{deliverySlip.vehicleNumber}</strong></p>
              )}
              {deliverySlip?.driverName && (
                <p><span className="text-zinc-500">Driver:</span> {deliverySlip.driverName} {deliverySlip.driverPhone && `(${deliverySlip.driverPhone})`}</p>
              )}
              <p><span className="text-zinc-500">Delivery Status:</span> <strong className="text-blue-900">{deliverySlip?.deliveryStatus || 'Dispatched for Delivery'}</strong></p>
            </div>
          </div>

          {/* Challan Items Table */}
          <table className="w-full border-collapse text-left text-[10px] mb-2">
            <thead>
              <tr className="bg-zinc-800 text-white font-semibold">
                <th className="p-1 w-6 text-center">SL</th>
                <th className="p-1">Product Description / Items Delivered</th>
                <th className="p-1 w-14 text-center">Unit</th>
                <th className="p-1 w-16 text-right">Order Qty</th>
                <th className="p-1 w-20 text-right font-bold text-amber-300">Delivered Qty</th>
                <th className="p-1 w-32 text-center">Condition / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const deliveredCount = deliverySlip
                  ? (deliverySlip.items.find(di => di.productId === item.productId)?.deliveredQuantity ?? item.quantity)
                  : item.quantity;

                return (
                  <tr key={item.id || idx} className={`border-b border-zinc-200 ${idx % 2 === 1 ? 'bg-zinc-50/50' : ''}`}>
                    <td className="p-1 text-center text-zinc-500">{idx + 1}</td>
                    <td className="p-1">
                      <span className="font-bold text-zinc-900">{item.productName}</span>
                      {item.description && <span className="text-zinc-500 block text-[9px]">{item.description}</span>}
                    </td>
                    <td className="p-1 text-center text-zinc-600">{item.unit}</td>
                    <td className="p-1 text-right text-zinc-600">{item.quantity}</td>
                    <td className="p-1 text-right font-bold font-mono text-zinc-950 text-xs">
                      {deliveredCount}
                    </td>
                    <td className="p-1 text-center text-[9px] text-zinc-500">
                      Good Condition / Sealed Pack
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-100 font-bold border-t border-zinc-300">
                <td colSpan={3} className="p-1 text-right text-zinc-700">Total Units:</td>
                <td className="p-1 text-right">{totalQty}</td>
                <td className="p-1 text-right font-black text-zinc-950">{totalQty}</td>
                <td className="p-1 text-center text-zinc-500 text-[9px]">Verified Count</td>
              </tr>
            </tfoot>
          </table>

          {/* Acknowledgement statement & Signatures */}
          <div className="bg-zinc-50 border border-zinc-200 rounded p-1.5 text-[9px] text-zinc-600 mb-3">
            <p>
              <strong>Goods Acceptance Declaration:</strong> Received all merchandise listed above in sound condition, correct specifications, and satisfactory count. No claims for damages or short delivery will be entertained after departure of delivery transport.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center text-[8.5px] text-zinc-600 pt-3 items-end">
            <div>
              <div className="border-t border-zinc-400 pt-1">Prepared By</div>
              <p className="text-[7.5px] text-zinc-400">Billing Desk</p>
            </div>
            <div>
              <div className="border-t border-zinc-400 pt-1">Warehouse Keeper</div>
              <p className="text-[7.5px] text-zinc-400">Goods Dispatched</p>
            </div>
            <div>
              <div className="border-t border-zinc-400 pt-1">Carrier / Driver</div>
              <p className="text-[7.5px] text-zinc-400">{deliverySlip?.driverName || 'Transport Staff'}</p>
            </div>
            <div>
              <div className="border-t border-zinc-900 pt-1 font-bold text-zinc-900">
                Receiver's Signature
              </div>
              <p className="text-[7.5px] text-zinc-500">Acknowledged</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
