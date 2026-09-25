import React from 'react';
import { SalesInvoice, CompanySettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  invoice: SalesInvoice;
  settings: CompanySettings;
  showPaymentDetails?: boolean;
}

export const PrintableInvoice: React.FC<Props> = ({ invoice, settings, showPaymentDetails }) => {
  const shouldShowPayment = showPaymentDetails !== undefined ? showPaymentDetails : (invoice.showPaymentDetails === true);
  return (
    <div className="bg-white text-zinc-900 w-full max-w-4xl mx-auto p-8 font-sans print:p-0 print:max-w-none text-sm leading-normal">
      {/* Header */}
      <div className="border-b-2 border-amber-500 pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase mb-0.5">
              {settings.companyName}
            </h1>
            <p className="text-amber-700 font-semibold text-xs tracking-wider uppercase mb-2">
              {settings.businessType}
            </p>
            <div className="text-zinc-600 text-xs space-y-0.5 leading-relaxed">
              <p>{settings.address}</p>
              <p>
                <span className="font-medium text-zinc-800">Phone:</span> {settings.phonePrimary}
                {settings.phoneSecondary && ` | ${settings.phoneSecondary}`}
              </p>
              {settings.email && (
                <p>
                  <span className="font-medium text-zinc-800">Email:</span> {settings.email}
                  {settings.website && ` | ${settings.website}`}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Label & Details */}
          <div className="text-right">
            <div className="inline-block bg-amber-500 text-zinc-950 px-4 py-1.5 font-extrabold text-xl tracking-widest uppercase mb-3">
              INVOICE
            </div>
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-zinc-500">Invoice No:</span>{' '}
                <strong className="font-mono text-sm text-zinc-900">{invoice.invoiceNumber}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Date:</span>{' '}
                <strong className="text-zinc-900">{formatDate(invoice.invoiceDate)}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Due Date:</span>{' '}
                <strong className="text-zinc-900">{formatDate(invoice.dueDate)}</strong>
              </p>
              {invoice.poNumber && (
                <p>
                  <span className="text-zinc-500">PO No:</span>{' '}
                  <strong className="text-zinc-900">{invoice.poNumber}</strong>
                </p>
              )}
              {invoice.currency && invoice.currency !== 'BDT' && (
                <p>
                  <span className="text-zinc-500">Currency:</span>{' '}
                  <strong className="text-zinc-900">{invoice.currency} (Rate: ৳{invoice.exchangeRate})</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Bill To & Invoice Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bill To */}
        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase mb-1">
            BILL TO
          </div>
          <p className="font-bold text-zinc-900 text-sm">{invoice.customerName}</p>
          {invoice.companyName && invoice.companyName !== invoice.customerName && (
            <p className="text-xs font-semibold text-zinc-700">{invoice.companyName}</p>
          )}
          <p className="text-xs text-zinc-600 mt-1 whitespace-pre-line leading-relaxed">
            {invoice.customerAddress || 'Address on file'}
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-200 text-xs space-y-0.5 text-zinc-600">
            {invoice.customerPhone && <p><span className="text-zinc-500">Phone:</span> {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p><span className="text-zinc-500">Email:</span> {invoice.customerEmail}</p>}
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase mb-1">
            INVOICE INFORMATION
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs text-zinc-700">
            <span className="text-zinc-500">Payment Terms:</span>
            <span className="font-medium text-zinc-900">{invoice.paymentTerms || '15 Days Net'}</span>

            {invoice.salesPerson && (
              <>
                <span className="text-zinc-500">Sales Representative:</span>
                <span className="font-medium text-zinc-900">{invoice.salesPerson}</span>
              </>
            )}

            {invoice.referenceNumber && (
              <>
                <span className="text-zinc-500">Reference No:</span>
                <span className="font-medium text-zinc-900">{invoice.referenceNumber}</span>
              </>
            )}

            {shouldShowPayment && (
              <>
                <span className="text-zinc-500">Payment Status:</span>
                <span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    invoice.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.paymentStatus === 'Partially Paid'
                      ? 'bg-blue-100 text-blue-800'
                      : invoice.paymentStatus === 'Overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {invoice.paymentStatus}
                  </span>
                </span>
              </>
            )}

            <span className="text-zinc-500">Delivery Status:</span>
            <span className="font-medium text-zinc-900">{invoice.deliveryStatus}</span>
          </div>
          {invoice.remarks && (
            <div className="mt-2 pt-2 border-t border-zinc-200 text-xs text-zinc-600">
              <span className="text-zinc-500 font-medium">Remarks: </span>
              {invoice.remarks}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white font-semibold border border-zinc-900">
              <th className="p-2 w-10 text-center">SL</th>
              <th className="p-2">Description / Product Details</th>
              <th className="p-2 w-24">HS Code</th>
              <th className="p-2 w-16 text-right">Qty</th>
              <th className="p-2 w-14 text-center">Unit</th>
              <th className="p-2 w-24 text-right">Unit Price</th>
              <th className="p-2 w-20 text-right">Disc.</th>
              <th className="p-2 w-16 text-right">VAT</th>
              <th className="p-2 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => {
              const lineBase = item.quantity * item.unitPrice;
              const discount = item.discountType === 'percentage'
                ? (lineBase * item.discountValue) / 100
                : item.discountValue;

              return (
                <tr
                  key={item.id || index}
                  className={`border border-zinc-200 ${index % 2 === 1 ? 'bg-zinc-50/60' : 'bg-white'}`}
                >
                  <td className="p-2 text-center text-zinc-500 font-medium">{index + 1}</td>
                  <td className="p-2">
                    <p className="font-bold text-zinc-900 text-xs">{item.productName}</p>
                    {item.description && (
                      <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="p-2 font-mono text-[11px] text-zinc-600">{item.hsCode || '-'}</td>
                  <td className="p-2 text-right font-medium text-zinc-800">{item.quantity}</td>
                  <td className="p-2 text-center text-zinc-600 text-[11px]">{item.unit}</td>
                  <td className="p-2 text-right font-mono text-zinc-700">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="p-2 text-right font-mono text-zinc-500">
                    {discount > 0 ? `-${formatCurrency(discount, invoice.currency)}` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono text-zinc-500">
                    {item.vatRate > 0 ? `${item.vatRate}%` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-zinc-900">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Area */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left: Amount in words & Bank info */}
        <div className="col-span-7 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
              Amount in Words
            </span>
            <p className="text-xs font-semibold text-zinc-800 italic">
              {invoice.amountInWords}
            </p>
          </div>

          {/* Payment Details - Only shown when Payment Option is ticked and bank info exists */}
          {shouldShowPayment && (settings.bankName || settings.accountNumber || settings.bkashNumber) && (
            <div className="border border-zinc-200 rounded p-3 text-xs bg-zinc-50">
              <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] block mb-1.5 text-amber-800">
                Payment Information
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-zinc-700">
                {settings.bankName && <p><span className="text-zinc-500">Bank:</span> <strong>{settings.bankName}</strong></p>}
                {settings.accountName && <p><span className="text-zinc-500">A/C Name:</span> {settings.accountName}</p>}
                {settings.accountNumber && <p><span className="text-zinc-500">A/C No:</span> <strong className="font-mono text-zinc-900">{settings.accountNumber}</strong></p>}
                {settings.branchName && <p><span className="text-zinc-500">Branch:</span> {settings.branchName}</p>}
                {settings.routingNumber && <p><span className="text-zinc-500">Routing:</span> {settings.routingNumber}</p>}
                {settings.swiftCode && <p><span className="text-zinc-500">SWIFT:</span> {settings.swiftCode}</p>}
                {settings.bkashNumber && <p><span className="text-zinc-500">bKash:</span> {settings.bkashNumber}</p>}
                {settings.nagadNumber && <p><span className="text-zinc-500">Nagad:</span> {settings.nagadNumber}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calculations */}
        <div className="col-span-5">
          <div className="border border-zinc-300 rounded overflow-hidden text-xs">
            <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200">
              <span className="text-zinc-600">Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {invoice.itemDiscount > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Item Discount:</span>
                <span className="font-mono text-red-600">-{formatCurrency(invoice.itemDiscount, invoice.currency)}</span>
              </div>
            )}

            {invoice.overallDiscount > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Overall Discount:</span>
                <span className="font-mono text-red-600">-{formatCurrency(invoice.overallDiscount, invoice.currency)}</span>
              </div>
            )}

            {invoice.vatAmount > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>VAT:</span>
                <span className="font-mono">{formatCurrency(invoice.vatAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Tax:</span>
                <span className="font-mono">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}

            {invoice.transportCharge > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Transport Charge:</span>
                <span className="font-mono">{formatCurrency(invoice.transportCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.shippingCharge > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Shipping Charge:</span>
                <span className="font-mono">{formatCurrency(invoice.shippingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.loadingCharge > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600">
                <span>Loading Charge:</span>
                <span className="font-mono">{formatCurrency(invoice.loadingCharge, invoice.currency)}</span>
              </div>
            )}

            {invoice.previousDue > 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-600 bg-amber-50/50">
                <span className="font-medium text-amber-900">Previous Due:</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.previousDue, invoice.currency)}</span>
              </div>
            )}

            {invoice.roundAdjustment !== 0 && (
              <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-zinc-500 text-[11px]">
                <span>Round Adjustment:</span>
                <span className="font-mono">{formatCurrency(invoice.roundAdjustment, invoice.currency)}</span>
              </div>
            )}

            {/* Highlight Grand Total in golden/yellow color as specified */}
            <div className="flex justify-between p-2.5 px-3 bg-amber-400 text-zinc-950 font-black text-sm border-y-2 border-amber-600">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base tracking-tight">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
            </div>

            {/* Paid Amount and Balance Due - Only shown when Payment Option is ticked */}
            {shouldShowPayment && (
              <>
                <div className="flex justify-between p-1.5 px-3 border-b border-zinc-200 text-emerald-800 bg-emerald-50/40">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>

                <div className="flex justify-between p-2 px-3 bg-zinc-100 font-bold text-zinc-900">
                  <span>Balance Due:</span>
                  <span className={`font-mono text-sm ${invoice.balanceDue > 0 ? 'text-red-600 font-black' : 'text-emerald-700'}`}>
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Signatures Footer - Strictly at the bottom */}
      <div className="border-t border-zinc-300 pt-4 mt-auto">
        {settings.termsAndConditions && (
          <div className="mb-6 text-[11px] text-zinc-500 whitespace-pre-line leading-relaxed">
            <span className="font-bold text-zinc-700 uppercase tracking-wider block mb-1">Terms &amp; Conditions:</span>
            {settings.termsAndConditions}
          </div>
        )}

        <div className="flex justify-between items-end pt-8 px-4 text-center text-xs text-zinc-700">
          <div>
            <div className="h-16 flex items-end justify-center pb-1">
              <div className="w-48 border-b border-zinc-500"></div>
            </div>
            <div className="pt-2 font-bold text-zinc-900 uppercase tracking-wide">CUSTOMER SIGNATURE</div>
          </div>

          <div>
            <div className="h-16 flex flex-col items-center justify-end pb-1">
              <div className="w-56 border-b border-zinc-600 mt-1"></div>
            </div>
            <div className="pt-2 font-bold text-zinc-900 uppercase tracking-wide">
              BISMILLAH MULTITRADE CORPORATION
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
