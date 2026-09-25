import React from 'react';
import { PaymentRecord, CompanySettings } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  payment: PaymentRecord;
  settings: CompanySettings;
}

export const PrintableMoneyReceipt: React.FC<Props> = ({ payment, settings }) => {
  return (
    <div className="bg-white text-zinc-900 w-full max-w-3xl mx-auto p-8 font-sans print:p-0 print:max-w-none text-sm leading-normal border border-zinc-200">
      {/* Header */}
      <div className="border-b-2 border-amber-500 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 uppercase">{settings.companyName}</h1>
            <p className="text-amber-700 font-semibold text-xs tracking-wider uppercase">{settings.businessType}</p>
            <p className="text-xs text-zinc-600 mt-1">{settings.address}</p>
            <p className="text-xs text-zinc-600">Phone: {settings.phonePrimary} | {settings.phoneSecondary}</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-amber-500 text-zinc-950 px-4 py-1 font-extrabold text-base tracking-widest uppercase mb-2">
              MONEY RECEIPT
            </div>
            <p className="text-xs text-zinc-600">
              Receipt No: <strong className="font-mono text-zinc-900">{payment.receiptNumber}</strong>
            </p>
            <p className="text-xs text-zinc-600">
              Date: <strong className="text-zinc-900">{formatDate(payment.paymentDate)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 mb-8">
        <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
          <span className="w-36 text-zinc-500 text-xs font-semibold uppercase">Received with thanks from:</span>
          <span className="flex-1 font-bold text-zinc-900 text-base">{payment.entityName}</span>
        </div>

        <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
          <span className="w-36 text-zinc-500 text-xs font-semibold uppercase">The Sum of (in words):</span>
          <span className="flex-1 font-semibold text-zinc-900 italic text-sm">{payment.amountInWords}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
            <span className="w-28 text-zinc-500 text-xs font-semibold uppercase">Payment Method:</span>
            <span className="font-medium text-zinc-900">{payment.paymentMethod}</span>
          </div>
          <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
            <span className="w-28 text-zinc-500 text-xs font-semibold uppercase">Against Invoice:</span>
            <span className="font-mono font-bold text-zinc-900">{payment.invoiceNumber || 'Account Settlement'}</span>
          </div>
        </div>

        {payment.transactionReference && (
          <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
            <span className="w-36 text-zinc-500 text-xs font-semibold uppercase">Txn / Cheque Ref:</span>
            <span className="flex-1 font-mono text-zinc-800">{payment.transactionReference}</span>
          </div>
        )}

        {payment.notes && (
          <div className="flex items-baseline border-b border-dotted border-zinc-400 pb-1">
            <span className="w-36 text-zinc-500 text-xs font-semibold uppercase">Particulars / Note:</span>
            <span className="flex-1 text-zinc-700">{payment.notes}</span>
          </div>
        )}
      </div>

      {/* Amount Box */}
      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-300 p-4 rounded mb-12">
        <div className="text-xs text-zinc-500">
          Payment received and credited to account.
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500 font-semibold block uppercase">Amount Received</span>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {formatCurrency(payment.amount)}
          </div>
        </div>
      </div>

      {/* Signatures at Bottom */}
      <div className="flex justify-between items-end pt-12 px-4 text-center text-xs text-zinc-700">
        <div>
          <div className="h-14 flex items-end justify-center pb-1">
            <div className="w-44 border-b border-zinc-400"></div>
          </div>
          <div className="pt-2 font-bold text-zinc-800 uppercase tracking-wide">Depositor / Payer Signature</div>
          <p className="text-[10px] text-zinc-400">Paid with thanks</p>
        </div>

        <div>
          <div className="h-14 flex flex-col items-center justify-end pb-1">
            <span className="font-serif italic text-sm text-zinc-800">
              {settings.authorizedSignatureName}
            </span>
            <div className="w-52 border-b border-zinc-500 mt-1"></div>
          </div>
          <div className="pt-2 font-bold text-zinc-900 uppercase tracking-wide">
            {settings.authorizedSignatureName}
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Bismillah Multitrade Corporation</p>
        </div>
      </div>
    </div>
  );
};
