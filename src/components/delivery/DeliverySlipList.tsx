import React, { useState } from 'react';
import {
  Truck,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileSpreadsheet,
  Calendar,
  Eye,
  X,
  Download,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DeliverySlip, DeliveryStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PrintableDeliverySlip } from '../documents/PrintableDeliverySlip';
import { exportToExcel } from '../../utils/exportImport';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { printElement } from '../../utils/printHelper';
import { DeliverySlipModal } from './DeliverySlipModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateDeliverySlipWhatsAppText } from '../../utils/whatsapp';

interface Props {
  onSelectInvoice: (invoiceId: string) => void;
}

export const DeliverySlipList: React.FC<Props> = ({ onSelectInvoice }) => {
  const { deliverySlips, updateDeliverySlipStatus, deleteDeliverySlip, settings } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeModalSlip, setActiveModalSlip] = useState<{ slip: DeliverySlip; mode: 'view' | 'edit' } | null>(null);
  const [printingSlip, setPrintingSlip] = useState<DeliverySlip | null>(null);
  const [slipToDelete, setSlipToDelete] = useState<DeliverySlip | null>(null);
  const [pdfSlip, setPdfSlip] = useState<DeliverySlip | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [whatsAppSlip, setWhatsAppSlip] = useState<DeliverySlip | null>(null);

  const filteredSlips = deliverySlips.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.deliverySlipNumber.toLowerCase().includes(q) ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(q)) ||
      (s.driverName && s.driverName.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || s.deliveryStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handlePrint = (slip: DeliverySlip) => {
    setPrintingSlip(slip);
    setTimeout(() => {
      printElement(`printable-delivery-slip-${slip.id}`);
    }, 150);
  };

  const handleDownloadPdf = async (slip: DeliverySlip) => {
    setPdfSlip(slip);
    setIsDownloadingPdf(true);
    setTimeout(async () => {
      try {
        const el = document.getElementById(`pdf-slip-list-${slip.id}`);
        await downloadElementAsPdf(el, `Delivery-Slip-${slip.deliverySlipNumber}`, setIsDownloadingPdf);
      } catch (err) {
        console.error('PDF error:', err);
        handlePrint(slip);
      } finally {
        setIsDownloadingPdf(false);
      }
    }, 200);
  };

  const handleExportExcel = () => {
    const data = filteredSlips.map(s => ({
      'Delivery Slip No': s.deliverySlipNumber,
      'Invoice No': s.invoiceNumber,
      'Date': s.deliveryDate,
      'Customer': s.customerName,
      'Phone': s.phone || '',
      'Address': s.deliveryAddress || '',
      'Vehicle': s.vehicleNumber || '',
      'Driver': s.driverName || '',
      'Status': s.deliveryStatus,
      'Received By': s.receivedBy || ''
    }));
    exportToExcel(data, `Delivery_Slips_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Hidden print container */}
      <div className="hidden print:block">
        {printingSlip && (
          <PrintableDeliverySlip deliverySlip={printingSlip} settings={settings} />
        )}
      </div>

      {/* Off-screen container for PDF download */}
      <div style={{ position: 'fixed', left: '0', top: 0, width: '800px', zIndex: -9999, background: '#ffffff', pointerEvents: 'none' }}>
        {pdfSlip && (
          <div id={`pdf-slip-list-${pdfSlip.id}`}>
            <PrintableDeliverySlip deliverySlip={pdfSlip} settings={settings} />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Truck size={22} className="text-blue-400" />
            Delivery Slips &amp; Dispatch Register
          </h1>
          <p className="text-xs text-zinc-400">
            Log of all outgoing delivery slips generated directly from invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="print:hidden bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched (In-Transit)</option>
              <option value="Delivered">Delivered (Completed)</option>
              <option value="Returned">Returned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Slips Table */}
      <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3">Delivery Slip No</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Delivery Date</th>
                <th className="p-3">Customer &amp; Destination</th>
                <th className="p-3">Vehicle &amp; Driver</th>
                <th className="p-3 text-center">Items Delivered</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No delivery slips found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSlips.map(slip => (
                  <tr key={slip.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {slip.deliverySlipNumber}
                    </td>
                    <td className="p-3 font-mono text-zinc-300">
                      <button
                        onClick={() => onSelectInvoice(slip.invoiceId)}
                        className="hover:underline hover:text-amber-400"
                      >
                        {slip.invoiceNumber}
                      </button>
                    </td>
                    <td className="p-3 text-zinc-300">{formatDate(slip.deliveryDate)}</td>
                    <td className="p-3">
                      <p className="font-bold text-zinc-200">{slip.customerName}</p>
                      <p className="text-[11px] text-zinc-400 truncate max-w-xs">{slip.deliveryAddress}</p>
                    </td>
                    <td className="p-3 text-zinc-300">
                      <p className="font-mono text-xs">{slip.vehicleNumber || '-'}</p>
                      {slip.driverName && (
                        <p className="text-[11px] text-zinc-400">{slip.driverName}</p>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-blue-400">
                      {slip.items.reduce((s, i) => s + i.deliveredQuantity, 0)} units
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        slip.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : slip.deliveryStatus === 'Dispatched'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                          : slip.deliveryStatus === 'Returned'
                          ? 'bg-red-950 text-red-400 border border-red-800/50'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      }`}>
                        {slip.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Slip */}
                        <button
                          onClick={() => setActiveModalSlip({ slip, mode: 'view' })}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-emerald-400 hover:text-emerald-300"
                          title="View Delivery Slip"
                        >
                          <Eye size={15} />
                        </button>
                        {/* Edit Slip */}
                        <button
                          onClick={() => setActiveModalSlip({ slip, mode: 'edit' })}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-blue-400 hover:text-blue-300"
                          title="Edit Delivery Slip Details"
                        >
                          <Edit size={15} />
                        </button>
                        {/* Print A4 Slip */}
                        <button
                          onClick={() => setActiveModalSlip({ slip, mode: 'view' })}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-200 hover:text-amber-400"
                          title="Print A4 Delivery Slip"
                        >
                          <Printer size={15} />
                        </button>
                        {/* Send via WhatsApp directly */}
                        <button
                          onClick={() => setWhatsAppSlip(slip)}
                          className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 rounded text-emerald-400 border border-emerald-900/40 transition-colors cursor-pointer"
                          title="Send Delivery Slip to WhatsApp"
                        >
                          <MessageSquare size={15} />
                        </button>
                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(slip)}
                          disabled={isDownloadingPdf && pdfSlip?.id === slip.id}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-amber-400 hover:text-amber-300 disabled:opacity-50"
                          title="Download Delivery Slip as PDF"
                        >
                          <Download size={15} />
                        </button>
                        {/* Delete Slip */}
                        <button
                          onClick={() => setSlipToDelete(slip)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/60 rounded text-red-400 border border-red-900/40 transition-colors"
                          title="Delete Delivery Slip"
                        >
                          <Trash2 size={15} />
                        </button>
                        {/* Open Associated Invoice */}
                        <button
                          onClick={() => onSelectInvoice(slip.invoiceId)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-200 font-semibold"
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable View & Edit Modal for Delivery Slips */}
      {activeModalSlip && (
        <DeliverySlipModal
          slip={activeModalSlip.slip}
          isOpen={true}
          initialMode={activeModalSlip.mode}
          onClose={() => setActiveModalSlip(null)}
          onDeleted={() => setActiveModalSlip(null)}
          onUpdated={() => setActiveModalSlip(null)}
        />
      )}

      {/* Delete Delivery Slip Confirmation Modal */}
      <ConfirmModal
        isOpen={!!slipToDelete}
        title="Delete Delivery Slip"
        message={`Are you sure you want to delete delivery slip ${slipToDelete?.deliverySlipNumber}? Delivered quantities will be reverted.`}
        confirmText="Delete Slip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (slipToDelete) {
            deleteDeliverySlip(slipToDelete.id);
            setSlipToDelete(null);
          }
        }}
        onClose={() => setSlipToDelete(null)}
      />

      {/* WhatsApp Direct Send Modal with PDF attachment support */}
      {whatsAppSlip && (
        <>
          <div
            id={`list-printable-slip-${whatsAppSlip.id}`}
            style={{
              position: 'fixed',
              left: '0',
              top: '0',
              width: '800px',
              backgroundColor: '#ffffff',
              zIndex: -9999,
              pointerEvents: 'none'
            }}
          >
            <PrintableDeliverySlip deliverySlip={whatsAppSlip} settings={settings} />
          </div>

          <WhatsAppSendModal
            isOpen={true}
            onClose={() => setWhatsAppSlip(null)}
            title={`Send Delivery Challan #${whatsAppSlip.deliverySlipNumber} via WhatsApp`}
            defaultPhone={whatsAppSlip.receiverPhone || whatsAppSlip.phone || ''}
            initialMessage={generateDeliverySlipWhatsAppText(whatsAppSlip, settings?.companyName || 'Bismillah Multitrade Corporation')}
            recipientLabel="Receiver / Customer WhatsApp Phone"
            pdfElementId={`list-printable-slip-${whatsAppSlip.id}`}
            pdfFilename={`Delivery-Slip-${whatsAppSlip.deliverySlipNumber}`}
            documentType="Delivery Slip"
          />
        </>
      )}
    </div>
  );
};
