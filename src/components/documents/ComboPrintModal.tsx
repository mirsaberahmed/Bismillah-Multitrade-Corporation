import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Layers,
  MessageSquare,
  Send
} from 'lucide-react';
import { SalesInvoice, DeliverySlip, CompanySettings } from '../../types';
import { PrintableInvoice } from './PrintableInvoice';
import { PrintableDeliverySlip } from './PrintableDeliverySlip';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText } from '../../utils/whatsapp';

interface Props {
  invoice: SalesInvoice | null;
  deliverySlip?: DeliverySlip | null;
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ComboPrintModal: React.FC<Props> = ({
  invoice,
  deliverySlip,
  settings,
  isOpen,
  onClose
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'whatsapp' | 'text'>('whatsapp');

  if (!isOpen || !invoice) return null;

  // Fallback dummy delivery slip if not yet created
  const resolvedSlip: DeliverySlip = deliverySlip || {
    id: 'ds-combo-' + invoice.id,
    deliverySlipNumber: 'DS-' + invoice.invoiceNumber.replace(/^INV-/, ''),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    deliveryDate: invoice.invoiceDate,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    companyName: invoice.companyName,
    contactPerson: invoice.customerName,
    phone: invoice.customerPhone,
    deliveryAddress: invoice.customerAddress,
    deliveryMethod: 'Truck',
    items: invoice.items.map(it => ({
      id: 'ds-item-' + it.id,
      invoiceItemId: it.id,
      productId: it.productId,
      productName: it.productName,
      description: it.description,
      unit: it.unit,
      orderedQuantity: it.quantity,
      previouslyDelivered: 0,
      deliveredQuantity: it.quantity,
      remainingQuantity: 0,
      unitPrice: it.unitPrice,
      amount: it.amount
    })),
    deliveryStatus: invoice.deliveryStatus === 'Delivered' ? 'Delivered' : 'Dispatched',
    createdBy: 'Accounts',
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt
  };

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Combo print error:', err);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`modal-combo-container-${invoice.id}`);
      await downloadElementAsPdf(el, `Combo-${invoice.invoiceNumber}`, setIsDownloadingPdf);
    } catch (err) {
      console.error('Combo PDF export error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full">
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible print:w-full print:m-0 print:rounded-none">
        
        {/* Top Control Bar - Icon-only buttons with clean tooltips */}
        <div className="print:hidden flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-amber-400">
                  {invoice.invoiceNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60">
                  Combo Print (2 Pages)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Page 1: <strong>Invoice</strong> • Page 2: <strong>Delivery Slip ({resolvedSlip.deliverySlipNumber})</strong>
              </p>
            </div>
          </div>

          {/* Action buttons (Icon-only with tooltips) */}
          <div className="flex items-center gap-2">
            {/* Print 2 Pages Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md transition-colors cursor-pointer active:scale-95"
              title="Print Combo (Invoice on Page 1, Delivery Slip on Page 2)"
              aria-label="Print Combo (2 Pages)"
            >
              <Printer size={16} />
            </button>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              title={isDownloadingPdf ? "Exporting PDF..." : "Download 2-Page PDF"}
              aria-label="Download 2-Page PDF"
            >
              <Download size={16} />
            </button>

            {/* Send WhatsApp (PDF Attachment) */}
            <button
              type="button"
              onClick={() => {
                setWhatsAppMode('whatsapp');
                setShowWhatsAppModal(true);
              }}
              className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors cursor-pointer active:scale-95"
              title="Send Invoice & Slip via WhatsApp"
              aria-label="Send WhatsApp"
            >
              <MessageSquare size={16} />
            </button>

            {/* Send Text Only */}
            <button
              type="button"
              onClick={() => {
                setWhatsAppMode('text');
                setShowWhatsAppModal(true);
              }}
              className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition-colors cursor-pointer active:scale-95"
              title="Send Text Message via WhatsApp"
              aria-label="Send Text"
            >
              <Send size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-950 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div
            id={`modal-combo-container-${invoice.id}`}
            className="combo-print-wrapper max-w-4xl mx-auto print:max-w-none print:m-0 print:p-0"
          >
            {/* Visual Page 1 Indicator on Screen */}
            <div className="print:hidden mb-2 flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
              <span className="font-bold text-amber-400 uppercase tracking-wide">● Page 1: Sales Invoice</span>
              <span className="text-[11px] text-zinc-500">A4 Portrait (29mm Seal)</span>
            </div>

            {/* PAGE 1: Sales Invoice */}
            <div
              className="combo-invoice-page bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:rounded-none print:overflow-visible"
              style={{
                pageBreakBefore: 'avoid',
                breakBefore: 'avoid',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                clear: 'both'
              }}
            >
              <div id={`modal-combo-invoice-${invoice.id}`}>
                <PrintableInvoice invoice={invoice} settings={settings} />
              </div>
            </div>

            {/* STRICT PAGE BREAK SENTINEL: Separates Page 1 and Page 2 in print */}
            <div
              className="combo-page-break"
              style={{
                pageBreakBefore: 'always',
                breakBefore: 'page',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                height: 0,
                minHeight: 0,
                maxHeight: 0,
                lineHeight: 0,
                margin: 0,
                padding: 0,
                border: 'none',
                clear: 'both',
                display: 'block'
              }}
            />

            {/* Visual Page 2 Indicator on Screen */}
            <div className="print:hidden my-6 flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
              <div className="h-px bg-zinc-800 flex-1 mr-4" />
              <span className="font-bold text-blue-400 uppercase tracking-wide">● Page 2: Delivery Slip / Challan</span>
              <div className="h-px bg-zinc-800 flex-1 ml-4" />
            </div>

            {/* PAGE 2: Delivery Slip */}
            <div
              className="combo-slip-page bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:rounded-none print:overflow-visible"
              style={{
                pageBreakBefore: 'always',
                breakBefore: 'page',
                pageBreakAfter: 'avoid',
                breakAfter: 'avoid',
                clear: 'both'
              }}
            >
              <div id={`modal-combo-slip-${resolvedSlip.id}`}>
                <PrintableDeliverySlip deliverySlip={resolvedSlip} settings={settings} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Send Modal */}
      <WhatsAppSendModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title={`Send Invoice #${invoice.invoiceNumber} & Delivery Slip to WhatsApp`}
        defaultPhone={invoice.customerPhone || ''}
        initialMessage={generateInvoiceWhatsAppText(invoice, settings?.companyName || 'Bismillah Multitrade Corporation')}
        pdfElementId={`modal-combo-container-${invoice.id}`}
        pdfFilename={`Combo-${invoice.invoiceNumber}`}
        documentType="Invoice"
        documentNumber={invoice.invoiceNumber}
        defaultMode={whatsAppMode}
      />
    </div>
  );
};
