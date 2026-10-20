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
  Receipt,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Check,
  CheckCircle2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PaymentRecord, ExpenseRecord, PaymentMethod } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { PrintableMoneyReceipt } from '../documents/PrintableMoneyReceipt';
import { exportToExcel } from '../../utils/exportImport';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateMoneyReceiptWhatsAppText } from '../../utils/whatsapp';
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
    settings,
    invoices,
    customers,
    updatePayment,
    deletePayment
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

  // WhatsApp Money Receipt State
  const [whatsAppPayment, setWhatsAppPayment] = useState<PaymentRecord | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('');

  const handleOpenWhatsAppReceipt = (p: PaymentRecord) => {
    // Find customer by ID or name
    const cust = customers.find(c => c.id === p.entityId || c.customerName.toLowerCase() === (p.entityName || '').toLowerCase());
    const phone = cust?.phone || '';
    const text = generateMoneyReceiptWhatsAppText(p, settings?.companyName || 'Bismillah Multitrade Corporation');
    setWhatsAppPayment(p);
    setWhatsAppPhone(phone);
    setWhatsAppMessage(text);
  };

  // Edit Money Receipt State
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('Cash');
  const [editBank, setEditBank] = useState<string>('');
  const [editAccount, setEditAccount] = useState<string>('');
  const [editRef, setEditRef] = useState<string>('');
  const [editReceivedBy, setEditReceivedBy] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Delete Money Receipt State
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');

  const openEditModal = (p: PaymentRecord) => {
    setEditingPayment(p);
    setEditAmount(p.amount);
    setEditDate(p.paymentDate || p.date || getTodayDateString());
    setEditMethod(p.paymentMethod || 'Cash');
    setEditBank(p.bank || '');
    setEditAccount(p.account || '');
    setEditRef(p.transactionReference || p.reference || '');
    setEditReceivedBy(p.collectedBy || p.receivedBy || 'Accounts Officer');
    setEditNotes(p.notes || '');
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    if (editAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const linkedInvoice = editingPayment.invoiceId ? invoices.find(i => i.id === editingPayment.invoiceId) : null;
    const totalBill = (linkedInvoice ? linkedInvoice.grandTotal : 0) || editingPayment.totalAmount || editingPayment.amount;
    
    // Calculate accurate total paid across other receipts for this invoice
    const otherPaymentsTotal = payments
      .filter(p => p.invoiceId === editingPayment.invoiceId && p.id !== editingPayment.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const newPaidForInv = otherPaymentsTotal + editAmount;
    const newDueForInv = Math.max(0, totalBill - newPaidForInv);
    const pStatusClean: 'Unpaid' | 'Partial' | 'Paid' = newDueForInv <= 0 ? 'Paid' : (newPaidForInv > 0 ? 'Partial' : 'Unpaid');

    const updatedRecord: PaymentRecord = {
      ...editingPayment,
      amount: editAmount,
      date: editDate,
      paymentDate: editDate,
      paymentMethod: editMethod,
      bank: editBank,
      account: editAccount,
      transactionReference: editRef,
      reference: editRef,
      receivedBy: editReceivedBy,
      collectedBy: editReceivedBy,
      notes: editNotes,
      totalAmount: totalBill,
      paidAmount: newPaidForInv,
      dueAmount: newDueForInv,
      paymentStatus: pStatusClean,
      updatedAt: new Date().toISOString()
    };

    updatePayment(updatedRecord);
    setEditingPayment(null);
    setActionNotice(`Money Receipt #${updatedRecord.receiptNumber} updated successfully!`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleConfirmDelete = () => {
    if (!deletingPayment) return;
    const receiptNo = deletingPayment.receiptNumber;
    const success = deletePayment(deletingPayment.id);
    if (success) {
      setActionNotice(`Money Receipt #${receiptNo} deleted and balance reverted successfully.`);
      setTimeout(() => setActionNotice(''), 4000);
    }
    setDeletingPayment(null);
  };

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

      {/* Action Notice */}
      {actionNotice && (
        <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice('')} className="text-emerald-400 hover:text-white cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span>Money Receipts &amp; Invoice Payments ({payments.length})</span>
          </h3>
          <span className="text-xs text-zinc-400">Verified cash &amp; bank ledger • Full / Partial Payment Tracking</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3">Receipt No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer / Client</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Method &amp; Ref</th>
                <th className="p-3 text-right">Received (BDT)</th>
                <th className="p-3 text-right">Remaining Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Collected By</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500">
                    No payment records found. Record a payment from an Invoice to see it here.
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const linkedInv = p.invoiceId ? invoices.find(i => i.id === p.invoiceId) : null;
                  const calculatedDue = p.dueAmount !== undefined 
                    ? p.dueAmount 
                    : (linkedInv ? linkedInv.balanceDue : 0);
                  const isFullPaid = p.paymentStatus === 'Paid' || calculatedDue <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {p.receiptNumber}
                      </td>
                      <td className="p-3 text-zinc-300">{formatDate(p.paymentDate || p.date)}</td>
                      <td className="p-3 font-medium text-zinc-200">{p.entityName}</td>
                      <td className="p-3 font-mono text-zinc-400">
                        {p.invoiceNumber || (linkedInv ? linkedInv.invoiceNumber : '—')}
                      </td>
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
                      <td className="p-3 text-right font-mono font-bold text-zinc-300">
                        {calculatedDue > 0 ? (
                          <span className="text-amber-400">{formatCurrency(calculatedDue)}</span>
                        ) : (
                          <span className="text-zinc-500">৳ 0.00</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          isFullPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {isFullPaid ? 'Full Paid' : 'Partial'}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{p.collectedBy || p.receivedBy || 'System'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Money Receipt to WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppReceipt(p)}
                            className="p-1.5 bg-zinc-800 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer transition-colors"
                            title="Send Money Receipt PDF directly to WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>

                          {/* Print Receipt */}
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(p)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded cursor-pointer transition-colors"
                            title="Print Money Receipt"
                          >
                            <Printer size={13} />
                          </button>

                          {/* Edit Money Receipt */}
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-sky-400 rounded cursor-pointer transition-colors"
                            title="Edit Money Receipt"
                          >
                            <Edit size={13} />
                          </button>

                          {/* Delete Money Receipt */}
                          <button
                            type="button"
                            onClick={() => setDeletingPayment(p)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 rounded cursor-pointer transition-colors"
                            title="Delete Money Receipt"
                          >
                            <Trash2 size={13} />
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

      {/* ========================================================================= */}
      {/* EDIT MONEY RECEIPT MODAL                                                  */}
      {/* ========================================================================= */}
      {editingPayment && (() => {
        const linkedInv = editingPayment.invoiceId ? invoices.find(i => i.id === editingPayment.invoiceId) : null;
        const totalBill = (linkedInv ? linkedInv.grandTotal : 0) || editingPayment.totalAmount || editingPayment.amount;
        const otherPaymentsTotal = payments
          .filter(p => p.invoiceId === editingPayment.invoiceId && p.id !== editingPayment.id)
          .reduce((sum, p) => sum + p.amount, 0);
        const livePaid = otherPaymentsTotal + editAmount;
        const liveDue = Math.max(0, totalBill - livePaid);
        const liveIsPaid = liveDue <= 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 text-zinc-100 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">
                      Edit Money Receipt #{editingPayment.receiptNumber}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Modify amount, payment method, bank details, or ledger note.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Live Due & Payment Status Dynamic Indicator */}
              <div className="my-4 p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Bill</span>
                  <span className="font-mono font-bold text-xs text-zinc-200">{formatCurrency(totalBill)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Remaining Due</span>
                  <span className={`font-mono font-bold text-xs ${liveDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatCurrency(liveDue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Calculated Status</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                    liveIsPaid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {liveIsPaid ? 'Full Paid' : 'Partial'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveEditPayment} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Customer / Client
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.entityName}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Against Invoice
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.invoiceNumber || (linkedInv ? linkedInv.invoiceNumber : 'Account Settlement')}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Amount (BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0.01}
                      step="any"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                      <option value="Pay Order">Pay Order</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Cheque / Txn Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CQ-99281, TR-4821"
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Islami Bank, DBBL"
                      value={editBank}
                      onChange={(e) => setEditBank(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Collected / Received By
                    </label>
                    <input
                      type="text"
                      value={editReceivedBy}
                      onChange={(e) => setEditReceivedBy(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Enter particulars or transaction details..."
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    <Check size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-red-500/40 rounded-2xl max-w-sm w-full p-5 text-zinc-100 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Delete Money Receipt?</h3>
                <p className="text-[11px] text-zinc-400">
                  Receipt: <strong className="font-mono text-emerald-400">{deletingPayment.receiptNumber}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Customer:</span>
                <span className="font-medium text-zinc-200">{deletingPayment.entityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount to Revert:</span>
                <span className="font-mono font-bold text-red-400">{formatCurrency(deletingPayment.amount)}</span>
              </div>
              {deletingPayment.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Invoice:</span>
                  <span className="font-mono text-zinc-300">{deletingPayment.invoiceNumber}</span>
                </div>
              )}
              <p className="text-[10px] text-amber-400/90 pt-1.5 border-t border-zinc-800">
                Warning: Deleting will remove this receipt and restore the customer&apos;s invoice balance due.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/40"
              >
                <Trash2 size={13} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Printable Container for WhatsApp Money Receipt PDF generation */}
      {whatsAppPayment && (
        <div
          id={`finance-printable-receipt-${whatsAppPayment.id}`}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '800px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
        >
          <PrintableMoneyReceipt payment={whatsAppPayment} settings={settings} />
        </div>
      )}

      {/* WhatsApp Send Modal for Money Receipt */}
      {whatsAppPayment && (
        <WhatsAppSendModal
          isOpen={Boolean(whatsAppPayment)}
          onClose={() => setWhatsAppPayment(null)}
          title={`Send Money Receipt #${whatsAppPayment.receiptNumber} to WhatsApp`}
          defaultPhone={whatsAppPhone}
          initialMessage={whatsAppMessage}
          recipientLabel="Customer WhatsApp Phone"
          pdfElementId={`finance-printable-receipt-${whatsAppPayment.id}`}
          pdfFilename={`Money-Receipt-${whatsAppPayment.receiptNumber}`}
          documentType="Money Receipt"
          documentNumber={whatsAppPayment.receiptNumber}
        />
      )}
    </div>
  );
};
