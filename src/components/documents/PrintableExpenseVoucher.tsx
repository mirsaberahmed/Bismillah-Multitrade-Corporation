import React from 'react';
import { ExpenseRecord, CompanySettings } from '../../types';
import { formatDate, formatCurrency, numberToWordsBDT } from '../../utils/formatters';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

interface Props {
  expense: ExpenseRecord;
  settings: CompanySettings;
}

export const PrintableExpenseVoucher: React.FC<Props> = ({ expense, settings }) => {
  const amountWords = numberToWordsBDT(expense.amount);

  return (
    <div className="printable-sheet bg-white text-black w-full max-w-3xl mx-auto p-8 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-sm leading-normal border-2 border-black print:border-none">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-black uppercase">{settings.companyName}</h1>
            <p className="text-black font-bold text-xs tracking-wider uppercase">{settings.businessType}</p>
            <p className="text-xs text-black mt-1">{settings.address}</p>
            <p className="text-xs text-black">Phone: {settings.phonePrimary} {settings.phoneSecondary && `| ${settings.phoneSecondary}`}</p>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black bg-white text-black px-4 py-1 font-black text-base tracking-widest uppercase mb-2">
              DEBIT VOUCHER
            </div>
            <p className="text-xs text-black">
              Voucher No: <strong className="font-mono">{expense.voucherNumber || expense.expenseNumber}</strong>
            </p>
            <p className="text-xs text-black">
              Date: <strong>{formatDate(expense.expenseDate || expense.date || '')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 mb-8">
        <div className="flex items-baseline border-b border-black pb-1">
          <span className="w-44 text-black text-xs font-bold uppercase">Paid To / Payee:</span>
          <span className="flex-1 font-bold text-black text-base">{expense.paidTo || 'Cash Expense'}</span>
        </div>

        <div className="flex items-baseline border-b border-black pb-1">
          <span className="w-44 text-black text-xs font-bold uppercase">Expense Head / Category:</span>
          <span className="flex-1 font-bold text-black text-sm">{expense.category}</span>
        </div>

        <div className="flex items-baseline border-b border-black pb-1">
          <span className="w-44 text-black text-xs font-bold uppercase">Amount in Words:</span>
          <span className="flex-1 font-bold text-black italic text-sm">{amountWords}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-36 text-black text-xs font-bold uppercase">Payment Method:</span>
            <span className="font-bold text-black">{expense.paymentMethod}</span>
          </div>
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-36 text-black text-xs font-bold uppercase">Reference / Bill No:</span>
            <span className="font-mono font-bold text-black">{expense.referenceNumber || expense.reference || 'N/A'}</span>
          </div>
        </div>

        {expense.notes && (
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-44 text-black text-xs font-bold uppercase">Particulars / Note:</span>
            <span className="flex-1 text-black text-xs">{expense.notes}</span>
          </div>
        )}
      </div>

      {/* Amount Box */}
      <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-4 mb-10">
        <span className="font-black text-sm uppercase">Total Amount Paid:</span>
        <span className="font-mono font-black text-2xl tracking-tight text-black">
          {formatCurrency(expense.amount, expense.currency || 'BDT')}
        </span>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-4 gap-4 pt-12 text-center text-xs">
        <div>
          <div className="border-t border-black pt-1 font-bold">Prepared By</div>
          <div className="text-[10px] text-gray-600">Accounts Officer</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 font-bold">Checked By</div>
          <div className="text-[10px] text-gray-600">Internal Audit</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 font-bold">Payee Signature</div>
          <div className="text-[10px] text-gray-600">Received By</div>
        </div>
        <div className="relative">
          <div className="border-t border-black pt-1 font-bold">Authorized Signatory</div>
          <div className="text-[10px] text-gray-600">Director / CEO</div>
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
