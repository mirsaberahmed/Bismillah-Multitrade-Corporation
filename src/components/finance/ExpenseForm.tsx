import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  FileText,
  User,
  DollarSign,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ExpenseRecord, ExpenseItem, PaymentMethod, ExpenseCategory } from '../../types';
import { getTodayDateString, numberToWordsBDT, formatCurrency } from '../../utils/formatters';

interface Props {
  expenseId?: string; // If editing
  onCancel: () => void;
  onSuccess: (savedExpenseId: string) => void;
}

const PRESET_EXPENSE_CATEGORIES = [
  'General Expense',
  'Rent & Office Premises',
  'Staff Salaries & Wages',
  'Electricity & Utilities',
  'C&F & Customs Port Demurrage',
  'Transportation & Fuel',
  'Trade License & Government Fees',
  'Entertainment & Tea',
  'Office Supplies & Stationery',
  'Maintenance & Repairs',
  'Marketing & Advertising',
  'Bank Charges & Commission',
  'Raw Materials & Packaging',
  'Printing & Publishing',
  'Other / Custom Category'
];

export const ExpenseForm: React.FC<Props> = ({ expenseId, onCancel, onSuccess }) => {
  const {
    expenses,
    suppliers,
    saveExpense,
    getNextNumber
  } = useData();

  const isEditing = Boolean(expenseId);
  const existingExpense = expenses.find(e => e.id === expenseId);

  // Form State
  const [voucherNumber, setVoucherNumber] = useState(
    existingExpense?.voucherNumber || existingExpense?.expenseNumber || getNextNumber('expense')
  );
  const [expenseDate, setExpenseDate] = useState(
    existingExpense?.expenseDate || existingExpense?.date || getTodayDateString()
  );
  const [paidTo, setPaidTo] = useState(existingExpense?.paidTo || '');
  const [category, setCategory] = useState<string>(existingExpense?.category || 'General Expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (existingExpense?.paymentMethod as PaymentMethod) || 'Cash'
  );
  const [referenceNumber, setReferenceNumber] = useState(existingExpense?.referenceNumber || '');
  const [preparedBy, setPreparedBy] = useState(existingExpense?.preparedBy || 'Accounts Officer');
  const [approvedBy, setApprovedBy] = useState(existingExpense?.approvedBy || 'Managing Director');
  const [notes, setNotes] = useState(existingExpense?.notes || existingExpense?.description || '');
  const [currency, setCurrency] = useState(existingExpense?.currency || 'BDT');

  // Items State (Itemized breakdown like Invoice)
  const [items, setItems] = useState<ExpenseItem[]>(() => {
    if (existingExpense && existingExpense.items && existingExpense.items.length > 0) {
      return existingExpense.items;
    }
    if (existingExpense) {
      return [
        {
          id: 'item-1',
          particulars: existingExpense.notes || existingExpense.description || `${existingExpense.category} Expense`,
          category: existingExpense.category,
          quantity: 1,
          unit: 'Lot',
          unitPrice: existingExpense.amount,
          amount: existingExpense.amount
        }
      ];
    }
    return [
      {
        id: 'item-' + Date.now(),
        particulars: '',
        category: 'General Expense',
        quantity: 1,
        unit: 'Lot',
        unitPrice: 0,
        amount: 0
      }
    ];
  });

  const [formError, setFormError] = useState('');

  // Handle item change
  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      item.amount = Math.round(qty * price * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        particulars: '',
        category: category || 'General Expense',
        quantity: 1,
        unit: 'Lot',
        unitPrice: 0,
        amount: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setFormError('An expense sheet must have at least one line item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalInWords = numberToWordsBDT(calculatedTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!paidTo.trim()) {
      setFormError('Please specify who this expense was paid to (Payee / Beneficiary).');
      return;
    }

    if (calculatedTotal <= 0) {
      setFormError('Total expense amount must be greater than 0.');
      return;
    }

    const payload: ExpenseRecord = {
      id: existingExpense?.id || ('exp-' + Date.now()),
      expenseNumber: voucherNumber.trim(),
      voucherNumber: voucherNumber.trim(),
      date: expenseDate,
      expenseDate: expenseDate,
      category: (category.trim() as ExpenseCategory) || 'General Expense',
      description: notes.trim(),
      notes: notes.trim(),
      paidTo: paidTo.trim(),
      amount: calculatedTotal,
      currency: currency || 'BDT',
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      preparedBy: preparedBy.trim() || 'Accounts Officer',
      approvedBy: approvedBy.trim() || 'Managing Director',
      items: items.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        particulars: it.particulars.trim() || `Item ${idx + 1}`,
        category: it.category || category,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'Lot',
        unitPrice: Number(it.unitPrice) || 0,
        amount: Number(it.amount) || 0
      })),
      createdAt: existingExpense?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveExpense(payload);
    onSuccess(payload.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Header Bar matching InvoiceForm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Cancel"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              <Receipt size={22} className="text-red-400" />
              <span>{isEditing ? `Edit Expense Sheet: ${voucherNumber}` : 'Create New Expense Sheet'}</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Bismillah Multitrade Corporation • Official Debit Voucher &amp; Expense Sheet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>{isEditing ? 'Update Expense Sheet' : 'Save Expense Sheet'}</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Meta Grid - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs">
        <div>
          <label className="block text-zinc-400 font-medium mb-1">Voucher Number *</label>
          <input
            type="text"
            required
            value={voucherNumber}
            onChange={(e) => setVoucherNumber(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 font-mono font-bold text-red-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Expense Date *</label>
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Expense Category / Head *</label>
          <input
            type="text"
            list="expense-categories-list"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Select or enter category..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500"
          />
          <datalist id="expense-categories-list">
            {PRESET_EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-zinc-400 font-medium mb-1">Payment Method *</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500"
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="bKash">bKash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payee & Authority Grid - 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs">
        <div>
          <label className="block text-zinc-400 font-medium mb-1">
            Paid To / Beneficiary *
          </label>
          <input
            type="text"
            list="payee-suggestions"
            required
            placeholder="Person / Company / Vendor name"
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500 font-semibold"
          />
          <datalist id="payee-suggestions">
            {suppliers.map(s => (
              <option key={s.id} value={s.supplierName} />
            ))}
          </datalist>
          <p className="text-[10px] text-zinc-500 mt-1">
            Select a registered vendor or type any individual or office expense payee name.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Ref / Cheque / Txn No</label>
            <input
              type="text"
              placeholder="e.g. CHQ-9912 / TrxID"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-zinc-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Approved By</label>
            <input
              type="text"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Interactive Itemized Table (Matching InvoiceForm line items) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <FileText size={16} className="text-red-400" />
              <span>Expense Particulars &amp; Itemized Breakdown</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Add individual line items, quantities, and rates just like an invoice.
            </p>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Particulars / Expense Details *</th>
                <th className="p-3 w-40">Category</th>
                <th className="p-3 w-28 text-right">Quantity</th>
                <th className="p-3 w-24">Unit</th>
                <th className="p-3 w-36 text-right">Unit Price (BDT)</th>
                <th className="p-3 w-36 text-right">Amount (BDT)</th>
                <th className="p-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-zinc-800/30">
                  <td className="p-3 text-center text-zinc-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Office Stationery / Warehouse Pallet Loading"
                      value={item.particulars}
                      onChange={(e) => handleItemChange(index, 'particulars', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.category || category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-24 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-right font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.unit || 'Lot'}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-center text-zinc-300 focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice === 0 ? '' : item.unitPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-32 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-right font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-red-400">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Area - Remarks on Left, Totals on Right (Exact Invoice Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
        {/* Left: Remarks & Words */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Remarks / Purpose &amp; Justification
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific approval details, voucher notes, or commercial context..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-200 text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Amount in Words:
            </span>
            <p className="font-semibold text-zinc-200 italic">
              {totalInWords} TAKA ONLY
            </p>
          </div>
        </div>

        {/* Right: Calculations */}
        <div className="lg:col-span-5 bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs">
          <div className="flex justify-between items-center text-zinc-300 pb-2 border-b border-zinc-800">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-zinc-100">{formatCurrency(calculatedTotal)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-black text-sm text-zinc-100">
            <span>GRAND TOTAL:</span>
            <span className="text-red-400 font-mono text-base">{formatCurrency(calculatedTotal)}</span>
          </div>

          <div className="flex justify-between items-center text-zinc-400 text-[11px] pt-1">
            <span>Payment Settlement:</span>
            <span className="font-bold text-emerald-400 uppercase">Paid in Full</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Save size={16} />
          <span>{isEditing ? 'Update Expense Sheet' : 'Save & Record Expense Sheet'}</span>
        </button>
      </div>
    </form>
  );
};
