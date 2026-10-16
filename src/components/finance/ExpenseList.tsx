import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Printer,
  Edit,
  Eye,
  Trash2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ExpenseRecord } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';


interface Props {
  onSelectExpense: (id: string) => void;
  onNewExpense: () => void;
  onEditExpense: (id: string) => void;
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

export const ExpenseList: React.FC<Props> = ({
  onSelectExpense,
  onNewExpense,
  onEditExpense
}) => {
  const { expenses, settings, deleteExpense } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  // Financial calculations
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const todayStr = getTodayDateString();
  const currentMonth = todayStr.substring(0, 7);
  const thisMonthExpenses = expenses
    .filter(e => (e.expenseDate || e.date || '').startsWith(currentMonth))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const todayExpenses = expenses
    .filter(e => (e.expenseDate || e.date) === todayStr)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter(e => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (e.voucherNumber || e.expenseNumber || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.paidTo || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q) ||
      (e.referenceNumber || '').toLowerCase().includes(q) ||
      (e.items && e.items.some(it => it.particulars.toLowerCase().includes(q)));

    const matchCategory =
      categoryFilter === 'All' || e.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  const handleExportExcel = () => {
    const data = filteredExpenses.map(e => ({
      'Voucher No': e.voucherNumber || e.expenseNumber,
      'Date': e.expenseDate || e.date,
      'Payee': e.paidTo,
      'Category': e.category,
      'Items Count': e.items?.length || 1,
      'Total Amount': e.amount,
      'Payment Method': e.paymentMethod,
      'Reference No': e.referenceNumber || '',
      'Remarks': e.notes || ''
    }));
    exportToExcel(data, `Expense_Sheets_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Receipt size={22} className="text-red-400" />
            <span>Operating Expense Sheets &amp; Vouchers</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Invoice-style itemized expense tracking, official debit vouchers, instant PDF and direct editing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={onNewExpense}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Create Expense Sheet</span>
          </button>
        </div>
      </div>

      {/* Metric Cards - 4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Operating Expenses</span>
          <span className="text-lg font-mono font-black text-red-400">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">{expenses.length} Total vouchers recorded</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">This Month Expenses</span>
          <span className="text-lg font-mono font-black text-amber-400">
            {formatCurrency(thisMonthExpenses)}
          </span>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Month-to-date treasury outlays</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Today's Expenses</span>
          <span className="text-lg font-mono font-black text-zinc-100">
            {formatCurrency(todayExpenses)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Daily cash/bank expenses</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Vouchers</span>
          <span className="text-lg font-mono font-black text-zinc-100">
            {expenses.length}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">100% itemized &amp; printable</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs shrink-0 flex items-center gap-1">
            <Filter size={13} />
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
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

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3 w-32">Voucher No</th>
                <th className="p-3 w-28">Date</th>
                <th className="p-3">Paid To / Payee</th>
                <th className="p-3">Category / Head</th>
                <th className="p-3 w-24 text-center">Items</th>
                <th className="p-3">Method &amp; Ref</th>
                <th className="p-3 text-right w-36">Total Amount (BDT)</th>
                <th className="p-3">Remarks / Particulars</th>
                <th className="p-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <Receipt size={36} className="mx-auto mb-2 opacity-30 text-red-400" />
                    <p className="font-semibold text-zinc-300">No expense vouchers found</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Click <strong className="text-red-400">+ Create Expense Sheet</strong> to record and itemize an expense.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const itemsCount = e.items?.length || 1;
                  return (
                    <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-red-400">
                        <button
                          type="button"
                          onClick={() => onSelectExpense(e.id)}
                          className="hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          title="Click to view full Expense Sheet"
                        >
                          <FileText size={13} className="shrink-0" />
                          <span>{e.voucherNumber || e.expenseNumber}</span>
                        </button>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {formatDate(e.expenseDate || e.date)}
                      </td>
                      <td className="p-3 font-bold text-zinc-100">
                        {e.paidTo || 'Cash Expense'}
                      </td>
                      <td className="p-3 text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-zinc-800 text-zinc-300">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">
                        <span className="font-semibold text-zinc-300">{e.paymentMethod}</span>
                        {e.referenceNumber && (
                          <span className="block font-mono text-[10px] text-zinc-500">
                            {e.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-red-400 text-sm">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="p-3 text-zinc-400 max-w-xs truncate" title={e.notes || ''}>
                        {e.notes || e.description || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">


                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => onSelectExpense(e.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 rounded cursor-pointer transition-colors"
                            title="View Expense Details & PDF"
                          >
                            <Eye size={14} />
                          </button>

                          {/* DIRECT EDIT BUTTON - Just like Invoice Edit */}
                          <button
                            type="button"
                            onClick={() => onEditExpense(e.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-blue-400 rounded cursor-pointer transition-colors"
                            title="Edit Expense Sheet"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(e)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded cursor-pointer transition-colors"
                            title="Delete Voucher"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <ConfirmModal
          isOpen={Boolean(expenseToDelete)}
          title="Delete Expense Voucher"
          message={`Are you sure you want to permanently delete expense voucher ${expenseToDelete.voucherNumber || expenseToDelete.expenseNumber}?`}
          confirmText="Delete Voucher"
          variant="danger"
          onConfirm={() => {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
          onCancel={() => setExpenseToDelete(null)}
        />
      )}


    </div>
  );
};
