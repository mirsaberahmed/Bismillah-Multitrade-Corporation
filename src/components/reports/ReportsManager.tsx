import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Users
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getDateRangePreset } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';

export const ReportsManager: React.FC = () => {
  const { invoices, customers, products, payments, expenses, settings } = useData();

  const [reportType, setReportType] = useState<'sales' | 'dues' | 'inventory' | 'pl'>('sales');
  const [datePreset, setDatePreset] = useState('this_year');

  const { start, end } = getDateRangePreset(datePreset);

  const filteredInvoices = invoices.filter(i => {
    if (start && i.invoiceDate < start) return false;
    if (end && i.invoiceDate > end) return false;
    return true;
  });

  const totalSales = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalCollections = filteredInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = filteredInvoices.reduce((s, i) => s + i.balanceDue, 0);

  const totalStockValueCost = products.reduce((s, p) => s + (p.stockQuantity * p.purchasePrice), 0);
  const totalStockValueRetail = products.reduce((s, p) => s + (p.stockQuantity * p.sellingPrice), 0);
  const totalOperatingExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const estimatedGrossProfit = filteredInvoices.reduce((s, inv) => {
    const invCost = inv.items.reduce((c, it) => {
      const p = products.find(prod => prod.id === it.productId);
      return c + ((p ? p.purchasePrice : it.unitPrice * 0.7) * it.quantity);
    }, 0);
    return s + (inv.subtotal - inv.itemDiscount - inv.overallDiscount - invCost);
  }, 0);

  const netEstimatedProfit = estimatedGrossProfit - totalOperatingExpenses;

  const handleExport = () => {
    if (reportType === 'sales') {
      const data = filteredInvoices.map(i => ({
        'Invoice No': i.invoiceNumber,
        'Date': i.invoiceDate,
        'Customer': i.customerName,
        'Grand Total': i.grandTotal,
        'Paid Amount': i.paidAmount,
        'Due Amount': i.balanceDue,
        'Payment Status': i.paymentStatus,
        'Delivery Status': i.deliveryStatus
      }));
      exportToExcel(data, `Sales_Report_${datePreset}`);
    } else if (reportType === 'dues') {
      const data = customers.filter(c => c.currentBalance > 0).map(c => ({
        'Customer Name': c.customerName,
        'Company': c.companyName,
        'Phone': c.phone,
        'Outstanding Balance': c.currentBalance,
        'Credit Limit': c.creditLimit,
        'Payment Terms': c.paymentTerms
      }));
      exportToExcel(data, `Customer_Dues_Report`);
    } else if (reportType === 'inventory') {
      const data = products.map(p => ({
        'Product Code': p.productCode,
        'Name': p.productName,
        'Category': p.category,
        'Stock Qty': p.stockQuantity,
        'Unit': p.unit,
        'Cost Price': p.purchasePrice,
        'Stock Cost Value': p.stockQuantity * p.purchasePrice,
        'Selling Price': p.sellingPrice,
        'Stock Retail Value': p.stockQuantity * p.sellingPrice
      }));
      exportToExcel(data, `Inventory_Valuation_Report`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 size={22} className="text-amber-500" />
            Executive Reports &amp; Business Intelligence
          </h1>
          <p className="text-xs text-zinc-400">
            Exportable audit statements, customer aging balance registers, and inventory valuations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and selector */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">Report View:</span>
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setReportType('sales')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                reportType === 'sales' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sales Register
            </button>
            <button
              onClick={() => setReportType('dues')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                reportType === 'dues' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Customer Dues
            </button>
            <button
              onClick={() => setReportType('inventory')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                reportType === 'inventory' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Stock Valuation
            </button>
            <button
              onClick={() => setReportType('pl')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                reportType === 'pl' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Profit &amp; Loss
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">Time Period:</span>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 text-xs text-zinc-200"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year (2026)</option>
            <option value="all">All Time History</option>
          </select>
        </div>
      </div>

      {/* SALES REGISTER VIEW */}
      {reportType === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-400 block mb-1">Period Invoiced Total</span>
              <span className="text-xl font-black font-mono text-zinc-100">{formatCurrency(totalSales)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-400 block mb-1">Period Collections</span>
              <span className="text-xl font-black font-mono text-emerald-400">{formatCurrency(totalCollections)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-400 block mb-1">Period Outstanding Due</span>
              <span className="text-xl font-black font-mono text-red-400">{formatCurrency(totalOutstanding)}</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                      <td className="p-3 text-zinc-300">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-3 font-bold text-zinc-200">{inv.customerName}</td>
                      <td className="p-3 text-right font-mono text-zinc-400">{formatCurrency(inv.subtotal)}</td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-100">{formatCurrency(inv.grandTotal)}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-400">{formatCurrency(inv.balanceDue)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DUES VIEW */}
      {reportType === 'dues' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-100">Customer Outstanding Balance &amp; Aging Summary</span>
            <span className="text-zinc-400 font-mono">
              Total Market Receivables: <strong className="text-red-400">{formatCurrency(customers.reduce((s, c) => s + c.currentBalance, 0))}</strong>
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3">Customer</th>
                <th className="p-3">Company Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Current Due</th>
                <th className="p-3">Payment Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-zinc-800/40">
                  <td className="p-3 font-bold text-zinc-100">{c.customerName}</td>
                  <td className="p-3 text-zinc-300">{c.companyName}</td>
                  <td className="p-3 font-mono text-zinc-400">{c.phone}</td>
                  <td className="p-3 text-right font-mono text-zinc-400">{formatCurrency(c.creditLimit)}</td>
                  <td className="p-3 text-right font-mono font-bold text-red-400 text-sm">{formatCurrency(c.currentBalance)}</td>
                  <td className="p-3 text-zinc-400">{c.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STOCK VALUATION VIEW */}
      {reportType === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-400 block mb-1">Total Stock Cost Value (Inventory Asset)</span>
              <span className="text-xl font-black font-mono text-emerald-400">{formatCurrency(totalStockValueCost)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-400 block mb-1">Total Stock Retail Value</span>
              <span className="text-xl font-black font-mono text-amber-400">{formatCurrency(totalStockValueRetail)}</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                  <th className="p-3">Code</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-right">Stock Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-mono text-amber-400 font-bold">{p.productCode}</td>
                    <td className="p-3 font-bold text-zinc-200">{p.productName}</td>
                    <td className="p-3 text-zinc-400">{p.category}</td>
                    <td className="p-3 text-center font-mono font-bold text-zinc-100">{p.stockQuantity} {p.unit}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">{formatCurrency(p.purchasePrice)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.stockQuantity * p.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROFIT & LOSS VIEW */}
      {reportType === 'pl' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 text-xs max-w-3xl mx-auto">
          <div className="border-b border-zinc-800 pb-3 text-center">
            <h2 className="text-base font-black text-zinc-100 uppercase tracking-tight">
              Bismillah Multitrade Corporation
            </h2>
            <p className="text-zinc-400 text-xs">Statement of Profit &amp; Loss (Estimated)</p>
          </div>

          <div className="space-y-3 divide-y divide-zinc-800/80">
            <div className="flex justify-between font-bold text-zinc-200 pt-2">
              <span>Total Revenue from Sales:</span>
              <span className="font-mono text-emerald-400 text-sm">{formatCurrency(totalSales)}</span>
            </div>

            <div className="flex justify-between font-bold text-zinc-200 pt-2">
              <span>Estimated Cost of Goods Sold (COGS):</span>
              <span className="font-mono text-red-400 text-sm">
                -{formatCurrency(totalSales - estimatedGrossProfit)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-zinc-100 pt-2 bg-zinc-950 p-2 rounded">
              <span>Gross Operational Profit:</span>
              <span className="font-mono text-amber-400 text-base">{formatCurrency(estimatedGrossProfit)}</span>
            </div>

            <div className="flex justify-between font-bold text-zinc-200 pt-2">
              <span>Operating &amp; Administrative Expenses:</span>
              <span className="font-mono text-red-400 text-sm">-{formatCurrency(totalOperatingExpenses)}</span>
            </div>

            <div className="flex justify-between font-black text-zinc-950 p-3 bg-amber-500 rounded-lg text-base mt-4">
              <span>NET OPERATING PROFIT:</span>
              <span className="font-mono text-xl">{formatCurrency(netEstimatedProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
