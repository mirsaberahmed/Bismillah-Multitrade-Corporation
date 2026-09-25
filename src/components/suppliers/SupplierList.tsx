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
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Supplier } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';

export const SupplierList: React.FC = () => {
  const { suppliers, saveSupplier, deleteSupplier } = useData();

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
  const [currentBalance, setCurrentBalance] = useState(0);

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
    setCurrentBalance(0);
    setShowModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierName(sup.supplierName);
    setCompanyName(sup.companyName);
    setSupplierType((sup.supplierType as 'International' | 'Local') || (sup.country === 'Bangladesh' ? 'Local' : 'International'));
    setContactPerson(sup.contactPerson || '');
    setPhone(sup.phone);
    setEmail(sup.email);
    setAddress(sup.address);
    setCountry(sup.country);
    setCity(sup.city);
    setBinNumber(sup.binNumber || '');
    setTinNumber(sup.tinNumber || '');
    setCurrency(sup.currency);
    setCurrentBalance(sup.currentBalance || sup.currentPayable || 0);
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
      supplierName,
      companyName: companyName || supplierName,
      supplierType,
      contactPerson,
      phone,
      email,
      address,
      country,
      city,
      postalCode: editingSupplier?.postalCode || '1000',
      binNumber,
      tinNumber,
      currency,
      openingBalance: editingSupplier?.openingBalance || 0,
      currentPayable: currentBalance,
      currentBalance,
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

  const handleExportExcel = () => {
    const data = filteredSuppliers.map(s => ({
      'Supplier Name': s.supplierName,
      'Company Name': s.companyName,
      'Type': s.supplierType,
      'Country': s.country,
      'Phone': s.phone,
      'Email': s.email,
      'Address': s.address,
      'Currency': s.currency,
      'Payable Balance': s.currentBalance
    }));
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
            Manage local and overseas import vendors, LC payables, and foreign exchange currencies.
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
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => (
          <div
            key={sup.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
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
                  <Globe size={13} className="text-zinc-500" />
                  <span className="text-zinc-300 font-semibold">{sup.country}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone size={13} className="text-zinc-500" />
                  <span className="font-mono text-zinc-300">{sup.phone}</span>
                </p>
                {sup.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail size={13} className="text-zinc-500" />
                    <span className="truncate">{sup.email}</span>
                  </p>
                )}
                <p className="flex items-start gap-1.5">
                  <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                  <span className="truncate">{sup.address}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 text-[11px] block">Payable Balance:</span>
                <span className="font-mono font-bold text-sm text-zinc-200">
                  {formatCurrency(sup.currentBalance || sup.currentPayable || 0, sup.currency)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(sup)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                  title="Edit Supplier"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setSupplierToDelete(sup)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded"
                  title="Delete Supplier"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Building2 size={18} className="text-purple-400" />
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
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
                  <label className="block text-zinc-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                  <label className="block text-zinc-400 mb-1">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CNY">CNY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Payable Balance</label>
                  <input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded"
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
