import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Download,
  Trash2,
  Receipt,
  Share2,
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  MessageSquare,
  Send
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PrintableExpenseSheet } from '../documents/PrintableExpenseSheet';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { printElement } from '../../utils/printHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateExpenseWhatsAppText } from '../../utils/whatsapp';

interface Props {
  expenseId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export const ExpenseDetails: React.FC<Props> = ({ expenseId, onBack, onEdit }) => {
  const { expenses, settings, deleteExpense } = useData();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'whatsapp' | 'text'>('whatsapp');

  const expense = expenses.find(e => e.id === expenseId);

  if (!expense) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center space-y-4">
        <Receipt size={48} className="mx-auto text-zinc-600" />
        <h2 className="text-lg font-bold text-zinc-200">Expense Record Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested expense voucher might have been removed or does not exist.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold"
        >
          Back to Expense List
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    printElement(`printable-expense-${expense.id}`);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`printable-expense-${expense.id}`);
      await downloadElementAsPdf(
        el,
        `Expense-Sheet-${expense.voucherNumber || expense.expenseNumber || expense.id}`,
        setIsDownloadingPdf
      );
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDelete = () => {
    deleteExpense(expense.id);
    setShowDeleteModal(false);
    onBack();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions Bar (Identical to InvoiceDetails control bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Back to Expenses"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-red-400">
                {expense.voucherNumber || expense.expenseNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PAID
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Paid To: <strong className="text-zinc-200">{expense.paidTo || 'Self / Cash'}</strong> • Date: {formatDate(expense.expenseDate || expense.date)}
            </p>
          </div>
        </div>

        {/* Action Buttons: Direct Edit, Print, Save PDF, Delete */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(expense.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
            title="Edit Expense Sheet"
          >
            <Edit size={14} />
            <span>Edit Sheet</span>
          </button>

          {/* Print Document Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg text-xs border border-zinc-700 transition-colors cursor-pointer"
            title="Print Expense Document"
          >
            <Printer size={14} />
            <span>Print Document</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg text-xs border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download PDF"
          >
            <Download size={14} />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Send WhatsApp (PDF Attachment) */}
          <button
            type="button"
            onClick={() => {
              setWhatsAppMode('whatsapp');
              setShowWhatsAppModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            title="Send Expense Sheet PDF directly through WhatsApp"
          >
            <MessageSquare size={14} />
            <span>Send WhatsApp</span>
          </button>

          {/* Send Text (Prepared Text Only) */}
          <button
            type="button"
            onClick={() => {
              setWhatsAppMode('text');
              setShowWhatsAppModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-lg text-xs border border-zinc-700 transition-colors cursor-pointer"
            title="Send only the prepared text message through WhatsApp"
          >
            <Send size={14} className="text-emerald-400" />
            <span>Send Text</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Delete Expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Document Preview Card */}
      <div 
        id={`printable-expense-${expense.id}`}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-200 max-w-4xl mx-auto p-4 sm:p-8 print:p-0 print:border-none print:shadow-none"
      >
        <PrintableExpenseSheet expense={expense} settings={settings} />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Expense Voucher"
        message={`Are you sure you want to permanently delete expense voucher ${expense.voucherNumber || expense.expenseNumber}? This cannot be undone.`}
        confirmText="Delete Voucher"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Send WhatsApp Modal */}
      <WhatsAppSendModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title={`Send Expense Sheet #${expense.voucherNumber || expense.expenseNumber || ''} to WhatsApp`}
        defaultPhone={expense.phone || ''}
        initialMessage={generateExpenseWhatsAppText(expense, settings?.companyName || 'Bismillah Multitrade Corporation')}
        pdfElementId={`printable-expense-${expense.id}`}
        pdfFilename={`Expense-Sheet-${expense.voucherNumber || expense.expenseNumber || expense.id}`}
        documentType="Expense Sheet"
        documentNumber={expense.voucherNumber || expense.expenseNumber}
        defaultMode={whatsAppMode}
      />
    </div>
  );
};
