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
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-8 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-sm leading-normal"
    >
      {/* Header */}
      <div className="border-b border-black pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-black uppercase mb-0.5">
              {settings.companyName}
            </h1>
            <p className="text-black font-semibold text-xs tracking-wider uppercase mb-2">
              {settings.businessType}
            </p>
            <div className="text-black text-xs space-y-0.5 leading-relaxed">
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
            <div className="inline-block border border-black bg-white text-black px-4 py-1.5 font-bold text-lg tracking-widest uppercase mb-3">
              INVOICE
            </div>
            <div className="space-y-1 text-xs text-black">
              <p>
                <span className="font-medium">Invoice No:</span>{' '}
                <strong className="font-mono text-sm">{invoice.invoiceNumber}</strong>
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

      {/* Two Column Bill To & Invoice Info (Normal 1px border) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bill To */}
        <div className="border border-black bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider text-black uppercase mb-1.5">
              BILL TO
            </div>
            <p className="font-bold text-black text-sm">{invoice.customerName}</p>
            {invoice.companyName && invoice.companyName !== invoice.customerName && (
              <p className="text-xs font-semibold text-black">{invoice.companyName}</p>
            )}
            <p className="text-xs text-black mt-1 whitespace-pre-line leading-relaxed">
              {invoice.customerAddress || 'Address on file'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-black text-xs space-y-0.5 text-black">
            {invoice.customerPhone && <p><span className="font-medium">Phone:</span> {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p><span className="font-medium">Email:</span> {invoice.customerEmail}</p>}
          </div>
        </div>

        {/* Invoice Information */}
        <div className="border border-black bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider text-black uppercase mb-1.5">
              INVOICE INFORMATION
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-black">
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
            <div className="mt-2 pt-2 border-t border-black text-xs text-black">
              <span className="font-medium">Remarks: </span>
              {invoice.remarks}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Items Table - Only Product Details, Qty, Unit, Unit Price, Amount (Normal 1px lines) */}
      <div className="mb-6">
        <table className="w-full border-collapse text-left text-xs border border-black">
          <thead>
            <tr className="bg-white text-black font-bold border-b border-black">
              <th className="p-2.5 w-12 text-center border-r border-black">SL</th>
              <th className="p-2.5 border-r border-black">Product Details</th>
              <th className="p-2.5 w-24 text-right border-r border-black">Qty</th>
              <th className="p-2.5 w-20 text-center border-r border-black">Unit</th>
              <th className="p-2.5 w-32 text-right border-r border-black">Unit Price</th>
              <th className="p-2.5 w-36 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-black bg-white"
              >
                <td className="p-2.5 text-center text-black font-medium border-r border-black">{index + 1}</td>
                <td className="p-2.5 border-r border-black">
                  <p className="font-bold text-black text-xs">{item.productName}</p>
                  {item.description && (
                    <p className="text-[11px] text-black leading-snug mt-0.5 font-normal">{item.description}</p>
                  )}
                </td>
                <td className="p-2.5 text-right font-bold font-mono text-black border-r border-black">{item.quantity}</td>
                <td className="p-2.5 text-center text-black font-medium text-xs border-r border-black">{item.unit}</td>
                <td className="p-2.5 text-right font-mono text-black border-r border-black">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="p-2.5 text-right font-mono font-bold text-black">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Area (Normal 1px borders) */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left: Amount in words & Bank info */}
        <div className="col-span-7 space-y-4">
          <div className="border border-black bg-white p-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider block mb-1">
              Amount in Words
            </span>
            <p className="text-xs font-bold text-black italic">
              {totalInWords}
            </p>
          </div>

          {/* Payment Details (Only shown when requested) */}
          {shouldShowPayment && (settings.bankName || settings.accountNumber || settings.bkashNumber) && (
            <div className="border border-black bg-white p-4 text-xs text-black">
              <span className="font-bold text-black uppercase tracking-wider text-xs block mb-2">
                Payment Information
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-black">
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
          <div className="border border-black bg-white text-xs text-black">
            <div className="flex justify-between p-2 px-3 border-b border-black">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {(invoice.itemDiscount > 0 || invoice.overallDiscount > 0) && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">Discount:</span>
                <span className="font-mono font-bold">-{formatCurrency(invoice.itemDiscount + invoice.overallDiscount, invoice.currency)}</span>
              </div>
            )}

            {invoice.vatAmount > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">VAT:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.vatAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">Tax:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.transportCharge > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">Transport Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.transportCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.shippingCharge > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">Shipping Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.shippingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.loadingCharge > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-medium">Loading Charge:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.loadingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.previousDue > 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black">
                <span className="font-bold">Previous Due:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.previousDue, invoice.currency)}</span>
              </div>
            )}

            {invoice.roundAdjustment !== 0 && (
              <div className="flex justify-between p-2 px-3 border-b border-black text-xs">
                <span>Round Adjustment:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.roundAdjustment, invoice.currency)}</span>
              </div>
            )}

            {/* GRAND TOTAL: Normal 1px lines */}
            <div className="flex justify-between p-2.5 px-3 bg-white text-black font-black text-sm border-t border-b border-black">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base tracking-tight">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
            </div>

            {/* Paid Amount and Balance Due */}
            {shouldShowPayment && (
              <>
                <div className="flex justify-between p-2 px-3 border-b border-black">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>

                <div className="flex justify-between p-2 px-3 bg-white font-bold text-black">
                  <span>Balance Due:</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Signatures Footer - Signature on Top, Name Below */}
      <div className="border-t border-black pt-4 mt-auto">
        {settings.termsAndConditions && (
          <div className="mb-6 text-xs text-black whitespace-pre-line leading-relaxed">
            <span className="font-bold uppercase tracking-wider block mb-1">Terms &amp; Conditions:</span>
            {settings.termsAndConditions}
          </div>
        )}

        <div className="flex justify-between items-end pt-2 mt-4 print:mt-2 px-4 text-center text-xs text-black">
          <div>
            <div className="h-[32mm] flex items-end justify-center pb-1">
              <div className="w-52 border-b border-black"></div>
            </div>
            <div className="pt-1.5 font-bold text-black uppercase tracking-wide">CUSTOMER SIGNATURE</div>
          </div>

          <div>
            <div className="h-[32mm] flex flex-col items-center justify-end pb-1">
              <img
                src={BISMILLAH_SIGNATURE_DATA_URI}
                alt="Bismillah Multitrade Official Seal & Signature"
                className="w-[29mm] h-[29mm] object-contain mb-0.5 select-none pointer-events-none"
              />
              <div className="w-64 border-b border-black"></div>
            </div>
            <div className="pt-1.5 font-bold text-black uppercase tracking-wide">
              BISMILLAH MULTITRADE CORPORATION
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
