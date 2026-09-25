import React from 'react';
import { PaymentRecord, CompanySettings } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  payment: PaymentRecord;
  settings: CompanySettings;
}

export const PrintableMoneyReceipt: React.FC<Props> = ({ payment, settings }) => {
  return (
    <div className="printable-sheet bg-white text-black w-full max-w-3xl mx-auto p-8 font-sans print:p-0 print:max-w-[185mm] print:mx-auto text-sm leading-normal border-2 border-black print:border-none">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-black uppercase">{settings.companyName}</h1>
            <p className="text-black font-bold text-xs tracking-wider uppercase">{settings.businessType}</p>
            <p className="text-xs text-black mt-1">{settings.address}</p>
            <p className="text-xs text-black">Phone: {settings.phonePrimary} | {settings.phoneSecondary}</p>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black bg-white text-black px-4 py-1 font-black text-base tracking-widest uppercase mb-2">
              MONEY RECEIPT
            </div>
            <p className="text-xs text-black">
              Receipt No: <strong className="font-mono">{payment.receiptNumber}</strong>
            </p>
            <p className="text-xs text-black">
              Date: <strong>{formatDate(payment.paymentDate)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 mb-8">
        <div className="flex items-baseline border-b border-black pb-1">
          <span className="w-44 text-black text-xs font-bold uppercase">Received with thanks from:</span>
          <span className="flex-1 font-bold text-black text-base">{payment.entityName}</span>
        </div>

        <div className="flex items-baseline border-b border-black pb-1">
          <span className="w-44 text-black text-xs font-bold uppercase">The Sum of (in words):</span>
          <span className="flex-1 font-bold text-black italic text-sm">{payment.amountInWords}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-32 text-black text-xs font-bold uppercase">Payment Method:</span>
            <span className="font-bold text-black">{payment.paymentMethod}</span>
          </div>
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-32 text-black text-xs font-bold uppercase">Against Invoice:</span>
            <span className="font-mono font-bold text-black">{payment.invoiceNumber || 'Account Settlement'}</span>
          </div>
        </div>

        {payment.transactionReference && (
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-44 text-black text-xs font-bold uppercase">Txn / Cheque Ref:</span>
            <span className="flex-1 font-mono font-bold text-black">{payment.transactionReference}</span>
          </div>
        )}

        {payment.notes && (
          <div className="flex items-baseline border-b border-black pb-1">
            <span className="w-44 text-black text-xs font-bold uppercase">Particulars / Note:</span>
            <span className="flex-1 text-black font-medium">{payment.notes}</span>
          </div>
        )}
      </div>

      {/* Amount Box */}
      <div className="flex justify-between items-center border-2 border-black p-4 mb-12 bg-white">
        <div className="text-xs font-bold text-black uppercase">
          Payment received and credited to account.
        </div>
        <div className="text-right">
          <span className="text-xs font-black block uppercase text-black">Amount Received</span>
          <div className="text-2xl font-black font-mono text-black">
            {formatCurrency(payment.amount)}
          </div>
        </div>
      </div>

      {/* Signatures at Bottom */}
      <div className="flex justify-between items-end pt-12 px-4 text-center text-xs text-black">
        <div>
          <div className="h-14 flex items-end justify-center pb-1">
            <div className="w-48 border-b-2 border-black"></div>
          </div>
          <div className="pt-2 font-bold text-black uppercase tracking-wide">Depositor / Payer Signature</div>
        </div>

        <div>
          <div className="h-14 flex flex-col items-center justify-end pb-1">
            <div className="w-56 border-b-2 border-black mt-1"></div>
          </div>
          <div className="pt-2 font-bold text-black uppercase tracking-wide">
            BISMILLAH MULTITRADE CORPORATION
          </div>
        </div>
      </div>
    </div>
  );
};
