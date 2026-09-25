import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  DollarSign,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Customer, CustomerType } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';

interface Props {
  onSelectCustomerInvoices?: (customerId: string) => void;
}

export const CustomerList: React.FC<Props> = () => {
  const { customers, saveCustomer, deleteCustomer, invoices } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Corporate');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [binNumber, setBinNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(500000);
  const [paymentTerms, setPaymentTerms] = useState('15 Days Credit');

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomerName('');
    setCompanyName('');
    setCustomerType('Corporate');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setBillingAddress('');
    setShippingAddress('');
    setCity('Dhaka');
    setDistrict('Dhaka');
    setBinNumber('');
    setTinNumber('');
    setOpeningBalance(0);
    setCreditLimit(500000);
    setPaymentTerms('15 Days Credit');
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerName(cust.customerName);
    setCompanyName(cust.companyName);
    setCustomerType(cust.customerType);
    setContactPerson(cust.contactPerson || '');
    setPhone(cust.phone);
    setEmail(cust.email);
    setBillingAddress(cust.billingAddress);
    setShippingAddress(cust.shippingAddress || '');
    setCity(cust.city);
    setDistrict(cust.district);
    setBinNumber(cust.binNumber || '');
    setTinNumber(cust.tinNumber || '');
    setOpeningBalance(cust.openingBalance);
    setCreditLimit(cust.creditLimit);
    setPaymentTerms(cust.paymentTerms);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Customer Name and Phone are required.');
      return;
    }

    const newCustomer: Customer = {
      id: editingCustomer?.id || 'cust-' + Date.now(),
      customerId: editingCustomer?.customerId || ('CUST-' + Date.now().toString().slice(-4)),
      customerName,
      companyName: companyName || customerName,
      customerType,
      contactPerson,
      phone,
      email,
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      city,
      district,
      country: 'Bangladesh',
      postalCode: editingCustomer?.postalCode || '1216',
      binNumber,
      tinNumber,
      openingBalance,
      currentBalance: editingCustomer ? editingCustomer.currentBalance : openingBalance,
      creditLimit,
      paymentTerms,
      createdAt: editingCustomer?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveCustomer(newCustomer);
    setShowModal(false);
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.customerName.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.binNumber && c.binNumber.includes(q))
    );
  });

  const handleExportExcel = () => {
    const data = filteredCustomers.map(c => ({
      'Customer Name': c.customerName,
      'Company Name': c.companyName,
      'Type': c.customerType,
      'Contact Person': c.contactPerson,
      'Phone': c.phone,
      'Email': c.email,
      'Address': c.billingAddress,
      'BIN': c.binNumber,
      'TIN': c.tinNumber,
      'Credit Limit': c.creditLimit,
      'Current Outstanding Due': c.currentBalance
    }));
    exportToExcel(data, `Customer_Directory_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Users size={22} className="text-amber-500" />
            Customer Management &amp; Accounts
          </h1>
          <p className="text-xs text-zinc-400">
            Maintain customer profiles, credit limits, outstanding balances, and BIN/TIN information.
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
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search Customer by Name, Company, Phone, Email, BIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(cust => {
          const custInvoices = invoices.filter(i => i.customerId === cust.id);
          return (
            <div
              key={cust.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm">{cust.customerName}</h3>
                    {cust.companyName && (
                      <p className="text-xs text-amber-400 font-semibold">{cust.companyName}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                    {cust.customerType}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-400">
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-zinc-500" />
                    <span className="font-mono text-zinc-300">{cust.phone}</span>
                  </p>
                  {cust.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail size={13} className="text-zinc-500" />
                      <span className="truncate">{cust.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="truncate">{cust.billingAddress}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Current Balance Due:</span>
                  <span className={`font-mono font-bold text-sm ${cust.currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(cust.currentBalance)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cust)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                    title="Edit Customer"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setCustomerToDelete(cust)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded"
                    title="Delete Customer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Customer / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Customer Category</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Corporate">Corporate / Industry</option>
                    <option value="Wholesale">Wholesale Trader</option>
                    <option value="Retail">Retail</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">BIN Number</label>
                  <input
                    type="text"
                    value={binNumber}
                    onChange={(e) => setBinNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">TIN Number</label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Credit Limit (BDT)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.customerName}"?`}
        confirmText="Delete Customer"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
