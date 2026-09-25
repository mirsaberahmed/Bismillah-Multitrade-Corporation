import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { SalesInvoice, CompanySettings } from '../../types';
import { PrintableInvoice } from '../documents/PrintableInvoice';
import { downloadElementAsPdf } from '../../utils/pdfExport';

interface Props {
  invoice: SalesInvoice | null;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<Props> = ({
  invoice,
  settings,
  isOpen,
  onClose
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print trigger error:', err);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`modal-printable-invoice-${invoice.id}`);
      await downloadElementAsPdf(el, `Invoice-${invoice.invoiceNumber}`, setIsDownloadingPdf);
    } catch (err) {
      console.error('PDF error:', err);
      handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-amber-400">
                  {invoice.invoiceNumber}
                </span>
                <span className="text-xs text-zinc-400">Print Preview</span>
              </div>
              <p className="text-xs text-zinc-400">
                Customer: <strong className="text-zinc-200">{invoice.customerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Now Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition-colors"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Exporting...' : 'Save PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-1"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-950">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200 max-w-4xl mx-auto">
            <div id={`modal-printable-invoice-${invoice.id}`}>
              <PrintableInvoice invoice={invoice} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
