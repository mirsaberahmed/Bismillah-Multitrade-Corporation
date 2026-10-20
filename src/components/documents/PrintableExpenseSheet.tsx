import React from 'react';
import { ExpenseRecord, CompanySettings } from '../../types';
import { formatCurrency, formatDate, numberToWordsBDT } from '../../utils/formatters';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

interface Props {
  expense: ExpenseRecord;
  settings: CompanySettings;
}

export const PrintableExpenseSheet: React.FC<Props> = ({ expense, settings }) => {
  const totalInWords = numberToWordsBDT(expense.amount);

  // Normalize items: If expense has itemized rows, use them; otherwise, create a clean default item.
  const displayItems = (expense.items && expense.items.length > 0)
    ? expense.items
    : [
        {
          id: 'item-1',
          particulars: expense.notes || expense.description || `${expense.category} Expense`,
          category: expense.category,
          quantity: 1,
          unit: 'Lot',
          unitPrice: expense.amount,
          amount: expense.amount
        }
      ];

  const subtotal = displayItems.reduce(
    (sum, it) => sum + (Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))),
    0
  );

  return (
    <div
      id={`printable-expense-${expense.id}`}
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-8 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-sm leading-normal"
    >
      {/* 1. Header - Exact 1-to-1 Match with PrintableInvoice */}
      <div className="border-b border-black pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-black uppercase mb-0.5">
              {settings.companyName || 'BISMILLAH MULTITRADE CORPORATION'}
            </h1>
            <p className="text-black font-semibold text-xs tracking-wider uppercase mb-2">
              {settings.businessType || 'General Merchant, Importer & Supplier'}
            </p>
            <div className="text-black text-xs space-y-0.5 leading-relaxed">
              <p>{settings.address || 'House-02, Road-01, Section-11, Block-B, Mirpur, Dhaka-1216, Bangladesh'}</p>
              <p>
                <span className="font-semibold">Phone:</span> {settings.phonePrimary || '+880 1711-000000'}
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

          {/* Document Label & Voucher Details */}
          <div className="text-right">
            <div className="inline-block border border-black bg-white text-black px-4 py-1.5 font-bold text-lg tracking-widest uppercase mb-3">
              EXPENSE SHEET
            </div>
            <div className="space-y-1 text-xs text-black">
              <p>
                <span className="font-medium">Voucher No:</span>{' '}
                <strong className="font-mono text-sm">{expense.voucherNumber || expense.expenseNumber || 'EXP-001'}</strong>
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                <strong>{formatDate(expense.expenseDate || expense.date || '')}</strong>
              </p>
              <p>
                <span className="font-medium">Payment Mode:</span>{' '}
                <strong>{expense.paymentMethod || 'Cash'}</strong>
              </p>
              {expense.referenceNumber && (
                <p>
                  <span className="font-medium">Ref / Bill No:</span>{' '}
                  <strong className="font-mono">{expense.referenceNumber}</strong>
                </p>
              )}
              {expense.currency && expense.currency !== 'BDT' && (
                <p>
                  <span className="font-medium">Currency:</span>{' '}
                  <strong>{expense.currency}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Two Column: Paid To & Voucher Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Paid To */}
        <div className="border border-black bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider text-black uppercase mb-1.5">
              PAID TO
            </div>
            <p className="font-bold text-black text-sm">{expense.paidTo || 'Cash Expense / Self'}</p>
            <p className="text-xs font-semibold text-black mt-0.5">
              Category: {expense.category}
            </p>
            {expense.supplierName && (
              <p className="text-xs text-black mt-1">
                <span className="font-medium">Supplier / Vendor:</span> {expense.supplierName}
              </p>
            )}
            {expense.notes && (
              <p className="text-xs text-black mt-1 whitespace-pre-line leading-relaxed">
                Purpose: {expense.notes}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-black text-xs space-y-0.5 text-black">
            <p><span className="font-medium">Settlement:</span> Cash</p>
          </div>
        </div>

        {/* Voucher Information */}
        <div className="border border-black bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider text-black uppercase mb-1.5">
              VOUCHER INFORMATION
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs text-black">
              <span className="font-medium">Payment Status:</span>
              <span className="font-bold uppercase text-black">PAID</span>

              <span className="font-medium">Payment Method:</span>
              <span className="font-bold">{expense.paymentMethod}</span>

              {expense.referenceNumber && (
                <>
                  <span className="font-medium">Reference No:</span>
                  <span className="font-bold font-mono">{expense.referenceNumber}</span>
                </>
              )}

              <span className="font-medium">Prepared By:</span>
              <span className="font-bold">{expense.preparedBy || 'Accounts Officer'}</span>

              <span className="font-medium">Approved By:</span>
              <span className="font-bold">{expense.approvedBy || 'Managing Director'}</span>
            </div>
          </div>
          {expense.notes && (
            <div className="mt-2 pt-2 border-t border-black text-xs text-black">
              <span className="font-medium">Remarks: </span>
              {expense.notes}
            </div>
          )}
        </div>
      </div>

      {/* 3. Expense Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse text-left text-xs border border-black">
          <thead>
            <tr className="bg-white text-black font-bold border-b border-black">
              <th className="p-2.5 w-12 text-center border-r border-black">SL</th>
              <th className="p-2.5 border-r border-black">Expense Details</th>
              <th className="p-2.5 w-36 border-r border-black">Category</th>
              <th className="p-2.5 w-24 text-right border-r border-black">Qty</th>
              <th className="p-2.5 w-20 text-center border-r border-black">Unit</th>
              <th className="p-2.5 w-32 text-right border-r border-black">Unit Price</th>
              <th className="p-2.5 w-36 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => {
              const itemTotal = Number(item.amount) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
              return (
                <tr
                  key={item.id || index}
                  className="border-b border-black bg-white"
                >
                  <td className="p-2.5 text-center text-black font-medium border-r border-black">{index + 1}</td>
                  <td className="p-2.5 border-r border-black">
                    <p className="font-bold text-black text-xs">{item.particulars}</p>
                  </td>
                  <td className="p-2.5 border-r border-black text-black">
                    {item.category || expense.category}
                  </td>
                  <td className="p-2.5 text-right font-bold font-mono text-black border-r border-black">
                    {item.quantity || 1}
                  </td>
                  <td className="p-2.5 text-center text-black font-medium text-xs border-r border-black">
                    {item.unit || 'Lot'}
                  </td>
                  <td className="p-2.5 text-right font-mono text-black border-r border-black">
                    {formatCurrency(item.unitPrice || itemTotal, expense.currency || 'BDT')}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-black">
                    {formatCurrency(itemTotal, expense.currency || 'BDT')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Summary Area */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left 7 Columns: Amount in Words & Payment / Approval Details */}
        <div className="col-span-7 space-y-4">
          <div className="border border-black bg-white p-4">
            <span className="text-xs font-bold text-black uppercase tracking-wider block mb-1">
              Amount in Words
            </span>
            <p className="text-xs font-bold text-black italic">
              {totalInWords} TAKA ONLY
            </p>
          </div>

          <div className="border border-black bg-white p-4 text-xs text-black">
            <span className="font-bold text-black uppercase tracking-wider text-xs block mb-2">
              Payment &amp; Settlement Details
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-black">
              <p><span className="font-medium">Payment Mode:</span> <strong>{expense.paymentMethod}</strong></p>
              <p><span className="font-medium">Status:</span> <strong>PAID</strong></p>
              {expense.referenceNumber && (
                <p><span className="font-medium">Ref / Voucher:</span> <strong className="font-mono">{expense.referenceNumber}</strong></p>
              )}
              <p><span className="font-medium">Treasury Head:</span> <strong>Operating Account</strong></p>
              {settings.bankName && (
                <p><span className="font-medium">Bank A/C:</span> {settings.bankName} ({settings.accountNumber || 'Primary'})</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Financial Calculations */}
        <div className="col-span-5">
          <div className="border border-black bg-white text-xs text-black">
            <div className="flex justify-between p-2 px-3 border-b border-black">
              <span className="font-medium">Subtotal:</span>
              <span className="font-mono font-bold">{formatCurrency(subtotal, expense.currency || 'BDT')}</span>
            </div>

            {/* GRAND TOTAL */}
            <div className="flex justify-between p-2.5 px-3 bg-white text-black font-black text-sm border-b border-black">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base tracking-tight">{formatCurrency(expense.amount, expense.currency || 'BDT')}</span>
            </div>

            <div className="flex justify-between p-2 px-3 border-b border-black">
              <span className="font-medium">Total Paid:</span>
              <span className="font-mono font-bold text-black">{formatCurrency(expense.amount, expense.currency || 'BDT')}</span>
            </div>

            <div className="flex justify-between p-2 px-3 bg-white font-bold text-black">
              <span>Balance Due:</span>
              <span className="font-mono text-sm">৳0.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Official Signatures Section - Payee, Prepared By, and Official Seal */}
      <div className="border-t border-black pt-4 mt-8">
        <div className="flex justify-between items-end pt-2 px-4 text-center text-xs text-black">
          {/* Receiver / Payee */}
          <div>
            <div className="h-[28mm] flex items-end justify-center pb-1">
              <div className="w-44 border-b border-black"></div>
            </div>
            <div className="pt-1.5 font-bold text-black uppercase tracking-wide text-xs">
              PAYEE / RECEIVER SIGNATURE
            </div>
          </div>

          {/* Prepared / Accounts Officer */}
          <div>
            <div className="h-[28mm] flex items-end justify-center pb-1">
              <div className="w-44 border-b border-black"></div>
            </div>
            <div className="pt-1.5 font-bold text-black uppercase tracking-wide text-xs">
              PREPARED BY
            </div>
            <div className="text-[10px] text-gray-700 font-medium">
              {expense.preparedBy || 'Accounts Officer'}
            </div>
          </div>

          {/* Approved By / Official Seal */}
          <div className="flex flex-col items-center">
            <div className="h-[28mm] flex flex-col items-center justify-end pb-1.5">
              {BISMILLAH_SIGNATURE_DATA_URI && (
                <img
                  src={BISMILLAH_SIGNATURE_DATA_URI}
                  alt="Bismillah Multitrade Official Seal & Signature"
                  className="w-[28mm] h-[28mm] object-contain select-none pointer-events-none"
                />
              )}
              <div className="w-56 border-b border-black mt-1"></div>
            </div>
            <div className="pt-1.5 font-bold text-black uppercase tracking-wide text-xs">
              BISMILLAH MULTITRADE CORPORATION
            </div>
            <div className="text-[10px] text-gray-700 font-medium">
              {expense.approvedBy || 'Managing Director / CEO'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
