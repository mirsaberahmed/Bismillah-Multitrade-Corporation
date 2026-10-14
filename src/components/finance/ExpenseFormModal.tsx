import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  FileText,
  User,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ExpenseRecord, ExpenseItem, PaymentMethod } from '../../types';
import { getTodayDateString, numberToWordsBDT, formatCurrency } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseRecord) => void;
  editingExpense: ExpenseRecord | null;
  getNextNumber: (type: any) => string;
}

export const PRESET_EXPENSE_CATEGORIES = [
  'Factory Raw Materials & Packaging',
  'Packaging Cartons & Printing',
  'Factory Utilities & Electricity (DESCO)',
  'Office Rent & Warehouse Rent',
  'Staff Salaries & Factory Wages',
  'Transportation, Freight & Courier',
  'Import Clearing & C&F Agent Commission',
  'Port Duty, Customs & Port Charges',
  'Machinery Maintenance & Repairs',
  'Office Supplies & Stationery',
  'Marketing, Trade Promotion & Samples',
  'Legal, Audit & Professional Fees',
  'Tea, Entertainment & Refreshments',
  'Bank Charges & Commission',
  'Other / Custom Category'
];

export const ExpenseFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  getNextNumber
}) => {
  const isEditing = Boolean(editingExpense);

  const [voucherNumber, setVoucherNumber] = useState('');
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [paidTo, setPaidTo] = useState('');
  const [category, setCategory] = useState('Packaging Cartons & Printing');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [preparedBy, setPreparedBy] = useState('Accounts Officer');
  const [approvedBy, setApprovedBy] = useState('Managing Director');
  const [notes, setNotes] = useState('');

  // Itemized line items (just like invoice items)
  const [items, setItems] = useState<ExpenseItem[]>([
    {
      id: 'item-1',
      particulars: '',
      category: 'Packaging Cartons & Printing',
      quantity: 1,
      unit: 'Lot',
      unitPrice: 0,
      amount: 0
    }
  ]);

  useEffect(() => {
    if (editingExpense) {
      setVoucherNumber(editingExpense.voucherNumber || editingExpense.expenseNumber || '');
      setExpenseDate(editingExpense.expenseDate || editingExpense.date || getTodayDateString());
      setPaidTo(editingExpense.paidTo || '');
      setCategory(editingExpense.category || 'General Expense');
      setPaymentMethod(editingExpense.paymentMethod || 'Cash');
      setReferenceNumber(editingExpense.referenceNumber || '');
      setPreparedBy(editingExpense.preparedBy || 'Accounts Officer');
      setApprovedBy(editingExpense.approvedBy || 'Managing Director');
      setNotes(editingExpense.notes || '');

      if (editingExpense.items && editingExpense.items.length > 0) {
        setItems(editingExpense.items);
      } else {
        setItems([
          {
            id: 'item-1',
            particulars: editingExpense.notes || editingExpense.description || `${editingExpense.category} Expense`,
            category: editingExpense.category,
            quantity: 1,
            unit: 'Lot',
            unitPrice: editingExpense.amount,
            amount: editingExpense.amount
          }
        ]);
      }
    } else {
      const generated = getNextNumber('expense') || `EXPNS-2026-${Date.now().toString().slice(-4)}`;
      setVoucherNumber(generated);
      setExpenseDate(getTodayDateString());
      setPaidTo('');
      setCategory('Factory Raw Materials & Packaging');
      setPaymentMethod('Cash');
      setReferenceNumber('');
      setPreparedBy('Accounts Officer');
      setApprovedBy('Managing Director');
      setNotes('');
      setItems([
        {
          id: 'item-' + Date.now(),
          particulars: '',
          category: 'Factory Raw Materials & Packaging',
          quantity: 1,
          unit: 'Pcs',
          unitPrice: 0,
          amount: 0
        }
      ]);
    }
  }, [editingExpense, isOpen, getNextNumber]);

  if (!isOpen) return null;

  // Item handlers
  const handleAddItem = () => {
    const newItem: ExpenseItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      particulars: '',
      category: category,
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('An expense sheet must have at least one line item.');
      return;
    }
    setItems(items.filter(it => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ExpenseItem, val: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : it.quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : it.unitPrice;
        updated.amount = Math.round(q * p * 100) / 100;
      }
      return updated;
    }));
  };

  // Calculations
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const totalInWords = numberToWordsBDT(totalAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paidTo.trim()) {
      alert('Please enter Paid To / Beneficiary name.');
      return;
    }

    if (totalAmount <= 0) {
      alert('Total expense amount must be greater than 0.');
      return;
    }

    // Ensure all items have a description
    const hasEmptyItem = items.some(it => !it.particulars.trim());
    if (hasEmptyItem) {
      alert('Please provide a description / particulars for all expense line items.');
      return;
    }

    const payload: ExpenseRecord = {
      id: editingExpense?.id || ('exp-' + Date.now()),
      expenseNumber: voucherNumber.trim() || `EXPNS-2026-${Date.now().toString().slice(-4)}`,
      voucherNumber: voucherNumber.trim() || `EXPNS-2026-${Date.now().toString().slice(-4)}`,
      date: expenseDate,
      expenseDate: expenseDate,
      category: category.trim() || 'General Expense',
      description: items[0]?.particulars || category,
      paidTo: paidTo.trim(),
      amount: totalAmount,
      subtotal: totalAmount,
      currency: 'BDT',
      paymentMethod,
      reference: referenceNumber.trim(),
      referenceNumber: referenceNumber.trim(),
      approvedBy: approvedBy.trim(),
      preparedBy: preparedBy.trim(),
      notes: notes.trim(),
      items: items.map(it => ({
        ...it,
        amount: Number(it.amount) || (it.quantity * it.unitPrice)
      })),
      createdAt: editingExpense?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{isEditing ? 'Edit Expense Sheet / Debit Voucher' : 'Create New Expense Sheet'}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-red-400 font-bold border border-zinc-700">
                  {voucherNumber}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Create and itemize business expenses just like an invoice with automatic PDF generation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* Top Form Fields: Voucher No, Date, Payee, Category */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Voucher / Expense No *
              </label>
              <input
                type="text"
                required
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-400" />
                <span>Expense Date *</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
                <User size={13} className="text-zinc-400" />
                <span>Paid To / Payee / Beneficiary *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Masum, Sujon, DESCO, Landlord, Transport Agency"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-bold focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Expense Category / Head *
              </label>
              <select
                value={PRESET_EXPENSE_CATEGORIES.includes(category) ? category : 'Other / Custom Category'}
                onChange={(e) => {
                  if (e.target.value !== 'Other / Custom Category') {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500"
              >
                {PRESET_EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Custom Head / Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type custom category..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1 flex items-center gap-1.5">
                <CreditCard size={13} className="text-zinc-400" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="bKash">bKash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Reference / Bill / Voucher No
              </label>
              <input
                type="text"
                placeholder="e.g. Bill # 98120"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* ITEMIZATION SECTION (Exactly like Invoice Items Table) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <DollarSign size={16} className="text-red-400" />
                  <span>Expense Items &amp; Particulars (Invoice-style Breakdown)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Itemize multiple expenses, quantities, unit prices, and amounts just like an invoice.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Add Item Row</span>
              </button>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Particulars / Description *</th>
                    <th className="p-3 w-36">Category / Head</th>
                    <th className="p-3 w-20 text-center">Qty</th>
                    <th className="p-3 w-24">Unit</th>
                    <th className="p-3 w-28 text-right">Rate (BDT)</th>
                    <th className="p-3 w-32 text-right">Amount (BDT)</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-900/40">
                      <td className="p-2.5 text-center font-mono text-zinc-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Office Rent October / Packaging Material / Courier Charge"
                          value={item.particulars}
                          onChange={(e) => handleItemChange(item.id, 'particulars', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder={category}
                          value={item.category || ''}
                          onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1.5 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          required
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1.5 text-zinc-100 text-center font-mono focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.unit || 'Pcs'}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-red-500"
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Lot">Lot</option>
                          <option value="Month">Month</option>
                          <option value="Carton">Carton</option>
                          <option value="Trip">Trip</option>
                          <option value="Kg">Kg</option>
                          <option value="Liter">Liter</option>
                          <option value="Pack">Pack</option>
                          <option value="Service">Service</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="0"
                          value={item.unitPrice === 0 ? '' : item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1.5 text-right font-mono text-zinc-100 focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-red-400">
                        {formatCurrency(item.amount, '')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Remove Item"
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

          {/* Financial Calculation & Amount in Words Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7 space-y-3">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  General Remarks / Office Particulars
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes, payment particulars, or transaction description..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Amount in Words:
                </span>
                <p className="text-zinc-300 italic font-medium leading-relaxed">
                  {totalInWords}
                </p>
              </div>
            </div>

            <div className="md:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800">
                <span>Total Items:</span>
                <span className="font-mono font-bold text-zinc-200">{items.length} items</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-zinc-200">{formatCurrency(totalAmount, 'BDT')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-base">
                <span className="font-black text-zinc-100 uppercase tracking-tight">Grand Total:</span>
                <span className="font-mono font-black text-xl text-red-400">
                  {formatCurrency(totalAmount, 'BDT')}
                </span>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block text-zinc-500 mb-0.5">Prepared By</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-0.5">Approved By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>{isEditing ? 'Update Expense Sheet' : 'Save & Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
