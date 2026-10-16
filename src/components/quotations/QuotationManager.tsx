import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  MessageSquare,
  Eye,
  Trash2,
  X,
  FileCheck,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Quotation, InvoiceItem } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';


interface Props {
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const QuotationManager: React.FC<Props> = ({ onNavigateToInvoice }) => {
  const {
    quotations,
    saveQuotation,
    convertQuotationToInvoice,
    getNextNumber,
    customers,
    products,
    settings
  } = useData();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);



  // Form State for New Quotation
  const [qtNumber, setQtNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [qtDate, setQtDate] = useState(getTodayDateString());
  const [validityDate, setValidityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [currency, setCurrency] = useState('BDT');
  const [terms, setTerms] = useState('1. Quotation valid for 15 days from issue date.\n2. Payment: 30% advance with work order, balance upon delivery.');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'qt-item-1',
      productId: '',
      productName: '',
      description: '',
      hsCode: '',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      discountType: 'fixed',
      discountValue: 0,
      vatRate: 0,
      taxRate: 0,
      amount: 0
    }
  ]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);

  // Fallback initial sample quotations if array is empty
  const activeQuotations: Quotation[] = quotations.length > 0 ? quotations : [
    {
      id: 'qt-demo-1',
      quotationNumber: 'QT-2026-0001',
      customerId: 'cust-1790370965762',
      customerName: 'MD HASAN',
      customerCompany: 'UMAYER ENTERPRISE',
      quotationDate: '2026-10-05',
      validityDate: '2026-10-25',
      currency: 'BDT',
      exchangeRate: 1,
      items: [
        {
          id: 'item-q1',
          productId: 'prod-burmis-pain-relief',
          productName: 'BURMIS PAIN RELIEF BALM',
          description: '',
          hsCode: '',
          quantity: 500,
          unit: 'Pcs',
          unitPrice: 100,
          discountType: 'fixed',
          discountValue: 0,
          vatRate: 0,
          taxRate: 0,
          amount: 50000
        }
      ],
      subtotal: 50000,
      discount: 2500,
      vat: 0,
      grandTotal: 47500,
      terms: 'Quotation valid for 20 days. Delivery within 48 hours of confirmation.',
      notes: 'Special wholesale trade discount included.',
      status: 'Sent',
      createdAt: '2026-10-05',
      updatedAt: '2026-10-05'
    },
    {
      id: 'qt-demo-2',
      quotationNumber: 'QT-2026-0002',
      customerId: 'cust-demo-2',
      customerName: 'Kazi Farhan',
      customerCompany: 'BENGAL COMMERCE LTD',
      quotationDate: '2026-10-08',
      validityDate: '2026-10-28',
      currency: 'BDT',
      exchangeRate: 1,
      items: [
        {
          id: 'item-q2',
          productId: 'prod-burmis-pain-relief',
          productName: 'BURMIS PAIN RELIEF BALM',
          description: '',
          hsCode: '',
          quantity: 1200,
          unit: 'Pcs',
          unitPrice: 95,
          discountType: 'fixed',
          discountValue: 0,
          vatRate: 0,
          taxRate: 0,
          amount: 114000
        }
      ],
      subtotal: 114000,
      discount: 4000,
      vat: 0,
      grandTotal: 110000,
      terms: 'FOB Chittagong port. Payment via Bank Transfer / Account Payee Cheque.',
      notes: 'Bulk corporate pricing.',
      status: 'Accepted',
      createdAt: '2026-10-08',
      updatedAt: '2026-10-08'
    }
  ];

  // Open Create Form
  const handleOpenCreate = () => {
    const nextNum = getNextNumber ? getNextNumber('quotation') : `QT-2026-${(activeQuotations.length + 1).toString().padStart(4, '0')}`;
    setQtNumber(nextNum);
    setCustomerId('');
    setCustomerName('');
    setCustomerCompany('');
    setCustomerPhone('');
    setQtDate(getTodayDateString());
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setValidityDate(d.toISOString().slice(0, 10));
    setItems([
      {
        id: 'qt-item-1',
        productId: products[0]?.id || '',
        productName: products[0]?.productName || 'BURMIS PAIN RELIEF BALM',
        description: '',
        hsCode: '',
        quantity: 100,
        unit: (products[0]?.unit as any) || 'Pcs',
        unitPrice: products[0]?.sellingPrice || 100,
        discountType: 'fixed',
        discountValue: 0,
        vatRate: 0,
        taxRate: 0,
        amount: 100 * (products[0]?.sellingPrice || 100)
      }
    ]);
    setOverallDiscount(0);
    setVatAmount(0);
    setShowCreateModal(true);
  };

  // Customer dropdown select
  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const c = customers.find(item => item.id === id);
    if (c) {
      setCustomerName(c.customerName);
      setCustomerCompany(c.companyName || '');
      setCustomerPhone(c.phone || '');
    }
  };

  // Item change
  const handleItemProductChange = (index: number, pId: string) => {
    const p = products.find(prod => prod.id === pId);
    if (!p) return;
    setItems(prev => {
      const copy = [...prev];
      const cur = copy[index];
      const price = p.sellingPrice || 0;
      copy[index] = {
        ...cur,
        productId: p.id,
        productName: p.productName,
        unit: p.unit || 'Pcs',
        unitPrice: price,
        amount: cur.quantity * price
      };
      return copy;
    });
  };

  const handleItemQtyPriceChange = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    setItems(prev => {
      const copy = [...prev];
      const cur = copy[index];
      const qty = field === 'quantity' ? val : cur.quantity;
      const prc = field === 'unitPrice' ? val : cur.unitPrice;
      copy[index] = {
        ...cur,
        [field]: val,
        amount: qty * prc
      };
      return copy;
    });
  };

  const handleAddItem = () => {
    const p = products[0];
    setItems(prev => [
      ...prev,
      {
        id: 'qt-item-' + Date.now(),
        productId: p?.id || '',
        productName: p?.productName || '',
        description: '',
        hsCode: '',
        quantity: 1,
        unit: (p?.unit as any) || 'Pcs',
        unitPrice: p?.sellingPrice || 0,
        discountType: 'fixed',
        discountValue: 0,
        vatRate: 0,
        taxRate: 0,
        amount: p?.sellingPrice || 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount + vatAmount);

  // Submit Save
  const handleSaveQuotation = (sendWhatsAppDirect = false) => {
    if (!customerName.trim()) {
      alert('Please enter or select a customer name');
      return;
    }
    const newQuotation: Quotation = {
      id: 'qt-' + Date.now(),
      quotationNumber: qtNumber.trim() || `QT-2026-${Date.now().toString().slice(-4)}`,
      customerId: customerId || 'cust-' + Date.now(),
      customerName: customerName.trim(),
      customerCompany: customerCompany.trim(),
      quotationDate: qtDate,
      validityDate: validityDate,
      currency,
      exchangeRate: 1,
      items,
      subtotal,
      discount: overallDiscount,
      vat: vatAmount,
      grandTotal,
      terms,
      notes,
      status: 'Sent',
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveQuotation(newQuotation);
    setShowCreateModal(false);
  };

  // Convert Quotation to Sales Invoice
  const handleConvert = (qt: Quotation) => {
    try {
      const newInvoiceId = convertQuotationToInvoice(qt.id);
      alert(`Quotation ${qt.quotationNumber} successfully converted to Sales Invoice!`);
      if (onNavigateToInvoice) {
        onNavigateToInvoice(newInvoiceId);
      }
    } catch (e: any) {
      alert('Conversion failed: ' + e.message);
    }
  };

  // Filtered
  const filteredQuotations = activeQuotations.filter(q => {
    const matchSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalQuotedValue = activeQuotations.reduce((sum, q) => sum + q.grandTotal, 0);
  const acceptedCount = activeQuotations.filter(q => q.status === 'Accepted').length;

  return (
    <div className="space-y-5 text-slate-900 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-orange-500" size={22} />
            <span>Price Quotations &amp; Proposals</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create professional price quotes, convert directly to Sales Invoices, and send directly to any WhatsApp number.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Create New Quotation</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Quotations</span>
          <span className="text-2xl font-black text-slate-900 block my-1">{activeQuotations.length}</span>
          <span className="text-[11px] text-slate-400">Formal trade quotes</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Quoted Value</span>
          <span className="text-2xl font-black text-orange-600 font-mono block my-1">
            {formatCurrency(totalQuotedValue)}
          </span>
          <span className="text-[11px] text-slate-400">Across all proposals</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Accepted Proposals</span>
          <span className="text-2xl font-black text-emerald-600 block my-1">{acceptedCount}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">Ready for invoicing</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Conversion Rate</span>
          <span className="text-2xl font-black text-blue-600 block my-1">
            {activeQuotations.length > 0 ? Math.round((acceptedCount / activeQuotations.length) * 100) : 0}%
          </span>
          <span className="text-[11px] text-blue-500 font-medium">To Sales Invoices</span>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5">Quotation No</th>
                <th className="py-3 px-3">Customer &amp; Company</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.map(qt => (
                <tr key={qt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-orange-600 whitespace-nowrap">
                    {qt.quotationNumber}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 block">{qt.customerName}</span>
                    {qt.customerCompany && (
                      <span className="text-[11px] text-slate-500 block">{qt.customerCompany}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {formatDate(qt.quotationDate)}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDate(qt.validityDate)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(qt.grandTotal, qt.currency)}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        qt.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : qt.status === 'Sent'
                          ? 'bg-blue-100 text-blue-800'
                          : qt.status === 'Draft'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {qt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Convert to Invoice */}
                      <button
                        onClick={() => handleConvert(qt)}
                        title="Convert directly to Sales Invoice"
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <FileCheck size={13} />
                        <span>Convert to Invoice</span>
                      </button>



                      {/* Preview / View */}
                      <button
                        onClick={() => setPreviewQuotation(qt)}
                        title="View & Print Quotation"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FileText className="text-orange-500" size={18} />
                  <span>Create Price Quotation</span>
                </h3>
                <p className="text-xs text-slate-500">Provide official price quote with validity period</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quotation No *</label>
                  <input
                    type="text"
                    value={qtNumber}
                    onChange={(e) => setQtNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quotation Date *</label>
                  <input
                    type="date"
                    value={qtDate}
                    onChange={(e) => setQtDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Customer Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block text-xs">Customer Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Select Existing Customer</label>
                    <select
                      value={customerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.customerName} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Customer / Contact Person *</label>
                    <input
                      type="text"
                      placeholder="e.g. MD Hasan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">WhatsApp / Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 01890089982"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Quoted Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-2">Product Name</th>
                        <th className="p-2 w-24 text-right">Quantity</th>
                        <th className="p-2 w-16 text-center">Unit</th>
                        <th className="p-2 w-28 text-right">Unit Price</th>
                        <th className="p-2 w-28 text-right">Total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={it.productId}
                              onChange={(e) => handleItemProductChange(idx, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-900"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.productName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              placeholder="0"
                              value={it.quantity === 0 ? '' : it.quantity}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              onChange={(e) => handleItemQtyPriceChange(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:placeholder-transparent"
                            />
                          </td>
                          <td className="p-2 text-center text-slate-500">{it.unit}</td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              placeholder="0"
                              value={it.unitPrice === 0 ? '' : it.unitPrice}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              onChange={(e) => handleItemQtyPriceChange(idx, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono text-slate-900 focus:placeholder-transparent"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(it.amount)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-500 mb-1">Commercial Terms &amp; Conditions</label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Discount:</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={overallDiscount === 0 ? '' : overallDiscount}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => setOverallDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-24 bg-white border border-slate-200 rounded px-2 py-0.5 text-right font-mono text-xs focus:placeholder-transparent"
                    />
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-orange-600 font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuotation(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW / PRINT MODAL */}
      {previewQuotation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-base font-black text-slate-900">
                Quotation Preview: {previewQuotation.quotationNumber}
              </span>
              <button onClick={() => setPreviewQuotation(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{settings?.companyName || 'Bismillah Multitrade Corporation'}</h4>
                  <p className="text-slate-500">Official Price Quotation</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-orange-600 block">{previewQuotation.quotationNumber}</span>
                  <span className="text-slate-500 block">Date: {previewQuotation.quotationDate}</span>
                  <span className="text-slate-500 block">Valid Until: {previewQuotation.validityDate}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800">Client:</span>
                <p className="text-slate-700">{previewQuotation.customerName} {previewQuotation.customerCompany ? `(${previewQuotation.customerCompany})` : ''}</p>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 bg-white rounded">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewQuotation.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2">{it.productName}</td>
                      <td className="p-2 text-right font-mono">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="p-2 text-right font-mono font-bold">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-orange-600 font-mono">{formatCurrency(previewQuotation.grandTotal)}</span>
              </div>

              {previewQuotation.terms && (
                <div className="text-[11px] text-slate-500 pt-2">
                  <strong className="block text-slate-700">Terms:</strong>
                  {previewQuotation.terms}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleConvert(previewQuotation)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                <FileCheck size={14} />
                <span>Convert to Sales Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
