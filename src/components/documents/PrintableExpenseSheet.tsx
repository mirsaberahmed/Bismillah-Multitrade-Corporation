import React from 'react';
import { ExpenseRecord, CompanySettings } from '../../types';
import { formatCurrency, formatDate, numberToWordsBDT } from '../../utils/formatters';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

interface Props {
  expense: ExpenseRecord;
  settings: CompanySettings;
}

export const PrintableExpenseSheet: React.FC<Props> = ({ expense, settings }) => {
  const amountWords = numberToWordsBDT(expense.amount);

  // Normalize items: If expense has itemized rows, use them. Otherwise, create a clean default item.
  const displayItems = (expense.items && expense.items.length > 0)
    ? expense.items
    : [
        {
          id: 'item-1',
          particulars: expense.notes || expense.description || `${expense.category} Payment`,
          category: expense.category,
          quantity: 1,
          unit: 'Lot',
          unitPrice: expense.amount,
          amount: expense.amount
        }
      ];

  const subtotal = displayItems.reduce((sum, it) => sum + (Number(it.amount) || (it.quantity * it.unitPrice) || 0), 0);

  return (
    <div
      id={`printable-expense-${expense.id}`}
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-8 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-sm leading-normal"
    >
      {/* Header - Identical to Invoice Layout */}
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

          {/* Document Badge & Voucher Details */}
          <div className="text-right">
            <div className="inline-block border border-black bg-white text-black px-4 py-1.5 font-bold text-lg tracking-widest uppercase mb-3">
              EXPENSE SHEET
            </div>
            <div className="space-y-1 text-xs text-black">
              <p>
                <span className="font-medium">Voucher No:</span>{' '}
                <strong className="font-mono text-sm">{expense.voucherNumber || expense.expenseNumber}</strong>
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                <strong>{formatDate(expense.expenseDate || expense.date || '')}</strong>
              </p>
              <p>
                <span className="font-medium">Payment Mode:</span>{' '}
                <strong>{expense.paymentMethod}</strong>
              </p>
              {expense.referenceNumber && (
                <p>
                  <span className="font-medium">Ref / Bill No:</span>{' '}
                  <strong className="font-mono">{expense.referenceNumber}</strong>
                </p>
              )}
              {expense.approvedBy && (
                <p>
                  <span className="font-medium">Approved By:</span>{' '}
                  <strong>{expense.approvedBy}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payee / Party Box & Expense Particulars - 2 Column Layout like Invoice Bill To */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-black p-3.5 bg-gray-50/50">
          <p className="text-[10px] font-bold text-black tracking-wider uppercase mb-1.5 border-b border-black/40 pb-1">
            PAID TO / BENEFICIARY
          </p>
          <div className="text-xs text-black space-y-1">
            <p className="font-black text-sm text-black uppercase tracking-tight">
              {expense.paidTo || 'Self / Cash Expense'}
            </p>
            <p>
              <span className="font-medium text-gray-700">Account Head / Category:</span>{' '}
              <strong className="text-black">{expense.category}</strong>
            </p>
            {expense.supplierName && (
              <p>
                <span className="font-medium text-gray-700">Vendor / Supplier:</span>{' '}
                <strong>{expense.supplierName}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="border border-black p-3.5 bg-gray-50/50">
          <p className="text-[10px] font-bold text-black tracking-wider uppercase mb-1.5 border-b border-black/40 pb-1">
            VOUCHER PARTICULARS & PURPOSE
          </p>
          <div className="text-xs text-black space-y-1">
            <p>
              <span className="font-medium text-gray-700">Payment Status:</span>{' '}
              <strong className="text-black uppercase">PAID &amp; SETTLED</strong>
            </p>
            <p>
              <span className="font-medium text-gray-700">Currency:</span>{' '}
              <strong>{expense.currency || 'BDT'}</strong>
            </p>
            {expense.notes && (
              <p className="line-clamp-2">
                <span className="font-medium text-gray-700">Remarks:</span>{' '}
                <span className="italic">{expense.notes}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Table - Exactly Matching Invoice Table Styling */}
      <div className="mb-6 overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border border-black bg-gray-100 text-black font-bold uppercase text-[11px]">
              <th className="border border-black py-2 px-2 text-center w-10">SL</th>
              <th className="border border-black py-2 px-3 text-left">Particulars / Expense Description</th>
              <th className="border border-black py-2 px-2 text-left w-36">Category</th>
              <th className="border border-black py-2 px-2 text-center w-16">Qty</th>
              <th className="border border-black py-2 px-2 text-center w-16">Unit</th>
              <th className="border border-black py-2 px-3 text-right w-24">Rate (BDT)</th>
              <th className="border border-black py-2 px-3 text-right w-28">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => {
              const itemTotal = Number(item.amount) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
              return (
                <tr key={item.id || index} className="border border-black">
                  <td className="border border-black py-2 px-2 text-center font-mono font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-black py-2 px-3 text-black">
                    <p className="font-semibold text-black">{item.particulars}</p>
                  </td>
                  <td className="border border-black py-2 px-2 text-gray-800">
                    {item.category || expense.category}
                  </td>
                  <td className="border border-black py-2 px-2 text-center font-mono">
                    {item.quantity || 1}
                  </td>
                  <td className="border border-black py-2 px-2 text-center text-gray-700">
                    {item.unit || 'Items'}
                  </td>
                  <td className="border border-black py-2 px-3 text-right font-mono">
                    {formatCurrency(item.unitPrice || 0, '')}
                  </td>
                  <td className="border border-black py-2 px-3 text-right font-mono font-bold">
                    {formatCurrency(itemTotal, '')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Amount in Words - Formatted like Invoice */}
      <div className="grid grid-cols-12 gap-6 mb-8 items-start">
        {/* Left Side: Amount in Words & Notes */}
        <div className="col-span-7 space-y-3">
          <div className="border border-black p-3 bg-gray-50/50">
            <span className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1">
              Amount in Words:
            </span>
            <p className="font-bold text-black text-xs italic capitalize leading-relaxed">
              {amountWords}
            </p>
          </div>

          {expense.notes && (
            <div className="border border-black p-2.5">
              <span className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1">
                Office Notes &amp; Particulars:
              </span>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                {expense.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Totals Calculation Box */}
        <div className="col-span-5 border border-black">
          <div className="p-2.5 flex justify-between items-center text-xs border-b border-black/30">
            <span className="font-medium text-black">Subtotal:</span>
            <span className="font-mono font-semibold text-black">
              {formatCurrency(subtotal || expense.amount, 'BDT')}
            </span>
          </div>

          <div className="p-3 bg-gray-100 flex justify-between items-center border-t-2 border-black">
            <span className="font-black text-xs uppercase tracking-wider text-black">
              Grand Total:
            </span>
            <span className="font-mono font-black text-base text-black">
              {formatCurrency(expense.amount, 'BDT')}
            </span>
          </div>
        </div>
      </div>

      {/* Signatures & Corporate Seal - Matching Invoice & Delivery Challan */}
      <div className="grid grid-cols-4 gap-4 pt-12 text-center text-xs">
        <div>
          <div className="border-t border-black pt-1 font-bold text-black">Prepared By</div>
          <div className="text-[10px] text-gray-700">{expense.preparedBy || 'Accounts Officer'}</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 font-bold text-black">Checked By</div>
          <div className="text-[10px] text-gray-700">{expense.checkedBy || 'Internal Audit'}</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 font-bold text-black">Received By</div>
          <div className="text-[10px] text-gray-700">Payee Signature</div>
        </div>
        <div className="relative">
          <div className="border-t border-black pt-1 font-bold text-black">Authorized Signatory</div>
          <div className="text-[10px] text-gray-700">{expense.approvedBy || 'Managing Director'}</div>
          {BISMILLAH_SIGNATURE_DATA_URI && (
            <img
              src={BISMILLAH_SIGNATURE_DATA_URI}
              alt="Seal"
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-auto opacity-80 pointer-events-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};
