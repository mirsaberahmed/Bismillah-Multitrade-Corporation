import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SalesInvoice, InvoiceItem } from '../../types';
import { getTodayDateString, numberToWordsBDT, formatCurrency } from '../../utils/formatters';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText } from '../../utils/whatsapp';
import { PrintableInvoice } from '../documents/PrintableInvoice';
import { MessageSquare, CheckCircle2, Send } from 'lucide-react';

interface Props {
  invoiceId?: string; // If editing
  onCancel: () => void;
  onSuccess: (savedInvoiceId: string) => void;
}

export const InvoiceForm: React.FC<Props> = ({ invoiceId, onCancel, onSuccess }) => {
  const {
    settings,
    customers,
    products,
    invoices,
    saveInvoice,
    saveCustomer,
    getNextNumber
  } = useData();

  const isEditing = Boolean(invoiceId);
  const existingInvoice = invoices.find(i => i.id === invoiceId);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(
    existingInvoice?.invoiceNumber || getNextNumber('invoice')
  );
  const [invoiceDate, setInvoiceDate] = useState(
    existingInvoice?.invoiceDate || getTodayDateString()
  );
  const [dueDate, setDueDate] = useState(() => {
    if (existingInvoice?.dueDate) return existingInvoice.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });

  const [customerId, setCustomerId] = useState(existingInvoice?.customerId || '');
  const [customerName, setCustomerName] = useState(existingInvoice?.customerName || '');
  const [companyName, setCompanyName] = useState(existingInvoice?.companyName || '');
  const [customerPhone, setCustomerPhone] = useState(existingInvoice?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(existingInvoice?.customerEmail || '');
  const [customerAddress, setCustomerAddress] = useState(existingInvoice?.customerAddress || '');
  const [customerBin, setCustomerBin] = useState(existingInvoice?.customerBin || '');
  const [customerTin, setCustomerTin] = useState(existingInvoice?.customerTin || '');
  const [previousDue, setPreviousDue] = useState<number>(existingInvoice?.previousDue || 0);

  const [poNumber, setPoNumber] = useState(existingInvoice?.poNumber || '');
  const [referenceNumber, setReferenceNumber] = useState(existingInvoice?.referenceNumber || '');
  const [paymentTerms, setPaymentTerms] = useState(existingInvoice?.paymentTerms || '15 Days Credit');
  const [salesPerson, setSalesPerson] = useState(existingInvoice?.salesPerson || 'Executive');
  const [currency, setCurrency] = useState(existingInvoice?.currency || 'BDT');
  const [exchangeRate, setExchangeRate] = useState<number>(existingInvoice?.exchangeRate || 1);

  // Items - all default values start at 0
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (existingInvoice && existingInvoice.items.length > 0) {
      return existingInvoice.items;
    }
    return [
      {
        id: 'item-' + Date.now(),
        productId: '',
        productName: '',
        description: '',
        hsCode: '',
        quantity: 0,
        unit: 'Pcs',
        unitPrice: 0,
        discountType: 'fixed',
        discountValue: 0,
        vatRate: 0,
        taxRate: 0,
        amount: 0
      }
    ];
  });

  // Additional Charges & Adjustments - all default to 0
  const [overallDiscount, setOverallDiscount] = useState<number>(existingInvoice?.overallDiscount || 0);
  const [aitAmount, setAitAmount] = useState<number>(existingInvoice?.aitAmount || 0);
  const [transportCharge, setTransportCharge] = useState<number>(existingInvoice?.transportCharge || 0);
  const [shippingCharge, setShippingCharge] = useState<number>(existingInvoice?.shippingCharge || 0);
  const [loadingCharge, setLoadingCharge] = useState<number>(existingInvoice?.loadingCharge || 0);
  const [otherCharge, setOtherCharge] = useState<number>(existingInvoice?.otherCharge || 0);
  const [roundAdjustment, setRoundAdjustment] = useState<number>(existingInvoice?.roundAdjustment || 0);
  const [paidAmount, setPaidAmount] = useState<number>(existingInvoice?.paidAmount || 0);
  const [remarks, setRemarks] = useState(existingInvoice?.remarks || '');
  // Payment Option checkbox (defaults to false; only show on invoice if ticked)
  const [showPaymentDetails, setShowPaymentDetails] = useState<boolean>(existingInvoice?.showPaymentDetails ?? false);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSavedNotice, setCustomerSavedNotice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<SalesInvoice | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'whatsapp' | 'text'>('whatsapp');

  // When an existing customer is selected from dropdown, populate all contact & billing fields
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (!id) return;
    const selected = customers.find(c => c.id === id);
    if (selected) {
      setCustomerName(selected.customerName || '');
      setCompanyName(selected.companyName || '');
      setCustomerPhone(selected.phone || '');
      setCustomerEmail(selected.email || '');
      setCustomerAddress(selected.billingAddress || selected.shippingAddress || '');
      setCustomerBin(selected.binNumber || '');
      setCustomerTin(selected.tinNumber || '');
      setPreviousDue(selected.currentBalance || 0);
      if (selected.paymentTerms) setPaymentTerms(selected.paymentTerms);
    }
  };

  // Explicitly save/update customer info to Cloud & Customer Directory
  const handleQuickSaveCustomer = () => {
    if (!customerName.trim()) {
      return;
    }
    const existing = customers.find(
      c =>
        (customerId && c.id === customerId) ||
        c.customerName.trim().toLowerCase() === customerName.trim().toLowerCase() ||
        (customerPhone.trim() && c.phone.trim() === customerPhone.trim())
    );
    const custId = existing?.id || customerId || 'cust-' + Date.now();
    saveCustomer({
      id: custId,
      customerId: existing?.customerId || ('CUST-' + Date.now().toString().slice(-4)),
      customerName: customerName.trim(),
      companyName: (companyName || customerName).trim(),
      customerType: existing?.customerType || 'Corporate',
      contactPerson: customerName.trim(),
      phone: customerPhone.trim(),
      email: customerEmail.trim(),
      billingAddress: customerAddress.trim(),
      shippingAddress: customerAddress.trim(),
      city: existing?.city || 'Dhaka',
      district: existing?.district || 'Dhaka',
      country: existing?.country || 'Bangladesh',
      postalCode: existing?.postalCode || '1216',
      binNumber: customerBin.trim(),
      tinNumber: customerTin.trim(),
      openingBalance: existing?.openingBalance ?? previousDue,
      currentBalance: existing?.currentBalance ?? previousDue,
      creditLimit: existing?.creditLimit || 500000,
      paymentTerms: paymentTerms || '15 Days Credit',
      createdAt: existing?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    });
    setCustomerId(custId);
    setCustomerSavedNotice(true);
    setTimeout(() => setCustomerSavedNotice(false), 3000);
  };

  // Product Selection handler for an item row
  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index].quantity || 0;
      const baseAmount = prod.sellingPrice * qty;
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.productName,
        description: prod.description,
        hsCode: prod.hsCode,
        unit: prod.unit,
        unitPrice: prod.sellingPrice,
        vatRate: prod.vatRate || 0,
        taxRate: prod.taxRate || 0,
        amount: baseAmount
      };
      return updated;
    });
  };

  // Item field change
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalculate row amount
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const lineBase = qty * price;
      const discount = item.discountType === 'percentage'
        ? (lineBase * (Number(item.discountValue) || 0)) / 100
        : (Number(item.discountValue) || 0);

      const discounted = Math.max(0, lineBase - discount);
      const vat = (discounted * (Number(item.vatRate) || 0)) / 100;
      const tax = (discounted * (Number(item.taxRate) || 0)) / 100;

      item.amount = Math.round((discounted + vat + tax) * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        productId: '',
        productName: '',
        description: '',
        hsCode: '',
        quantity: 0,
        unit: 'Pcs',
        unitPrice: 0,
        discountType: 'fixed',
        discountValue: 0,
        vatRate: 0,
        taxRate: 0,
        amount: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let vatTotal = 0;
  let taxTotal = 0;

  items.forEach(item => {
    const lineBase = (item.quantity || 0) * (item.unitPrice || 0);
    const disc = item.discountType === 'percentage'
      ? (lineBase * (item.discountValue || 0)) / 100
      : (item.discountValue || 0);
    const afterDisc = Math.max(0, lineBase - disc);
    const vat = (afterDisc * (item.vatRate || 0)) / 100;
    const tax = (afterDisc * (item.taxRate || 0)) / 100;

    subtotal += lineBase;
    itemDiscountTotal += disc;
    vatTotal += vat;
    taxTotal += tax;
  });

  const netAfterDiscount = subtotal - itemDiscountTotal - overallDiscount;
  const grandTotal = Math.max(
    0,
    netAfterDiscount +
      vatTotal +
      taxTotal +
      aitAmount +
      transportCharge +
      shippingCharge +
      loadingCharge +
      otherCharge +
      previousDue +
      roundAdjustment
  );

  const balanceDue = Math.max(0, grandTotal - paidAmount);
  const amountInWords = numberToWordsBDT(Math.round(grandTotal * 100) / 100);

  // Form Submission
  const handleSubmit = (e?: React.FormEvent, targetMode?: 'whatsapp' | 'text') => {
    if (e) e.preventDefault();

    if (!customerName.trim()) {
      alert('Please write or select a customer name.');
      return;
    }

    if (items.length === 0 || items.every(i => (Number(i.quantity) || 0) <= 0)) {
      alert('Please enter a quantity greater than zero for at least one item.');
      return;
    }

    const fullInvoice: SalesInvoice = {
      id: existingInvoice?.id || 'inv-' + Date.now(),
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      customerName,
      companyName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerBin,
      customerTin,
      poNumber,
      referenceNumber,
      paymentTerms,
      salesPerson,
      currency,
      exchangeRate,
      items,
      subtotal,
      itemDiscount: itemDiscountTotal,
      overallDiscount,
      vatAmount: vatTotal,
      taxAmount: taxTotal,
      aitAmount,
      shippingCharge,
      transportCharge,
      loadingCharge,
      otherCharge,
      previousDue,
      roundAdjustment,
      grandTotal,
      paidAmount,
      balanceDue,
      amountInWords,
      showPaymentDetails,
      paymentStatus:
        paidAmount >= grandTotal && grandTotal > 0
          ? 'Paid'
          : paidAmount > 0
          ? 'Partially Paid'
          : 'Unpaid',
      deliveryStatus: existingInvoice?.deliveryStatus || 'Ready for Delivery',
      deliverySlipIds: existingInvoice?.deliverySlipIds || [],
      paymentIds: existingInvoice?.paymentIds || [],
      remarks,
      createdAt: existingInvoice?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    const savedId = saveInvoice(fullInvoice);
    if (targetMode) {
      setCreatedInvoice(fullInvoice);
      setWhatsAppMode(targetMode);
      setWhatsAppModalOpen(true);
    } else if (!isEditing) {
      setCreatedInvoice(fullInvoice);
      setWhatsAppMode('whatsapp');
      setWhatsAppModalOpen(true);
    } else {
      onSuccess(savedId);
    }
  };

  return (
    <>
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title="Cancel"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight">
              {isEditing ? `Edit Invoice: ${invoiceNumber}` : 'Create New Sales Invoice'}
            </h1>
            <p className="text-xs text-zinc-400">
              Bismillah Multitrade Corporation • Mirpur, Dhaka-1216
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>

          {/* Send WhatsApp (PDF Attachment) */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'whatsapp')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Save and send Invoice PDF directly through WhatsApp"
          >
            <MessageSquare size={14} />
            <span>Send WhatsApp</span>
          </button>

          {/* Send Text (Prepared Text Only) */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'text')}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-lg text-xs border border-zinc-700 transition-colors cursor-pointer"
            title="Save and send only prepared text message through WhatsApp"
          >
            <Send size={13} className="text-emerald-400" />
            <span>Send Text</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs">
        <div>
          <label className="block text-zinc-400 font-medium mb-1">Invoice Number *</label>
          <input
            type="text"
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Invoice Date *</label>
          <input
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Payment Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Customer PO Number</label>
          <input
            type="text"
            placeholder="e.g. PO-8921/2026"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customer & Billing Information Box */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <User size={15} />
              Customer &amp; Billing Details
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select a saved customer from the dropdown below or type new customer details (auto-saves to cloud).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {customerSavedNotice && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                ✓ Customer Saved to Cloud
              </span>
            )}
            <button
              type="button"
              onClick={handleQuickSaveCustomer}
              disabled={!customerName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Save this customer to Cloud Directory for future invoices"
            >
              <Save size={13} />
              <span>Save Customer Info</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* Customer Name Input with Built-In Saved Customer Dropdown */}
          <div className="sm:col-span-2 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                <span>Customer Name *</span>
              </label>
              {customers.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowCustomerDropdown(prev => !prev);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  {showCustomerDropdown ? 'Hide List ▲' : `Saved List (${customers.length}) ▼`}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Click to select saved customer or type new name..."
                value={customerName}
                onFocus={() => setShowCustomerDropdown(true)}
                onClick={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerName(val);
                  setShowCustomerDropdown(true);
                  const matched = customers.find(
                    c => c.customerName.toLowerCase() === val.trim().toLowerCase() ||
                         (c.companyName && c.companyName.toLowerCase() === val.trim().toLowerCase())
                  );
                  if (matched) {
                    handleCustomerChange(matched.id);
                  } else {
                    setCustomerId('');
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-zinc-100 font-semibold focus:outline-none focus:border-amber-500 text-sm"
              />
              {customers.length > 0 && (
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowCustomerDropdown(prev => !prev);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 text-xs px-1 cursor-pointer"
                  title="Show Saved Customers"
                >
                  ▼
                </button>
              )}
            </div>

            {/* Interactive Dropdown Menu inside Customer Name Box */}
            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-zinc-900 border border-amber-500/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-zinc-800">
                <div className="px-3 py-1.5 bg-zinc-950 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Saved Customers ({customers.length})</span>
                  <span>Select to Auto-Fill</span>
                </div>
                {(() => {
                  const q = customerName.trim().toLowerCase();
                  const exactMatch = customers.some(
                    c => c.customerName.trim().toLowerCase() === q
                  );
                  const filteredCustomers = (!q || exactMatch)
                    ? customers
                    : customers.filter(c =>
                        c.customerName.toLowerCase().includes(q) ||
                        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
                        (c.phone && c.phone.includes(q))
                      );
                  const listToShow = filteredCustomers.length > 0 ? filteredCustomers : customers;
                  return listToShow.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCustomerChange(c.id);
                        setShowCustomerDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-zinc-800 transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        customerId === c.id ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-zinc-100 text-xs">{c.customerName}</span>
                        {c.phone && (
                          <span className="font-mono text-[11px] text-amber-400 font-semibold">{c.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span className="truncate font-medium text-amber-300/90">{c.companyName}</span>
                        {c.billingAddress && (
                          <span className="truncate text-zinc-500 max-w-[220px]">{c.billingAddress}</span>
                        )}
                      </div>
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Company / Organization</label>
            <input
              type="text"
              placeholder="e.g. Meghna Group"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="017XXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-400 font-medium mb-1">Billing &amp; Delivery Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">BIN Number</label>
            <input
              type="text"
              value={customerBin}
              onChange={(e) => setCustomerBin(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Customer Previous Due (BDT)</label>
            <input
              type="number"
              placeholder="0"
              value={previousDue === 0 ? '' : previousDue}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setPreviousDue(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-amber-400 font-bold focus:outline-none focus:border-amber-500 font-mono focus:placeholder-transparent"
            />
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <FileText size={15} />
            Products &amp; Line Items
          </h2>
          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded text-xs font-semibold"
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="pb-2 w-8 text-center">#</th>
                <th className="pb-2 min-w-[220px]">Product</th>
                <th className="pb-2 w-24">HS Code</th>
                <th className="pb-2 w-20">Quantity</th>
                <th className="pb-2 w-16 text-center">Unit</th>
                <th className="pb-2 w-28 text-right">Unit Price</th>
                <th className="pb-2 w-24 text-right">Disc. (BDT)</th>
                <th className="pb-2 w-16 text-right">VAT%</th>
                <th className="pb-2 w-28 text-right">Line Total</th>
                <th className="pb-2 w-10 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-zinc-800/30">
                  <td className="py-2 text-center text-zinc-500">{index + 1}</td>
                  <td className="py-2 pr-2">
                    <div className="relative">
                      <input
                        type="text"
                        list={`product-datalist-${index}`}
                        placeholder="Type custom product name (e.g. Burmis Pain Relief Blum)"
                        value={item.productName}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleItemChange(index, 'productName', val);
                          const matched = products.find(p => p.productName.toLowerCase() === val.trim().toLowerCase());
                          if (matched) {
                            handleProductSelect(index, matched.id);
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 font-semibold mb-1 focus:outline-none focus:border-amber-500"
                      />
                      <datalist id={`product-datalist-${index}`}>
                        {products.map(p => (
                          <option key={p.id} value={p.productName}>
                            {p.productName} ({p.unit})
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleProductSelect(index, e.target.value);
                          }
                        }}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="">-- Select Product (BURMIS PAIN RELIEF BALM) --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.productName} {p.sellingPrice > 0 ? `(BDT ${p.sellingPrice})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const matched = products.find(p => p.id === 'prod-burmis-pain-relief' || p.productName.toLowerCase().includes('burmis'));
                          if (matched) {
                            handleProductSelect(index, matched.id);
                          } else {
                            handleItemChange(index, 'productName', 'BURMIS PAIN RELIEF BALM');
                          }
                        }}
                        className="text-[11px] text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 font-semibold rounded px-2 py-1 transition-colors whitespace-nowrap"
                        title="Select BURMIS PAIN RELIEF BALM instantly"
                      >
                        ⚡ BURMIS PAIN RELIEF BALM
                      </button>
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={item.hsCode || ''}
                      onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 font-bold focus:outline-none focus:border-amber-500 text-right focus:placeholder-transparent"
                    />
                  </td>
                  <td className="py-2 pr-2 text-center">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-xs text-zinc-300 text-center focus:outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={item.unitPrice === 0 ? '' : item.unitPrice}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 font-mono text-right font-semibold focus:outline-none focus:border-amber-500 focus:placeholder-transparent"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.discountValue === 0 ? '' : item.discountValue}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => handleItemChange(index, 'discountValue', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 font-mono text-right focus:outline-none focus:border-amber-500 focus:placeholder-transparent"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.vatRate === 0 ? '' : item.vatRate}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => handleItemChange(index, 'vatRate', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-1 py-1 text-xs text-zinc-300 font-mono text-right focus:outline-none focus:border-amber-500 focus:placeholder-transparent"
                    />
                  </td>
                  <td className="py-2 pr-2 text-right font-mono font-bold text-amber-400">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals & Financial Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Terms, Payment instructions & Amount in Words */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs space-y-3">
            <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
              Payment Terms &amp; Currency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                >
                  <option value="BDT">BDT (Bangladeshi Taka)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="CNY">CNY (¥ - Chinese Yuan)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                </select>
              </div>

              {currency !== 'BDT' && (
                <div>
                  <label className="block text-zinc-400 mb-1">Exchange Rate to BDT</label>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Executive</label>
                <input
                  type="text"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Invoice Remarks &amp; Special Notes</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Delivery via Mirpur Depot. Payment via Account Payee Cheque."
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200"
              />
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl text-xs">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Amount in Words (Bangladeshi Taka):
            </span>
            <p className="font-semibold text-zinc-200 italic">
              {amountInWords}
            </p>
          </div>
        </div>

        {/* Right Side: Totals Calculation Card */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-zinc-200">{formatCurrency(subtotal)}</span>
          </div>

          {itemDiscountTotal > 0 && (
            <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
              <span>Item Discounts:</span>
              <span className="font-mono text-red-400">-{formatCurrency(itemDiscountTotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-zinc-800">
            <span className="text-zinc-400">Overall Special Discount:</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={overallDiscount === 0 ? '' : overallDiscount}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setOverallDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-red-400 font-mono text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
            <span>VAT Total:</span>
            <span className="font-mono text-zinc-200">{formatCurrency(vatTotal)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-800">
            <span className="text-zinc-400">AIT (Advance Income Tax):</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={aitAmount === 0 ? '' : aitAmount}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setAitAmount(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-800">
            <span className="text-zinc-400">Transport / Courier Charge:</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={transportCharge === 0 ? '' : transportCharge}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setTransportCharge(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-800">
            <span className="text-zinc-400">Loading / Labor Charge:</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={loadingCharge === 0 ? '' : loadingCharge}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setLoadingCharge(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 font-mono text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-800">
            <span className="text-zinc-400">Round Adjustment (±):</span>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={roundAdjustment === 0 ? '' : roundAdjustment}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setRoundAdjustment(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
            <span>Customer Previous Due:</span>
            <span className="font-mono text-amber-400 font-bold">{formatCurrency(previousDue)}</span>
          </div>

          {/* Payment Option Toggle (Requirement: Payment option e thik click dile oita invoice e show korbe otherwise korbe na) */}
          <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 my-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPaymentDetails}
                onChange={(e) => setShowPaymentDetails(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500 bg-zinc-900 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-xs">Payment Option (Show on Invoice)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    showPaymentDetails
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {showPaymentDetails ? '✓ Ticked (Visible)' : '✗ Unticked (Hidden)'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Payment details (Paid Amount, Due &amp; Bank details) will only appear on the invoice if this option is ticked.
                </p>
              </div>
            </label>
          </div>

          {/* Grand Total Box (Yellow Golden accent as requested) */}
          <div className="flex justify-between items-center p-3 bg-amber-500 text-zinc-950 font-black rounded-lg text-base shadow-sm mt-3">
            <span>GRAND TOTAL:</span>
            <span className="font-mono text-xl">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-zinc-400 font-medium block">Initial Paid Amount (if any):</span>
              {!showPaymentDetails && (
                <span className="text-[10px] text-zinc-500 italic">Will be hidden on invoice (Unticked)</span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max={grandTotal}
              placeholder="0"
              value={paidAmount === 0 ? '' : paidAmount}
              onFocus={(e) => e.target.select()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              onChange={(e) => setPaidAmount(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-36 bg-zinc-950 border border-emerald-600 rounded px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right focus:placeholder-transparent"
            />
          </div>

          <div className="flex justify-between py-2 text-sm font-bold border-t border-zinc-800">
            <div>
              <span className="text-zinc-300 block">Balance Due:</span>
              {!showPaymentDetails && (
                <span className="text-[10px] text-zinc-500 font-normal italic">Hidden on invoice</span>
              )}
            </div>
            <span className={`font-mono ${balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 flex-wrap">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>

            {/* Send WhatsApp (PDF Attachment) */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'whatsapp')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Save and send Invoice PDF directly through WhatsApp"
            >
              <MessageSquare size={14} />
              <span>Send WhatsApp</span>
            </button>

            {/* Send Text (Prepared Text Only) */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'text')}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-lg text-xs border border-zinc-700 transition-colors cursor-pointer"
              title="Save and send only prepared text message through WhatsApp"
            >
              <Send size={13} className="text-emerald-400" />
              <span>Send Text</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Save size={15} />
              <span>Save Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </form>

      {/* Offscreen container for high-res PDF generation */}
      {createdInvoice && (
        <div
          id={`created-invoice-printable-${createdInvoice.id}`}
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
          <PrintableInvoice invoice={createdInvoice} settings={settings} />
        </div>
      )}

      {/* Direct WhatsApp Send Modal after Invoice Creation */}
      <WhatsAppSendModal
        isOpen={whatsAppModalOpen}
        onClose={() => {
          setWhatsAppModalOpen(false);
          if (createdInvoice) {
            onSuccess(createdInvoice.id);
          }
        }}
        title={`Invoice #${createdInvoice?.invoiceNumber || ''} Created! Send to WhatsApp`}
        defaultPhone={createdInvoice?.customerPhone || customerPhone || ''}
        initialMessage={
          createdInvoice
            ? generateInvoiceWhatsAppText(createdInvoice, settings?.companyName || 'Bismillah Multitrade Corporation')
            : ''
        }
        pdfElementId={createdInvoice ? `created-invoice-printable-${createdInvoice.id}` : undefined}
        pdfFilename={createdInvoice ? `Invoice-${createdInvoice.invoiceNumber}` : undefined}
        documentType="Invoice"
        documentNumber={createdInvoice?.invoiceNumber}
        defaultMode={whatsAppMode}
      />
    </>
  );
};
