import React from 'react';
import { SalesInvoice, CompanySettings, DeliverySlip } from '../../types';
import { formatCurrency, formatDate, numberToWordsBDT } from '../../utils/formatters';
import { Scissors } from 'lucide-react';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

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
  const totalInWords = numberToWordsBDT(invoice.grandTotal);

  return (
    <div className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-4 sm:p-6 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-[11px] leading-tight print:leading-none">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
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
        <div className="border border-black p-3.5 mb-2 bg-white relative">
          {/* Header */}
          <div className="border-b border-black pb-2 mb-2 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-black uppercase">
                  {settings.companyName}
                </h1>
                <span className="text-[10px] text-black font-bold uppercase">
                  {settings.businessType || 'Commercial & Indenting Concern'}
                </span>
              </div>
              <p className="text-[10px] text-black mt-0.5">{settings.address}</p>
              <div className="text-[10px] text-black flex flex-wrap gap-x-2">
                <span><strong>Phone:</strong> {settings.phonePrimary}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="inline-block border border-black bg-white text-black px-2.5 py-0.5 font-bold text-xs tracking-wider uppercase">
                SALES INVOICE
              </div>
              <div className="text-[10px] text-black mt-1 space-y-0.5 font-mono">
                <p>Inv No: <strong>{invoice.invoiceNumber}</strong></p>
                <p>Date: {formatDate(invoice.invoiceDate)}</p>
                {invoice.poNumber && <p>PO: {invoice.poNumber}</p>}
              </div>
            </div>
          </div>

          {/* Bill To & Meta */}
          <div className="grid grid-cols-12 gap-2 mb-2 p-2 border border-black text-[10px] bg-white">
            <div className="col-span-8">
              <span className="font-bold text-black uppercase text-[9px] block">Bill To:</span>
              <p className="font-bold text-black text-xs">{invoice.customerName}</p>
              {invoice.companyName && invoice.companyName !== invoice.customerName && (
                <p className="text-black font-semibold">{invoice.companyName}</p>
              )}
              <p className="text-black">{invoice.customerAddress || 'Address on record'}</p>
              <p className="text-black">
                {invoice.customerPhone && <span>Phone: {invoice.customerPhone}</span>}
              </p>
            </div>
            <div className="col-span-4 text-right space-y-0.5 border-l border-black pl-2">
              <p><span className="font-medium">Terms:</span> <strong>{invoice.paymentTerms || 'Cash / Credit'}</strong></p>
              {invoice.salesPerson && <p><span className="font-medium">Executive:</span> {invoice.salesPerson}</p>}
              {showPaymentDetails && (
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="font-bold uppercase">{invoice.paymentStatus}</span>
                </p>
              )}
            </div>
          </div>

          {/* Items Table - Product Details only */}
          <table className="w-full border-collapse text-left text-[10px] mb-2 border border-black">
            <thead>
              <tr className="bg-white text-black font-bold border-b border-black">
                <th className="p-1 w-6 text-center border-r border-black">SL</th>
                <th className="p-1 border-r border-black">Product Details</th>
                <th className="p-1 w-12 text-center border-r border-black">Unit</th>
                <th className="p-1 w-12 text-right border-r border-black">Qty</th>
                <th className="p-1 w-16 text-right border-r border-black">Rate</th>
                <th className="p-1 w-20 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-black bg-white">
                  <td className="p-1 text-center text-black border-r border-black">{idx + 1}</td>
                  <td className="p-1 border-r border-black">
                    <span className="font-bold text-black">{item.productName}</span>
                    {item.description && <span className="text-black block text-[9px]">{item.description}</span>}
                  </td>
                  <td className="p-1 text-center text-black border-r border-black">{item.unit}</td>
                  <td className="p-1 text-right font-semibold text-black border-r border-black">{item.quantity}</td>
                  <td className="p-1 text-right font-mono text-black border-r border-black">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="p-1 text-right font-mono font-bold text-black">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary: Grand Total & Words */}
          <div className="grid grid-cols-12 gap-2 items-start text-[10px]">
            <div className="col-span-7">
              <p className="text-black italic">
                <strong className="not-italic">In Words:</strong> {totalInWords}
              </p>
            </div>

            <div className="col-span-5">
              <div className="border border-black text-[10px] bg-white">
                <div className="flex justify-between p-1 px-2 border-b border-black">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {(invoice.overallDiscount > 0 || invoice.itemDiscount > 0) && (
                  <div className="flex justify-between p-1 px-2 border-b border-black">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(invoice.overallDiscount + invoice.itemDiscount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between p-1 px-2 border-t border-black font-bold text-black">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Signatures - Line on Top, Name Below */}
          <div className="flex justify-between items-end pt-3 mt-2 text-center text-[9px] text-black px-3">
            <div>
              <div className="h-[31mm] flex items-end justify-center pb-0.5">
                <div className="w-32 border-b border-black"></div>
              </div>
              <div className="pt-1 font-bold text-black uppercase">Customer Signature</div>
            </div>
            <div>
              <div className="h-[31mm] flex flex-col items-center justify-end pb-0.5">
                <img
                  src={BISMILLAH_SIGNATURE_DATA_URI}
                  alt="Bismillah Multitrade Official Seal & Signature"
                  className="w-[29mm] h-[29mm] object-contain mb-0.5 select-none pointer-events-none"
                />
                <div className="w-36 border-b border-black"></div>
              </div>
              <div className="pt-1 font-bold text-black uppercase">
                BISMILLAH MULTITRADE CORPORATION
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PERFORATION SEPARATOR (CUT LINE) */}
        {/* ========================================================================= */}
        <div className="my-1.5 flex items-center justify-center gap-2 text-black text-[10px] font-mono select-none">
          <div className="flex-1 border-b border-dashed border-black"></div>
          <span className="flex items-center gap-1 font-bold text-black bg-white px-2 py-0.5 border border-black text-[9px] uppercase tracking-wider">
            <Scissors size={11} className="text-black" />
            <span>Delivery Challan (Separate Along Perforation)</span>
          </span>
          <div className="flex-1 border-b border-dashed border-black"></div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: DELIVERY CHALLAN (Bottom Half) */}
        {/* ========================================================================= */}
        <div className="border border-black p-3.5 bg-white relative">
          {/* Challan Header */}
          <div className="border-b border-black pb-2 mb-2 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-black uppercase">
                  {settings.companyName}
                </h2>
                <span className="text-[10px] font-bold text-black uppercase">
                  DELIVERY CHALLAN
                </span>
              </div>
              <p className="text-[10px] text-black mt-0.5">{settings.address} • Phone: {settings.phonePrimary}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="inline-block border border-black bg-white text-black px-2.5 py-0.5 font-bold text-xs tracking-wider uppercase">
                DELIVERY CHALLAN
              </div>
              <div className="text-[10px] text-black mt-1 space-y-0.5 font-mono">
                <p>Challan No: <strong>{challanNo}</strong></p>
                <p>Ref Invoice: <strong>{invoice.invoiceNumber}</strong></p>
                <p>Delivery Date: {formatDate(deliverySlip?.deliveryDate || invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>

          {/* Delivery Recipient & Transport Meta */}
          <div className="grid grid-cols-12 gap-2 mb-2 p-2 border border-black text-[10px] bg-white">
            <div className="col-span-7">
              <span className="font-bold text-black uppercase text-[9px] block">Deliver To:</span>
              <p className="font-bold text-black text-xs">{deliverySlip?.customerName || invoice.customerName}</p>
              <p className="text-black">{deliverySlip?.deliveryAddress || invoice.customerAddress || 'Customer Warehouse'}</p>
              <p className="text-black">Contact: {deliverySlip?.contactPerson || invoice.customerName} • {deliverySlip?.phone || invoice.customerPhone}</p>
            </div>
            <div className="col-span-5 text-right space-y-0.5 border-l border-black pl-2 text-black">
              <p><span className="font-medium">Method:</span> <strong>{deliverySlip?.deliveryMethod || 'Courier'}</strong></p>
              <p><span className="font-medium">Status:</span> <strong>{deliverySlip?.deliveryStatus || 'Dispatched'}</strong></p>
            </div>
          </div>

          {/* Challan Items Table - Description only */}
          <table className="w-full border-collapse text-left text-[10px] mb-2 border border-black">
            <thead>
              <tr className="bg-white text-black font-bold border-b border-black">
                <th className="p-1 w-6 text-center border-r border-black">SL</th>
                <th className="p-1 border-r border-black">Description</th>
                <th className="p-1 w-14 text-center border-r border-black">Unit</th>
                <th className="p-1 w-24 text-right">Delivered Qty</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const slipItem = deliverySlip?.items.find(di => di.productId === item.productId);
                const deliveredCount = slipItem?.deliveredQuantity ?? item.quantity;
                const boxInfo = slipItem?.boxCount || slipItem?.boxes || '-';
                const weightInfo = slipItem?.weight ? (typeof slipItem.weight === 'number' ? `${slipItem.weight} kg` : slipItem.weight) : '-';

                return (
                  <tr key={item.id || idx} className="border-b border-black bg-white">
                    <td className="p-1 text-center text-black border-r border-black">{idx + 1}</td>
                    <td className="p-1 border-r border-black">
                      <span className="font-bold text-black">{item.productName}</span>
                      {item.description && <span className="text-black block text-[9px] font-normal">{item.description}</span>}
                      <div className="text-[9px] text-black mt-0.5 flex flex-wrap gap-x-3">
                        <span><strong>Box:</strong> {boxInfo}</span>
                        <span><strong>Weight:</strong> {weightInfo}</span>
                      </div>
                    </td>
                    <td className="p-1 text-center text-black border-r border-black">{item.unit}</td>
                    <td className="p-1 text-right font-bold font-mono text-black text-xs">
                      {deliveredCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-white font-bold border-t border-black">
                <td colSpan={3} className="p-1 text-right text-black border-r border-black">Total Delivered:</td>
                <td className="p-1 text-right font-black font-mono text-black">{totalQty}</td>
              </tr>
            </tfoot>
          </table>

          {/* Challan Signature - Signature on Top, Name Below */}
          <div className="pt-4 border-t border-black flex justify-end">
            <div className="text-center w-52">
              <div className="h-[31mm] flex flex-col items-center justify-end pb-0.5">
                <img
                  src={BISMILLAH_SIGNATURE_DATA_URI}
                  alt="Bismillah Multitrade Official Seal & Signature"
                  className="w-[29mm] h-[29mm] object-contain mb-0.5 select-none pointer-events-none"
                />
                <div className="w-48 border-b border-black"></div>
              </div>
              <div className="pt-1 font-bold text-black uppercase text-[9px]">
                BISMILLAH MULTITRADE CORPORATION
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
