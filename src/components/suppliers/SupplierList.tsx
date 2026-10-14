import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  FileSpreadsheet,
  Globe,
  Package,
  CreditCard,
  AlertCircle,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Supplier } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';

export const SupplierList: React.FC = () => {
  const { suppliers, purchaseInvoices, saveSupplier, deleteSupplier } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Form fields
  const [supplierName, setSupplierName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supplierType, setSupplierType] = useState<'Local' | 'International'>('Local');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [city, setCity] = useState('Dhaka');
  const [binNumber, setBinNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [payableBalance, setPayableBalance] = useState<number>(0);
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [orderedQty, setOrderedQty] = useState<number>(0);
  const [deliveredQty, setDeliveredQty] = useState<number>(0);

  // Helper to compute supplier stats from purchases and supplier fields
  const getSupplierStats = (sup: Supplier) => {
    const matchingPurchases = purchaseInvoices.filter(
      pi => pi.supplierId === sup.id || (pi.supplierName && pi.supplierName.toLowerCase() === sup.supplierName.toLowerCase())
    );

    const purchaseTotal = matchingPurchases.reduce((s, pi) => s + (pi.grandTotal || 0), 0);
    const computedDue = matchingPurchases.reduce((s, pi) => s + (pi.balanceDue || 0), 0);
    const computedQty = matchingPurchases.reduce(
      (s, pi) => s + (pi.items || []).reduce((itemSum, it) => itemSum + (Number(it.quantity) || 0), 0),
      0
    );

    // Resolve effective payable balance
    const payable = sup.currentBalance !== undefined
      ? sup.currentBalance
      : (sup.currentPayable !== undefined ? sup.currentPayable : 0);

    // Resolve effective due
    const due = sup.totalDue !== undefined && sup.totalDue > 0
      ? sup.totalDue
      : (computedDue > 0 ? computedDue : payable);

    // Resolve effective ordered qty
    const ordered = sup.orderedProductQty !== undefined && sup.orderedProductQty > 0
      ? sup.orderedProductQty
      : (sup.suppliedProductQty !== undefined && sup.suppliedProductQty > 0 ? sup.suppliedProductQty : computedQty);

    // Resolve effective delivered qty
    const delivered = sup.deliveredProductQty !== undefined && sup.deliveredProductQty > 0
      ? sup.deliveredProductQty
      : (matchingPurchases.some(pi => (pi as any).deliveryStatus === 'Delivered') ? computedQty : (sup.suppliedProductQty || 0));

    return {
      payable,
      due,
      ordered,
      delivered,
      qty: ordered,
      purchaseCount: matchingPurchases.length,
      purchaseTotal
    };
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setCompanyName('');
    setSupplierType('Local');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCountry('Bangladesh');
    setCity('Dhaka');
    setBinNumber('');
    setTinNumber('');
    setCurrency('BDT');
    setPayableBalance(0);
    setDueAmount(0);
    setOrderedQty(0);
    setDeliveredQty(0);
    setShowModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    const stats = getSupplierStats(sup);
    setEditingSupplier(sup);
    setSupplierName(sup.supplierName);
    setCompanyName(sup.companyName);
    setSupplierType(
      (sup.supplierType as 'International' | 'Local') ||
      (sup.country === 'Bangladesh' ? 'Local' : 'International')
    );
    setContactPerson(sup.contactPerson || '');
    setPhone(sup.phone);
    setEmail(sup.email);
    setAddress(sup.address);
    setCountry(sup.country);
    setCity(sup.city);
    setBinNumber(sup.binNumber || '');
    setTinNumber(sup.tinNumber || '');
    setCurrency(sup.currency);
    setPayableBalance(stats.payable);
    setDueAmount(stats.due);
    setOrderedQty(stats.ordered);
    setDeliveredQty(stats.delivered);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !phone.trim()) {
      alert('Supplier Name and Phone are required.');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier?.id || 'sup-' + Date.now(),
      supplierId: editingSupplier?.supplierId || ('SUPP-' + Date.now().toString().slice(-4)),
      supplierName: supplierName.trim(),
      companyName: companyName.trim() || supplierName.trim(),
      supplierType,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      country: country.trim(),
      city: city.trim(),
      postalCode: editingSupplier?.postalCode || '1000',
      binNumber: binNumber.trim(),
      tinNumber: tinNumber.trim(),
      currency,
      openingBalance: editingSupplier?.openingBalance || 0,
      currentPayable: payableBalance,
      currentBalance: payableBalance,
      totalDue: dueAmount,
      orderedProductQty: orderedQty,
      deliveredProductQty: deliveredQty,
      suppliedProductQty: deliveredQty || orderedQty,
      paymentTerms: editingSupplier?.paymentTerms || '30 Days LC / TT',
      createdAt: editingSupplier?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveSupplier(newSupplier);
    setShowModal(false);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.supplierName.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.country.toLowerCase().includes(q)
    );
  });

  // Calculate overview totals
  const totalPayableAll = suppliers.reduce((s, sup) => s + getSupplierStats(sup).payable, 0);
  const totalDueAll = suppliers.reduce((s, sup) => s + getSupplierStats(sup).due, 0);
  const totalOrderedQtyAll = suppliers.reduce((s, sup) => s + getSupplierStats(sup).ordered, 0);
  const totalDeliveredQtyAll = suppliers.reduce((s, sup) => s + getSupplierStats(sup).delivered, 0);

  const handleExportExcel = () => {
    const data = filteredSuppliers.map(s => {
      const stats = getSupplierStats(s);
      return {
        'Supplier Name': s.supplierName,
        'Company Name': s.companyName,
        'Type': s.supplierType,
        'Country': s.country,
        'Phone': s.phone,
        'Email': s.email,
        'Address': s.address,
        'Currency': s.currency,
        'Payable Balance': stats.payable,
        'Due Amount': stats.due,
        'Ordered Qty': stats.ordered,
        'Delivered Qty': stats.delivered
      };
    });
    exportToExcel(data, `Suppliers_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Building2 size={22} className="text-purple-400" />
            Supplier &amp; Vendor Management
          </h1>
          <p className="text-xs text-zinc-400">
            Manage local &amp; overseas vendors, payable balance, due tracking, ordered and delivered quantities.
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
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards: Payable Balance, Due, Ordered Qty, Delivered Qty */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Payable Balance</span>
          <span className="text-lg font-mono font-black text-amber-400">
            {formatCurrency(totalPayableAll)}
          </span>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Payable to vendors</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Due Amount</span>
          <span className="text-lg font-mono font-black text-red-400">
            {formatCurrency(totalDueAll)}
          </span>
          <span className="text-[10px] text-red-500/80 block mt-0.5">Unsettled purchase dues</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Ordered Qty</span>
          <span className="text-lg font-mono font-black text-blue-400">
            {totalOrderedQtyAll.toLocaleString()} Pcs
          </span>
          <span className="text-[10px] text-blue-500/80 block mt-0.5">Total PO units ordered</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Delivered Qty</span>
          <span className="text-lg font-mono font-black text-purple-400">
            {totalDeliveredQtyAll.toLocaleString()} Pcs
          </span>
          <span className="text-[10px] text-purple-500/80 block mt-0.5">Total units received</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search Supplier, Company, Country, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => {
          const stats = getSupplierStats(sup);
          return (
            <div
              key={sup.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm">{sup.supplierName}</h3>
                    <p className="text-xs text-purple-400 font-semibold">{sup.companyName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sup.supplierType === 'International'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {sup.supplierType}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-400">
                  <p className="flex items-center gap-1.5">
                    <Globe size={13} className="text-zinc-500 shrink-0" />
                    <span className="text-zinc-300 font-semibold">{sup.country}</span>
                    {sup.city && <span className="text-zinc-500">({sup.city})</span>}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-zinc-500 shrink-0" />
                    <span className="font-mono text-zinc-300">{sup.phone}</span>
                  </p>
                  {sup.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail size={13} className="text-zinc-500 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="truncate">{sup.address}</span>
                  </p>
                </div>
              </div>

              {/* Explicit Supplier Metrics: Payable Balance, Due, Ordered Qty, Delivered Qty */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-zinc-950/60 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Payable</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {formatCurrency(stats.payable, sup.currency)}
                    </span>
                  </div>
                  <div className="border-l sm:border-x border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Due</span>
                    <span className="font-mono font-bold text-red-400 text-xs">
                      {formatCurrency(stats.due, sup.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Ordered Qty</span>
                    <span className="font-mono font-bold text-purple-400 text-xs">
                      {stats.ordered.toLocaleString()} Pcs
                    </span>
                  </div>
                  <div className="border-l border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block uppercase font-medium">Delivered Qty</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {stats.delivered.toLocaleString()} Pcs
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-500 text-[11px]">
                    Currency: <strong className="text-zinc-300">{sup.currency || 'BDT'}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sup)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(sup)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Building2 size={18} className="text-purple-400" />
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Supplier / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Supplier Type</label>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Local">Local (Domestic Bangladesh)</option>
                    <option value="International">International (Import Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">Address / Port Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">BIN / VAT No</label>
                  <input
                    type="text"
                    value={binNumber}
                    onChange={(e) => setBinNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">TIN / Tax No</label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CNY">CNY (¥)</option>
                  </select>
                </div>

                {/* Explicit Balance, Due, Ordered Qty & Delivered Qty Fields */}
                <div>
                  <label className="block text-amber-400 font-bold mb-1">Payable Balance (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={payableBalance === 0 ? '' : payableBalance}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => setPayableBalance(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-amber-600/60 rounded px-3 py-1.5 text-amber-400 font-mono font-bold placeholder:text-amber-500/40 focus:placeholder-transparent"
                  />
                </div>

                <div>
                  <label className="block text-red-400 font-bold mb-1">Due Amount (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={dueAmount === 0 ? '' : dueAmount}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => setDueAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-red-600/60 rounded px-3 py-1.5 text-red-400 font-mono font-bold placeholder:text-red-500/40 focus:placeholder-transparent"
                  />
                </div>

                <div>
                  <label className="block text-purple-400 font-bold mb-1">Ordered Qty (Units)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={orderedQty === 0 ? '' : orderedQty}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => setOrderedQty(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-purple-600/60 rounded px-3 py-1.5 text-purple-400 font-mono font-bold placeholder:text-purple-500/40 focus:placeholder-transparent"
                  />
                </div>

                <div>
                  <label className="block text-emerald-400 font-bold mb-1">Delivered Qty (Units)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={deliveredQty === 0 ? '' : deliveredQty}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => setDeliveredQty(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-emerald-600/60 rounded px-3 py-1.5 text-emerald-400 font-mono font-bold placeholder:text-emerald-500/40 focus:placeholder-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded cursor-pointer transition-colors"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!supplierToDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${supplierToDelete?.supplierName}"?`}
        confirmText="Delete Supplier"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (supplierToDelete) {
            deleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
          }
        }}
        onCancel={() => setSupplierToDelete(null)}
      />
    </div>
  );
};
