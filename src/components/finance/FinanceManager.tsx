import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Calendar,
  Search,
  Filter,
  Trash2,
  Receipt,
  Edit,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PaymentRecord, ExpenseRecord } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { PrintableMoneyReceipt } from '../documents/PrintableMoneyReceipt';
import { PrintableExpenseVoucher } from '../documents/PrintableExpenseVoucher';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';

interface FinanceManagerProps {
  initialTab?: 'collections' | 'expenses';
  defaultTab?: 'collections' | 'expenses';
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  initialTab,
  defaultTab
}) => {
  const {
    payments,
    expenses,
    settings,
    recordPayment,
    saveExpense,
    deleteExpense,
    customers,
    suppliers,
    getNextNumber
  } = useData();

  const [activeTab, setActiveTab] = useState<'collections' | 'expenses'>(
    defaultTab || initialTab || 'collections'
  );

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
    else if (initialTab) setActiveTab(initialTab);
  }, [defaultTab, initialTab]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [printingPayment, setPrintingPayment] = useState<PaymentRecord | null>(null);
  const [printingExpense, setPrintingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

const PRESET_EXPENSE_CATEGORIES = [
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
  'Other / Custom Category'
];

  // Filters for expenses
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash' | 'Cheque'>('Bank Transfer');
  const [paidTo, setPaidTo] = useState('');
  const [expenseRef, setExpenseRef] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const totalCollections = payments.filter(p => p.type === 'Customer Collection').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netCashflow = totalCollections - totalExpenses;

  const todayStr = getTodayDateString();
  const currentMonth = todayStr.substring(0, 7);
  const thisMonthExpenses = expenses
    .filter(e => (e.expenseDate || e.date || '').startsWith(currentMonth))
    .reduce((s, e) => s + e.amount, 0);
  const todayExpenses = expenses
    .filter(e => (e.expenseDate || e.date) === todayStr)
    .reduce((s, e) => s + e.amount, 0);

  const handlePrintReceipt = (p: PaymentRecord) => {
    setPrintingExpense(null);
    setPrintingPayment(p);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintExpenseVoucher = (e: ExpenseRecord) => {
    setPrintingPayment(null);
    setPrintingExpense(e);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseCategory('');
    setExpenseAmount(0);
    setExpenseDate(getTodayDateString());
    setPaymentMethod('Cash');
    setPaidTo('');
    setExpenseRef('');
    setExpenseNotes('');
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (e: ExpenseRecord) => {
    setEditingExpense(e);
    setExpenseCategory(e.category || '');
    setExpenseAmount(e.amount || 0);
    setExpenseDate(e.expenseDate || e.date || getTodayDateString());
    setPaymentMethod(e.paymentMethod as any || 'Cash');
    setPaidTo(e.paidTo || '');
    setExpenseRef(e.referenceNumber || '');
    setExpenseNotes(e.notes || '');
    setShowExpenseModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('Expense amount must be greater than 0.');
      return;
    }

    const finalCategory = expenseCategory.trim() || 'General Expense';

    if (editingExpense) {
      const updatedExp: ExpenseRecord = {
        ...editingExpense,
        date: expenseDate,
        expenseDate,
        category: finalCategory,
        amount: expenseAmount,
        paymentMethod,
        paidTo: paidTo.trim() || 'General Expense',
        referenceNumber: expenseRef.trim(),
        notes: expenseNotes.trim(),
        updatedAt: getTodayDateString()
      };
      saveExpense(updatedExp);
    } else {
      const generatedVoucher = getNextNumber('expense') || ('EXP-' + Date.now().toString().slice(-6));
      const newExp: ExpenseRecord = {
        id: 'exp-' + Date.now(),
        expenseNumber: generatedVoucher,
        voucherNumber: generatedVoucher,
        date: expenseDate,
        expenseDate,
        category: finalCategory,
        amount: expenseAmount,
        currency: 'BDT',
        paymentMethod,
        paidTo: paidTo.trim() || 'General Expense',
        referenceNumber: expenseRef.trim(),
        notes: expenseNotes.trim(),
        approvedBy: 'Managing Director',
        createdAt: getTodayDateString()
      };
      saveExpense(newExp);
    }
    setShowExpenseModal(false);
  };

  const handleExportPayments = () => {
    const data = payments.map(p => ({
      'Receipt No': p.receiptNumber,
      'Date': p.paymentDate || p.date,
      'Type': p.type,
      'Entity': p.entityName,
      'Invoice No': p.invoiceNumber || '',
      'Amount': p.amount,
      'Method': p.paymentMethod,
      'Reference': p.transactionReference || '',
      'Collected By': p.collectedBy || p.receivedBy || ''
    }));
    exportToExcel(data, `Money_Receipts_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportExpenses = () => {
    const data = filteredExpenses.map(e => ({
      'Voucher No': e.voucherNumber || e.expenseNumber,
      'Date': e.expenseDate || e.date,
      'Category': e.category,
      'Paid To': e.paidTo,
      'Amount (BDT)': e.amount,
      'Payment Method': e.paymentMethod,
      'Reference': e.referenceNumber || '',
      'Particulars': e.notes || ''
    }));
    exportToExcel(data, `Operating_Expenses_${new Date().toISOString().slice(0, 10)}`);
  };

  const filteredExpenses = expenses.filter(e => {
    const q = expenseSearchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (e.voucherNumber && e.voucherNumber.toLowerCase().includes(q)) ||
      (e.expenseNumber && e.expenseNumber.toLowerCase().includes(q)) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q));

    const matchCategory =
      expenseCategoryFilter === 'All' || e.category === expenseCategoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Hidden Print Container */}
      <div className="hidden print:block">
        {printingPayment && (
          <PrintableMoneyReceipt payment={printingPayment} settings={settings} />
        )}
        {printingExpense && (
          <PrintableExpenseVoucher expense={printingExpense} settings={settings} />
        )}
      </div>

      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Receipt size={22} className="text-red-400" />
            {activeTab === 'expenses' ? 'Operating Expense Management' : 'Financial Accounts & Collections'}
          </h1>
          <p className="text-xs text-zinc-400">
            {activeTab === 'expenses'
              ? 'Record operational overheads, print debit vouchers, categorize expenditures, and track live business costs.'
              : `Bank: ${settings.bankName || 'General Bank'} • A/C: ${settings.accountNumber || 'Primary'} • Track collections & cashflow.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'collections' ? (
            <button
              onClick={handleExportPayments}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export Receipts</span>
            </button>
          ) : (
            <button
              onClick={handleExportExpenses}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export Expenses</span>
            </button>
          )}

          {activeTab === 'expenses' && (
            <button
              onClick={openAddExpenseModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Health Summary Strips */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Customer Collections</span>
          <span className="text-lg font-mono font-black text-emerald-400">
            {formatCurrency(totalCollections)}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-0.5">Inflow from invoices</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Operating Expenses</span>
          <span className="text-lg font-mono font-black text-red-400">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-[10px] text-red-500/80 block mt-0.5">{expenses.length} Total vouchers</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">This Month Expenses</span>
          <span className="text-lg font-mono font-black text-amber-400">
            {formatCurrency(thisMonthExpenses)}
          </span>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Month-to-date expenses</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Net Treasury Cashflow</span>
          <span className={`text-lg font-mono font-black ${netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netCashflow)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Collections minus expenses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="print:hidden flex border-b border-zinc-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 px-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'expenses'
              ? 'text-red-400 border-b-2 border-red-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt size={16} />
          <span>Operating Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-2.5 px-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'collections'
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CreditCard size={16} />
          <span>Money Receipts &amp; Collections ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Method &amp; Ref</th>
                  <th className="p-3 text-right">Amount Received</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      No money receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{p.receiptNumber}</td>
                      <td className="p-3 text-zinc-300">{formatDate(p.paymentDate || p.date)}</td>
                      <td className="p-3 font-bold text-zinc-200">{p.entityName}</td>
                      <td className="p-3 font-mono text-zinc-400">{p.invoiceNumber || '-'}</td>
                      <td className="p-3 text-zinc-300">
                        <span className="font-semibold text-zinc-200">{p.paymentMethod}</span>
                        {p.transactionReference && (
                          <span className="block font-mono text-[10px] text-zinc-500">{p.transactionReference}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-400 rounded cursor-pointer transition-colors"
                          title="Print Money Receipt"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES (FULL MANAGEMENT) */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {/* Search and Category Filter Bar */}
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search voucher, category, payee, particulars..."
                value={expenseSearchQuery}
                onChange={(e) => setExpenseSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs shrink-0 flex items-center gap-1">
                <Filter size={13} />
                Category:
              </span>
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
              >
                <option value="All">All Categories</option>
                {Array.from(new Set([
                  ...PRESET_EXPENSE_CATEGORIES.filter(c => c !== 'Other / Custom Category'),
                  ...expenses.map(e => e.category).filter(Boolean)
                ])).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="p-3">Voucher No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Paid To</th>
                    <th className="p-3">Method &amp; Ref</th>
                    <th className="p-3 text-right">Amount (BDT)</th>
                    <th className="p-3">Remarks / Particulars</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No expenses found. Click <strong>Add Expense</strong> to record a new business expense.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-red-400">
                          {e.voucherNumber || e.expenseNumber}
                        </td>
                        <td className="p-3 text-zinc-300">{formatDate(e.expenseDate || e.date)}</td>
                        <td className="p-3 font-semibold text-zinc-200">{e.category}</td>
                        <td className="p-3 text-zinc-300">{e.paidTo}</td>
                        <td className="p-3 text-zinc-400">
                          <span className="font-semibold text-zinc-300">{e.paymentMethod}</span>
                          {e.referenceNumber && (
                            <span className="block font-mono text-[10px] text-zinc-500">{e.referenceNumber}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-red-400 text-sm">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="p-3 text-zinc-500 text-[11px] italic max-w-xs truncate">
                          {e.notes || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditExpenseModal(e)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 rounded cursor-pointer transition-colors"
                              title="Edit Expense Voucher"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handlePrintExpenseVoucher(e)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-red-400 rounded cursor-pointer transition-colors"
                              title="Print Debit Voucher"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(e)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 size={14} />
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
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <ArrowUpRight size={18} className="text-red-400" />
                {editingExpense ? `Edit Expense Voucher (${editingExpense.voucherNumber || editingExpense.expenseNumber})` : 'Record Business Expense Voucher'}
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-semibold">Expense Category *</label>
                  {/* Dropdown Selection Box */}
                  <select
                    value={PRESET_EXPENSE_CATEGORIES.includes(expenseCategory) ? expenseCategory : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setExpenseCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-red-500 mb-1"
                  >
                    <option value="">-- Select from Dropdown List (Optional) --</option>
                    {PRESET_EXPENSE_CATEGORIES.filter(c => c !== 'Other / Custom Category').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Custom Category Box */}
                  <input
                    type="text"
                    required
                    placeholder="Or type custom category name..."
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-medium placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    Choose from dropdown or freely write custom category.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0"
                  value={expenseAmount === 0 ? '' : expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-zinc-950 border border-red-500 rounded px-3 py-2 text-base font-mono font-bold text-red-400 focus:outline-none placeholder:text-red-500/40 focus:placeholder-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Paid To / Payee *</label>
                  <input
                    type="text"
                    required
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="e.g. Landlord, DESCO, Staff Name"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Cash">Cash Voucher</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="bKash">bKash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reference / Bill / Voucher No</label>
                <input
                  type="text"
                  placeholder="e.g. DESCO-Bill-98210"
                  value={expenseRef}
                  onChange={(e) => setExpenseRef(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Particulars / Description</label>
                <textarea
                  rows={2}
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Expense description or purpose"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded cursor-pointer transition-colors"
                >
                  {editingExpense ? 'Update Expense Voucher' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Delete Expense Voucher"
        message={`Are you sure you want to delete expense voucher ${expenseToDelete?.voucherNumber || expenseToDelete?.expenseNumber} for BDT ${expenseToDelete?.amount.toLocaleString()}?`}
        confirmText="Delete Voucher"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
