import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  MessageSquare,
  Send
} from 'lucide-react';
import { SalesInvoice, CompanySettings } from '../../types';
import { PrintableInvoice } from '../documents/PrintableInvoice';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { printElement } from '../../utils/printHelper';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText } from '../../utils/whatsapp';

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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'whatsapp' | 'text'>('whatsapp');

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    printElement(`printable-invoice-${invoice.id}`);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`modal-printable-invoice-${invoice.id}`);
      await downloadElementAsPdf(el, `Invoice-${invoice.invoiceNumber}`, setIsDownloadingPdf);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible print:w-full print:m-0 print:rounded-none">
        {/* Top Control Bar - Strictly hidden when printing */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Exporting...' : 'Save PDF'}</span>
            </button>

            {/* Send WhatsApp with PDF Attachment */}
            <button
              type="button"
              onClick={() => {
                setWhatsAppMode('whatsapp');
                setShowWhatsAppModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              title="Send Invoice PDF directly through WhatsApp"
            >
              <MessageSquare size={14} />
              <span>Send WhatsApp</span>
            </button>

            {/* Send Text Only */}
            <button
              type="button"
              onClick={() => {
                setWhatsAppMode('text');
                setShowWhatsAppModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              title="Send only the prepared text message through WhatsApp"
            >
              <Send size={14} className="text-emerald-400" />
              <span>Send Text</span>
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

        {/* Modal Printable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-950 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200 max-w-4xl mx-auto print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none">
            <div id={`modal-printable-invoice-${invoice.id}`} className="print:m-0 print:p-0">
              <PrintableInvoice invoice={invoice} settings={settings} />
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Send Modal with Direct PDF Attachment */}
      <WhatsAppSendModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title={`Send Invoice #${invoice.invoiceNumber} to WhatsApp`}
        defaultPhone={invoice.customerPhone || ''}
        initialMessage={generateInvoiceWhatsAppText(invoice, settings?.companyName || 'Bismillah Multitrade Corporation')}
        pdfElementId={`modal-printable-invoice-${invoice.id}`}
        pdfFilename={`Invoice-${invoice.invoiceNumber}`}
        documentType="Invoice"
        documentNumber={invoice.invoiceNumber}
        defaultMode={whatsAppMode}
      />
    </div>
  );
};
