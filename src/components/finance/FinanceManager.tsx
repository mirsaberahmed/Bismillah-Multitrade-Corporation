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
  Receipt
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PaymentRecord, ExpenseRecord } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { PrintableMoneyReceipt } from '../documents/PrintableMoneyReceipt';
import { exportToExcel } from '../../utils/exportImport';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseDetails } from './ExpenseDetails';

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
    settings
  } = useData();

  const [activeTab, setActiveTab] = useState<'collections' | 'expenses'>(
    defaultTab || initialTab || 'collections'
  );

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
    else if (initialTab) setActiveTab(initialTab);
  }, [defaultTab, initialTab]);

  // Expenses sub-views
  const [expenseSubView, setExpenseSubView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  const [printingPayment, setPrintingPayment] = useState<PaymentRecord | null>(null);

  // Financial calculations
  const totalCollections = payments.filter(p => p.type === 'Customer Collection').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netCashflow = totalCollections - totalExpenses;

  const todayStr = getTodayDateString();
  const currentMonth = todayStr.substring(0, 7);
  const thisMonthExpenses = expenses
    .filter(e => (e.expenseDate || e.date || '').startsWith(currentMonth))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handlePrintReceipt = (p: PaymentRecord) => {
    setPrintingPayment(p);
    setTimeout(() => {
      window.print();
    }, 200);
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

  // If in expenses tab, render the dedicated 1st-class Expense experience
  if (activeTab === 'expenses') {
    return (
      <div className="space-y-4">
        {expenseSubView === 'list' && (
          <ExpenseList
            onSelectExpense={(id) => {
              setSelectedExpId(id);
              setExpenseSubView('details');
            }}
            onNewExpense={() => {
              setSelectedExpId(null);
              setExpenseSubView('create');
            }}
            onEditExpense={(id) => {
              setSelectedExpId(id);
              setExpenseSubView('edit');
            }}
          />
        )}

        {expenseSubView === 'create' && (
          <ExpenseForm
            onCancel={() => setExpenseSubView('list')}
            onSuccess={(id) => {
              setSelectedExpId(id);
              setExpenseSubView('details');
            }}
          />
        )}

        {expenseSubView === 'edit' && selectedExpId && (
          <ExpenseForm
            expenseId={selectedExpId}
            onCancel={() => setExpenseSubView('list')}
            onSuccess={(id) => {
              setSelectedExpId(id);
              setExpenseSubView('details');
            }}
          />
        )}

        {expenseSubView === 'details' && selectedExpId && (
          <ExpenseDetails
            expenseId={selectedExpId}
            onBack={() => setExpenseSubView('list')}
            onEdit={(id) => {
              setSelectedExpId(id);
              setExpenseSubView('edit');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden Print Container for Receipts */}
      <div className="hidden print:block">
        {printingPayment && (
          <PrintableMoneyReceipt payment={printingPayment} settings={settings} />
        )}
      </div>

      {/* Header Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <CreditCard size={22} className="text-emerald-400" />
            <span>Financial Accounts &amp; Customer Collections</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Bank: {settings.bankName || 'General Bank'} • A/C: {settings.accountNumber || 'Primary'} • Track collections &amp; treasury inflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPayments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Receipts</span>
          </button>
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

      {/* Collections Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span>Money Receipts &amp; Invoice Payments ({payments.length})</span>
          </h3>
          <span className="text-xs text-zinc-400">Verified cash &amp; bank ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3">Receipt No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer / Client</th>
                <th className="p-3">Method &amp; Ref</th>
                <th className="p-3 text-right">Amount (BDT)</th>
                <th className="p-3">Collected By</th>
                <th className="p-3 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No payment records found. Record a payment from an Invoice to see it here.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {p.receiptNumber}
                    </td>
                    <td className="p-3 text-zinc-300">{formatDate(p.paymentDate || p.date)}</td>
                    <td className="p-3 font-medium text-zinc-200">{p.entityName}</td>
                    <td className="p-3 text-zinc-400">
                      <span className="font-semibold text-zinc-300">{p.paymentMethod}</span>
                      {p.transactionReference && (
                        <span className="block font-mono text-[10px] text-zinc-500">
                          {p.transactionReference}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3 text-zinc-400">{p.collectedBy || p.receivedBy || 'System'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded cursor-pointer transition-colors"
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
    </div>
  );
};
