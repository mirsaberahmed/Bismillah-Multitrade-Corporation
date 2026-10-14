import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Edit,
  Eye,
  Truck,
  CreditCard,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SalesInvoice, PaymentStatus, DeliveryStatus } from '../../types';
import { formatCurrency, formatDate, getDateRangePreset } from '../../utils/formatters';
import { exportToExcel, exportToCSV } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText } from '../../utils/whatsapp';

interface Props {
  onSelectInvoice: (id: string) => void;
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
}

export const InvoiceList: React.FC<Props> = ({
  onSelectInvoice,
  onNewInvoice,
  onEditInvoice
}) => {
  const { invoices, deleteInvoice } = useData();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('this_year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesInvoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [whatsAppModal, setWhatsAppModal] = useState<{ isOpen: boolean; title: string; phone: string; message: string }>({
    isOpen: false,
    title: '',
    phone: '',
    message: ''
  });

  // Apply date range
  const { start: presetStart, end: presetEnd } = getDateRangePreset(dateRangePreset);
  const effectiveStart = dateRangePreset === 'custom' ? customStartDate : presetStart;
  const effectiveEnd = dateRangePreset === 'custom' ? customEndDate : presetEnd;

  const filteredInvoices = invoices.filter(inv => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q) ||
      (inv.companyName && inv.companyName.toLowerCase().includes(q)) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(q));

    // Status filters
    const matchPayment = paymentFilter === 'all' || inv.paymentStatus === paymentFilter;
    const matchDelivery = deliveryFilter === 'all' || inv.deliveryStatus === deliveryFilter;

    // Date filter
    let matchDate = true;
    if (effectiveStart && inv.invoiceDate < effectiveStart) matchDate = false;
    if (effectiveEnd && inv.invoiceDate > effectiveEnd) matchDate = false;

    return matchSearch && matchPayment && matchDelivery && matchDate;
  });

  // Export handlers
  const handleExportExcel = () => {
    const exportData = filteredInvoices.map(i => ({
      'Invoice No': i.invoiceNumber,
      'Date': i.invoiceDate,
      'Customer': i.customerName,
      'Company': i.companyName,
      'Phone': i.customerPhone,
      'Subtotal': i.subtotal,
      'Discount': i.itemDiscount + i.overallDiscount,
      'VAT': i.vatAmount,
      'Grand Total': i.grandTotal,
      'Paid Amount': i.paidAmount,
      'Balance Due': i.balanceDue,
      'Payment Status': i.paymentStatus,
      'Delivery Status': i.deliveryStatus,
      'PO Number': i.poNumber || ''
    }));
    exportToExcel(exportData, `Sales_Invoices_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    const exportData = filteredInvoices.map(i => ({
      'Invoice No': i.invoiceNumber,
      'Date': i.invoiceDate,
      'Customer': i.customerName,
      'Grand Total': i.grandTotal,
      'Paid': i.paidAmount,
      'Due': i.balanceDue,
      'Payment Status': i.paymentStatus,
      'Delivery Status': i.deliveryStatus
    }));
    exportToCSV(exportData, `Invoices_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            Sales Invoices &amp; Billing
          </h1>
          <p className="text-xs text-zinc-400">
            Manage sales invoicing, sequential tracking, partial payments, and direct delivery slip generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
            title="Export filtered records to Excel"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Invoice #, Customer, Phone, PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Payment status filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Delivery status filter */}
          <div>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Delivered">Fully Delivered</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Date range presets */}
          <div>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year (2026)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>
        </div>

        {/* Custom date range inputs if selected */}
        {dateRangePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 text-xs">
            <span className="text-zinc-400">Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
            />
          </div>
        )}
      </div>

      {/* Summary Chips for Filtered Set */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1 gap-2">
        <div className="flex items-center gap-3">
          <span>Showing <strong className="text-zinc-200">{filteredInvoices.length}</strong> invoices</span>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-semibold">({selectedIds.length} selected)</span>
              <button
                onClick={() => setIsBulkDeleting(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded border border-red-800 text-[11px] font-medium transition-colors"
                title="Delete all selected invoices"
              >
                <Trash2 size={12} />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-4 font-mono text-[11px]">
          <span>
            Total: <strong className="text-zinc-100">{formatCurrency(filteredInvoices.reduce((s, i) => s + i.grandTotal, 0))}</strong>
          </span>
          <span>
            Paid: <strong className="text-emerald-400">{formatCurrency(filteredInvoices.reduce((s, i) => s + i.paidAmount, 0))}</strong>
          </span>
          <span>
            Due: <strong className="text-red-400">{formatCurrency(filteredInvoices.reduce((s, i) => s + i.balanceDue, 0))}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="p-3 font-semibold">Invoice No</th>
                <th className="p-3 font-semibold">Date / Due</th>
                <th className="p-3 font-semibold">Customer &amp; Company</th>
                <th className="p-3 font-semibold text-right">Grand Total</th>
                <th className="p-3 font-semibold text-right">Paid</th>
                <th className="p-3 font-semibold text-right">Balance Due</th>
                <th className="p-3 font-semibold text-center">Payment</th>
                <th className="p-3 font-semibold text-center">Delivery Slip</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500">
                    No sales invoices found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleToggleSelect(inv.id)}
                        className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {inv.invoiceNumber}
                      </button>
                      {inv.poNumber && (
                        <span className="block font-sans text-[10px] text-zinc-500 font-normal">
                          PO: {inv.poNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-zinc-200 block">{formatDate(inv.invoiceDate)}</span>
                      <span className="text-[11px] text-zinc-500">Due: {formatDate(inv.dueDate)}</span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-zinc-200">{inv.customerName}</p>
                      {inv.companyName && inv.companyName !== inv.customerName && (
                        <p className="text-[11px] text-zinc-400">{inv.companyName}</p>
                      )}
                      <p className="text-[10px] text-zinc-500 font-mono">{inv.customerPhone}</p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-100">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {formatCurrency(inv.paidAmount, inv.currency)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={inv.balanceDue > 0 ? 'text-red-400' : 'text-zinc-500'}>
                        {formatCurrency(inv.balanceDue, inv.currency)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : inv.paymentStatus === 'Partially Paid'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : inv.paymentStatus === 'Overdue'
                          ? 'bg-red-950 text-red-400 border border-red-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.deliveryStatus === 'Delivered'
                            ? 'bg-emerald-950 text-emerald-300'
                            : inv.deliveryStatus === 'Partially Delivered'
                            ? 'bg-purple-950 text-purple-300'
                            : inv.deliveryStatus === 'Returned'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {inv.deliveryStatus}
                        </span>
                        {inv.deliverySlipIds && inv.deliverySlipIds.length > 0 && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {inv.deliverySlipIds.length} slip{inv.deliverySlipIds.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            const text = generateInvoiceWhatsAppText(inv, 'Bismillah Multitrade Corporation');
                            setWhatsAppModal({
                              isOpen: true,
                              title: `Send Invoice #${inv.invoiceNumber} to WhatsApp`,
                              phone: inv.customerPhone || '',
                              message: text
                            });
                          }}
                          className="p-1.5 hover:bg-emerald-900/40 rounded text-emerald-400 hover:text-emerald-300"
                          title="Send to WhatsApp"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          className="p-1.5 hover:bg-zinc-700 rounded text-zinc-300 hover:text-amber-400"
                          title="Open Invoice & Delivery Slip Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onEditInvoice(inv.id)}
                          className="p-1.5 hover:bg-zinc-700 rounded text-zinc-300 hover:text-blue-400"
                          title="Edit Invoice"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400"
                          title="Delete Invoice"
                        >
                          <Trash2 size={15} />
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

      {/* Delete Single Invoice Confirmation Modal */}
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        title="Delete Sales Invoice"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? All associated delivery slips and inventory reserves will be accurately reversed.`}
        confirmText="Delete Invoice"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setSelectedIds(prev => prev.filter(id => id !== invoiceToDelete.id));
            setInvoiceToDelete(null);
          }
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleting}
        title="Delete Selected Invoices"
        message={`Are you sure you want to delete the ${selectedIds.length} selected invoices? This will also revert their associated delivery slips and inventory reserves.`}
        confirmText={`Delete ${selectedIds.length} Invoices`}
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          selectedIds.forEach(id => deleteInvoice(id));
          setSelectedIds([]);
          setIsBulkDeleting(false);
        }}
        onCancel={() => setIsBulkDeleting(false)}
      />

      {/* WhatsApp Modal */}
      <WhatsAppSendModal
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal(prev => ({ ...prev, isOpen: false }))}
        title={whatsAppModal.title}
        defaultPhone={whatsAppModal.phone}
        initialMessage={whatsAppModal.message}
      />
    </div>
  );
};
