import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Calendar,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PaymentRecord, ExpenseRecord } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { PrintableMoneyReceipt } from '../documents/PrintableMoneyReceipt';
import { exportToExcel } from '../../utils/exportImport';

export const FinanceManager: React.FC = () => {
  const {
    payments,
    expenses,
    settings,
    recordPayment,
    saveExpense,
    customers,
    suppliers,
    getNextNumber
  } = useData();

  const [activeTab, setActiveTab] = useState<'collections' | 'expenses'>('collections');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [printingPayment, setPrintingPayment] = useState<PaymentRecord | null>(null);

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState('Rent & Office Premises');
  const [expenseAmount, setExpenseAmount] = useState(25000);
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'bKash' | 'Cheque'>('Bank Transfer');
  const [paidTo, setPaidTo] = useState('Ananda Nibash Landlord');
  const [expenseRef, setExpenseRef] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const totalCollections = payments.filter(p => p.type === 'Customer Collection').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netCashflow = totalCollections - totalExpenses;

  const handlePrintReceipt = (p: PaymentRecord) => {
    setPrintingPayment(p);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: ExpenseRecord = {
      id: 'exp-' + Date.now(),
      voucherNumber: 'EXP-' + Date.now().toString().slice(-6),
      expenseDate,
      category: expenseCategory,
      amount: expenseAmount,
      currency: 'BDT',
      paymentMethod,
      paidTo,
      referenceNumber: expenseRef,
      notes: expenseNotes,
      approvedBy: 'Managing Director',
      createdAt: getTodayDateString()
    };
    saveExpense(newExp);
    setShowExpenseModal(false);
  };

  const handleExportPayments = () => {
    const data = payments.map(p => ({
      'Receipt No': p.receiptNumber,
      'Date': p.paymentDate,
      'Type': p.type,
      'Entity': p.entityName,
      'Invoice No': p.invoiceNumber || '',
      'Amount': p.amount,
      'Method': p.paymentMethod,
      'Reference': p.transactionReference || '',
      'Collected By': p.collectedBy || ''
    }));
    exportToExcel(data, `Money_Receipts_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Hidden Print Container */}
      <div className="hidden print:block">
        {printingPayment && (
          <PrintableMoneyReceipt payment={printingPayment} settings={settings} />
        )}
      </div>

      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <CreditCard size={22} className="text-emerald-400" />
            Financial Accounts &amp; Treasury
          </h1>
          <p className="text-xs text-zinc-400">
            Bank: <strong className="text-zinc-200">{settings.bankName}</strong> • A/C: <span className="font-mono text-zinc-200">{settings.accountNumber}</span> • bKash: <span className="font-mono text-zinc-200">{settings.bkashNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPayments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Receipts</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-zinc-400 block mb-1">Total Customer Collections</span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {formatCurrency(totalCollections)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowDownLeft size={22} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-zinc-400 block mb-1">Total Operating Expenses</span>
            <span className="text-xl font-black font-mono text-red-400">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <ArrowUpRight size={22} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-zinc-400 block mb-1">Net Treasury Inflow</span>
            <span className="text-xl font-black font-mono text-amber-400">
              {formatCurrency(netCashflow)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="print:hidden flex border-b border-zinc-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'collections'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ArrowDownLeft size={15} />
          <span>Money Receipts &amp; Collections ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'expenses'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ArrowUpRight size={15} />
          <span>Office &amp; Operational Expenses ({expenses.length})</span>
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
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{p.receiptNumber}</td>
                    <td className="p-3 text-zinc-300">{formatDate(p.paymentDate)}</td>
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
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-400 rounded"
                        title="Print Money Receipt"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                  <th className="p-3">Voucher No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Paid To</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Amount (BDT)</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-400">{e.voucherNumber}</td>
                    <td className="p-3 text-zinc-300">{formatDate(e.expenseDate)}</td>
                    <td className="p-3 font-semibold text-zinc-200">{e.category}</td>
                    <td className="p-3 text-zinc-300">{e.paidTo}</td>
                    <td className="p-3 text-zinc-400">{e.paymentMethod}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-400 text-sm">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-3 text-zinc-500 text-[11px] italic">{e.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <ArrowUpRight size={18} className="text-red-400" />
                Record Business Expense Voucher
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-zinc-400 hover:text-zinc-200">
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

                <div>
                  <label className="block text-zinc-400 mb-1">Expense Category *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Rent & Office Premises">Rent &amp; Office Premises</option>
                    <option value="Staff Salaries & Wages">Staff Salaries &amp; Wages</option>
                    <option value="Electricity & Utilities">Electricity &amp; Utilities</option>
                    <option value="C&F & Customs Port Demurrage">C&amp;F &amp; Customs Port Demurrage</option>
                    <option value="Transportation & Fuel">Transportation &amp; Fuel</option>
                    <option value="Trade License & Government Fees">Trade License &amp; Government Fees</option>
                    <option value="Entertainment & Tea">Entertainment &amp; Tea</option>
                    <option value="Other Miscellaneous">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-red-500 rounded px-3 py-2 text-base font-mono font-bold text-red-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Paid To / Payee</label>
                  <input
                    type="text"
                    required
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
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
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Voucher</option>
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
