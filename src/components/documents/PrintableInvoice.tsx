import React from 'react';
import { SalesInvoice, CompanySettings } from '../../types';
import { formatCurrency, formatDate, numberToWordsBDT } from '../../utils/formatters';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

interface Props {
  invoice: SalesInvoice;
  settings: CompanySettings;
  showPaymentDetails?: boolean;
}

export const PrintableInvoice: React.FC<Props> = ({ invoice, settings, showPaymentDetails }) => {
  const shouldShowPayment = showPaymentDetails !== undefined ? showPaymentDetails : (invoice.showPaymentDetails === true);
  const totalInWords = numberToWordsBDT(invoice.grandTotal);

  return (
    <div
      id={`printable-invoice-${invoice.id}`}
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-8 font-sans print:p-2 print:max-w-[195mm] print:mx-auto text-sm leading-normal print:text-xs print:leading-normal select-none"
    >
      {/* Header */}
      <div className="border-b border-black pb-4 mb-6 print:pb-3 print:mb-4">
        <div className="flex justify-between items-start gap-5 print:gap-3">
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-2xl print:text-xl font-black tracking-tight text-black uppercase mb-1">
              {settings.companyName}
            </h1>
            <p className="text-black font-bold text-xs print:text-[11px] tracking-wider uppercase mb-2 print:mb-1.5">
              {settings.businessType}
            </p>
            <div className="text-black text-xs print:text-[11px] space-y-1 print:space-y-0.5 leading-snug">
              <p>{settings.address}</p>
              <p>
                <span className="font-semibold">Phone:</span> {settings.phonePrimary}
                {settings.phoneSecondary && ` | ${settings.phoneSecondary}`}
              </p>
              {settings.email && (
                <p>
                  <span className="font-semibold">Email:</span> {settings.email}
                  {settings.website && ` | ${settings.website}`}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Label & Details */}
          <div className="text-right">
            <div className="inline-block border border-black bg-white text-black px-5 py-2 print:px-4 print:py-1 font-black text-xl print:text-sm tracking-widest uppercase mb-3 print:mb-1.5">
              INVOICE
            </div>
            <div className="space-y-1.5 print:space-y-0.5 text-xs print:text-[11px] text-black">
              <p>
                <span className="font-medium">Invoice No:</span>{' '}
                <strong className="font-mono text-sm print:text-xs">{invoice.invoiceNumber}</strong>
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                <strong>{formatDate(invoice.invoiceDate)}</strong>
              </p>
              <p>
                <span className="font-medium">Due Date:</span>{' '}
                <strong>{formatDate(invoice.dueDate)}</strong>
              </p>
              {invoice.poNumber && (
                <p>
                  <span className="font-medium">PO No:</span>{' '}
                  <strong>{invoice.poNumber}</strong>
                </p>
              )}
              {invoice.currency && invoice.currency !== 'BDT' && (
                <p>
                  <span className="font-medium">Currency:</span>{' '}
                  <strong>{invoice.currency} (Rate: BDT {invoice.exchangeRate})</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Bill To & Invoice Info (Bigger boxes, Upper & Lower space created) */}
      <div className="grid grid-cols-2 gap-5 mb-6 print:gap-4 print:mb-4">
        {/* Bill To Box */}
        <div className="border border-black bg-white p-4 print:p-3 flex flex-col justify-between min-h-[120px] print:min-h-[100px]">
          <div>
            <div className="text-xs print:text-[11px] font-black tracking-wider text-black uppercase mb-1.5">
              BILL TO
            </div>
            <p className="font-black text-black text-base print:text-sm">{invoice.customerName}</p>
            {invoice.companyName && invoice.companyName !== invoice.customerName && (
              <p className="text-xs print:text-[11px] font-bold text-black mt-0.5">{invoice.companyName}</p>
            )}
            <p className="text-xs print:text-[11px] text-black mt-1 whitespace-pre-line leading-relaxed print:leading-snug">
              {invoice.customerAddress || 'Address on file'}
            </p>
          </div>
          <div className="mt-3 pt-2 print:mt-1.5 print:pt-1 border-t border-black text-xs print:text-[11px] space-y-1 text-black">
            {invoice.customerPhone && <p><span className="font-medium">Phone:</span> <strong>{invoice.customerPhone}</strong></p>}
            {invoice.customerEmail && <p><span className="font-medium">Email:</span> <strong>{invoice.customerEmail}</strong></p>}
          </div>
        </div>

        {/* Invoice Information Box */}
        <div className="border border-black bg-white p-4 print:p-3 flex flex-col justify-between min-h-[120px] print:min-h-[100px]">
          <div>
            <div className="text-xs print:text-[11px] font-black tracking-wider text-black uppercase mb-2">
              INVOICE INFORMATION
            </div>
            <div className="grid grid-cols-2 gap-y-2 print:gap-y-1 text-xs print:text-[11px] text-black">
              <span className="font-medium">Payment Terms:</span>
              <span className="font-bold">{invoice.paymentTerms || '15 Days Net'}</span>

              {invoice.salesPerson && (
                <>
                  <span className="font-medium">Executive:</span>
                  <span className="font-bold">{invoice.salesPerson}</span>
                </>
              )}

              {invoice.referenceNumber && (
                <>
                  <span className="font-medium">Reference No:</span>
                  <span className="font-bold">{invoice.referenceNumber}</span>
                </>
              )}

              {shouldShowPayment && (
                <>
                  <span className="font-medium">Payment Status:</span>
                  <span className="font-bold uppercase">{invoice.paymentStatus}</span>
                </>
              )}

              <span className="font-medium">Delivery Status:</span>
              <span className="font-bold uppercase">{invoice.deliveryStatus}</span>
            </div>
          </div>
          {invoice.remarks && (
            <div className="mt-2 pt-1.5 border-t border-black text-xs print:text-[11px] text-black">
              <span className="font-medium">Remarks: </span>
              {invoice.remarks}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Items Table (Lower space from boxes, larger row heights & fonts) */}
      <div className="mb-6 print:mb-4">
        <table className="w-full border-collapse text-left text-xs print:text-[11px] border border-black">
          <thead>
            <tr className="bg-white text-black font-black border-b border-black">
              <th className="p-2.5 print:py-2 print:px-2 w-12 text-center border-r border-black">SL</th>
              <th className="p-2.5 print:py-2 print:px-2.5 border-r border-black">Product Details</th>
              <th className="p-2.5 print:py-2 print:px-2 w-20 text-right border-r border-black">Qty</th>
              <th className="p-2.5 print:py-2 print:px-2 w-16 text-center border-r border-black">Unit</th>
              <th className="p-2.5 print:py-2 print:px-2.5 w-28 text-right border-r border-black">Unit Price</th>
              <th className="p-2.5 print:py-2 print:px-2.5 w-32 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-black bg-white"
              >
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-semibold border-r border-black">{index + 1}</td>
                <td className="p-2.5 print:py-2 print:px-2.5 border-r border-black">
                  <p className="font-black text-black text-sm print:text-xs">{item.productName}</p>
                  {item.description && (
                    <p className="text-xs print:text-[10px] text-black leading-snug mt-0.5 font-normal">{item.description}</p>
                  )}
                </td>
                <td className="p-2.5 print:py-2 print:px-2 text-right font-black font-mono text-black border-r border-black">{item.quantity}</td>
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-semibold text-xs print:text-[10px] border-r border-black">{item.unit}</td>
                <td className="p-2.5 print:py-2 print:px-2.5 text-right font-mono text-black border-r border-black">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="p-2.5 print:py-2 print:px-2.5 text-right font-mono font-black text-black">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Area (Bigger boxes, Upper & Lower space created) */}
      <div className="grid grid-cols-12 gap-5 mb-6 print:gap-4 print:mb-4">
        {/* Left: Amount in words & Bank info */}
        <div className="col-span-7 space-y-3 print:space-y-1.5">
          <div className="border border-black bg-white p-4 print:p-3 min-h-[75px]">
            <span className="text-xs print:text-[11px] font-black text-black uppercase tracking-wider block mb-1">
              Amount in Words
            </span>
            <p className="text-xs print:text-[11px] font-bold text-black italic leading-snug">
              {totalInWords}
            </p>
          </div>

          {/* Payment Details (Only shown when requested) */}
          {shouldShowPayment && (settings.bankName || settings.accountNumber || settings.bkashNumber) && (
            <div className="border border-black bg-white p-4 print:p-3 text-xs print:text-[11px] text-black">
              <span className="font-black text-black uppercase tracking-wider text-xs print:text-[11px] block mb-1.5">
                Payment Information
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-black">
                {settings.bankName && <p><span className="font-medium">Bank:</span> <strong>{settings.bankName}</strong></p>}
                {settings.accountName && <p><span className="font-medium">A/C Name:</span> {settings.accountName}</p>}
                {settings.accountNumber && <p><span className="font-medium">A/C No:</span> <strong className="font-mono">{settings.accountNumber}</strong></p>}
                {settings.branchName && <p><span className="font-medium">Branch:</span> {settings.branchName}</p>}
                {settings.routingNumber && <p><span className="font-medium">Routing:</span> {settings.routingNumber}</p>}
                {settings.swiftCode && <p><span className="font-medium">SWIFT:</span> {settings.swiftCode}</p>}
                {settings.bkashNumber && <p><span className="font-medium">bKash:</span> {settings.bkashNumber}</p>}
                {settings.nagadNumber && <p><span className="font-medium">Nagad:</span> {settings.nagadNumber}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calculations */}
        <div className="col-span-5">
          <div className="border border-black bg-white text-xs print:text-[11px] text-black">
            <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {(invoice.itemDiscount > 0 || invoice.overallDiscount > 0) && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">Discount:</span>
                <span className="font-mono font-bold">-{formatCurrency(invoice.itemDiscount + invoice.overallDiscount, invoice.currency)}</span>
              </div>
            )}

            {invoice.vatAmount > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">VAT:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.vatAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">Tax:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.transportCharge > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">Transport Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.transportCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.shippingCharge > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">Shipping Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.shippingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.loadingCharge > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-medium">Loading Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.loadingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.previousDue > 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span className="font-bold">Previous Due:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.previousDue, invoice.currency)}</span>
              </div>
            )}

            {invoice.roundAdjustment !== 0 && (
              <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                <span>Round Adjustment:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.roundAdjustment, invoice.currency)}</span>
              </div>
            )}

            {/* GRAND TOTAL: Normal 1px lines */}
            <div className="flex justify-between p-2.5 px-3 print:py-1.5 print:px-2 bg-white text-black font-black text-sm print:text-xs border-t border-b border-black">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base print:text-sm tracking-tight">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
            </div>

            {/* Paid Amount and Balance Due */}
            {shouldShowPayment && (
              <>
                <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 border-b border-black">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>

                <div className="flex justify-between p-2 px-3 print:py-1 print:px-2 bg-white font-black text-black">
                  <span>Balance Due:</span>
                  <span className="font-mono text-base print:text-xs">
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Signatures Footer - Signature on Top, Name Below */}
      <div className="border-t border-black pt-4 mt-auto print:pt-2 print:mt-1">
        {settings.termsAndConditions && (
          <div className="mb-6 print:mb-2 text-xs print:text-[10px] text-black whitespace-pre-line leading-relaxed print:leading-tight">
            <span className="font-black uppercase tracking-wider block mb-1">Terms &amp; Conditions:</span>
            {settings.termsAndConditions}
          </div>
        )}

        <div className="flex justify-between items-end pt-3 mt-6 print:mt-3 px-4 print:px-2 text-center text-xs print:text-[11px] text-black">
          <div>
            <div className="h-[29mm] print:h-[29mm] flex items-end justify-center pb-1">
              <div className="w-64 print:w-56 border-b border-black"></div>
            </div>
            <div className="pt-1.5 font-black text-black uppercase tracking-wide">
              CUSTOMER SIGNATURE
            </div>
          </div>

          <div className="flex flex-col items-center">
            <img
              src={BISMILLAH_SIGNATURE_DATA_URI}
              alt="Bismillah Multitrade Official Seal & Signature"
              className="w-[29mm] h-[29mm] print:w-[29mm] print:h-[29mm] object-contain mb-1.5 select-none pointer-events-none"
            />
            <div className="w-64 print:w-56 border-b border-black mb-1.5"></div>
            <div className="font-black text-black uppercase tracking-wide leading-tight text-xs print:text-[11px]">
              BISMILLAH MULTITRADE<br />CORPORATION
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
