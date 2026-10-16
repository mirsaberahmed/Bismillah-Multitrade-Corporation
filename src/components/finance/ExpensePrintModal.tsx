import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Edit,
  MessageSquare
} from 'lucide-react';
import { ExpenseRecord, CompanySettings } from '../../types';
import { PrintableExpenseSheet } from '../documents/PrintableExpenseSheet';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { printElement } from '../../utils/printHelper';

interface Props {
  expense: ExpenseRecord | null;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (expense: ExpenseRecord) => void;
}

export const ExpensePrintModal: React.FC<Props> = ({
  expense,
  settings,
  isOpen,
  onClose,
  onEdit
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    printElement(`printable-expense-${expense.id}`);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`modal-printable-expense-${expense.id}`);
      const filename = `Expense-Sheet-${expense.voucherNumber || expense.expenseNumber || expense.id}`;
      await downloadElementAsPdf(el, filename, setIsDownloadingPdf);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible print:w-full print:m-0 print:rounded-none">
        {/* Top Control Bar - Hidden during physical print */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-red-400">
                  {expense.voucherNumber || expense.expenseNumber}
                </span>
                <span className="text-xs text-zinc-400">Expense Sheet &amp; Debit Voucher</span>
              </div>
              <p className="text-xs text-zinc-400">
                Paid To: <strong className="text-zinc-200">{expense.paidTo || 'Cash Expense'}</strong> • Category: <strong className="text-zinc-200">{expense.category}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Edit Button */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
                title="Edit this Expense Sheet"
              >
                <Edit size={14} />
                <span>Edit Sheet</span>
              </button>
            )}

            {/* Print Now Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              title="Print Now"
            >
              <Printer size={15} />
              <span>Print Document</span>
            </button>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Exporting...' : 'Save PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-950 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200 max-w-4xl mx-auto print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none">
            <div id={`modal-printable-expense-${expense.id}`} className="print:m-0 print:p-0">
              <PrintableExpenseSheet expense={expense} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
