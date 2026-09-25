import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Truck,
  Package,
  AlertTriangle,
  Building2,
  Users,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Ship,
  Plus,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardProps {
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: any) => void;
  onSelectInvoice: (invoiceId: string) => void;
  onNewInvoice: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onNavigate,
  onSelectInvoice,
  onNewInvoice
}) => {
  const navigate = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    else if (onNavigate) onNavigate(tab);
  };
  const {
    invoices,
    purchaseInvoices,
    payments,
    expenses,
    customers,
    suppliers,
    products,
    deliverySlips,
    deliveryReturns,
    shipments,
    lcRecords
  } = useData();

  const todayStr = getTodayDateString();
  const currentMonth = todayStr.substring(0, 7); // YYYY-MM

  // Financial Metrics Calculations
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPurchases = purchaseInvoices.reduce((sum, pinv) => sum + pinv.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCustomerCollections = payments
    .filter(p => p.type === 'Customer Collection')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalSupplierPayments = payments
    .filter(p => p.type === 'Supplier Payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCustomerDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const totalSupplierDue = purchaseInvoices.reduce((sum, pinv) => sum + pinv.balanceDue, 0);
  const netProfit = totalSales - totalPurchases - totalExpenses;

  // Today & Month-to-date
  const todaySales = invoices
    .filter(i => i.invoiceDate === todayStr)
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const todayCollection = payments
    .filter(p => p.paymentDate === todayStr && p.type === 'Customer Collection')
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonthSales = invoices
    .filter(i => i.invoiceDate.startsWith(currentMonth))
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const thisMonthPurchases = purchaseInvoices
    .filter(p => p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.grandTotal, 0);

  const thisMonthExpenses = expenses
    .filter(e => (e.expenseDate || e.date || '').startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // Delivery Metrics
  const deliveriesToday = deliverySlips.filter(d => d.deliveryDate === todayStr).length;
  const pendingDeliveries = deliverySlips.filter(d => d.deliveryStatus !== 'Delivered' && d.deliveryStatus !== 'Cancelled').length;
  const partiallyDeliveredInvoices = invoices.filter(i => i.deliveryStatus === 'Partially Delivered').length;
  const completedDeliveries = deliverySlips.filter(d => d.deliveryStatus === 'Delivered').length;
  const returnedDeliveriesCount = deliveryReturns.length + deliverySlips.filter(d => d.deliveryStatus === 'Returned').length;

  // Alerts
  const lowStockProducts = products.filter(p => p.stockQuantity <= (p.minimumStock || p.minStockLevel || 10));
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'Overdue' || (i.balanceDue > 0 && new Date(i.dueDate) < new Date()));
  const activeLcCount = lcRecords.filter(lc => lc.status === 'Open' || lc.status === 'Opened' || lc.status === 'Active' || lc.status === 'Under Process').length;
  const pendingShipmentsCount = shipments.filter(s => (s.status || s.shipmentStatus) !== 'Delivered' && (s.status || s.shipmentStatus) !== 'Customs Cleared').length;

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, total: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.amount;
    });
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Operating Headquarters
              </span>
              <span className="text-xs text-zinc-400">Mirpur, Dhaka-1216</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight mt-1">
              Bismillah Multitrade ERP Executive Dashboard
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive overview of trade operations, sales invoicing, delivery tracking, and liquidity.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewInvoice}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              <Plus size={15} className="stroke-[3]" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => navigate('delivery_slips')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Truck size={15} className="text-blue-400" />
              <span>Delivery Slips</span>
            </button>
            <button
              onClick={() => navigate('payments')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <CreditCard size={15} className="text-emerald-400" />
              <span>Money Receipts</span>
            </button>
            <button
              onClick={() => navigate('import_records')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Ship size={15} className="text-purple-400" />
              <span>Import &amp; LC</span>
            </button>
          </div>
        </div>

        {/* Quick Day Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-zinc-800 text-xs">
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block font-medium">Today's Sales</span>
            <span className="text-sm font-mono font-bold text-amber-400">
              {formatCurrency(todaySales)}
            </span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block font-medium">Today's Collection</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {formatCurrency(todayCollection)}
            </span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block font-medium">This Month Sales</span>
            <span className="text-sm font-mono font-bold text-zinc-100">
              {formatCurrency(thisMonthSales)}
            </span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
            <span className="text-[11px] text-zinc-400 block font-medium">This Month Purchases</span>
            <span className="text-sm font-mono font-bold text-zinc-100">
              {formatCurrency(thisMonthPurchases)}
            </span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-zinc-400 block font-medium">This Month Expenses</span>
            <span className="text-sm font-mono font-bold text-red-400">
              {formatCurrency(thisMonthExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div
          onClick={() => navigate('invoices')}
          className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Sales Turnover</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-zinc-100 mb-1">
            {formatCurrency(totalSales)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{invoices.length} Invoices issued</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
              View all <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Total Customer Receivable (Due) */}
        <div
          onClick={() => navigate('invoices')}
          className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Customer Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-red-400 mb-1">
            {formatCurrency(totalCustomerDue)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Collected: {formatCurrency(totalCustomerCollections)}</span>
            <span className="text-zinc-400 font-medium">
              {overdueInvoices.length > 0 ? `${overdueInvoices.length} Overdue` : 'Healthy'}
            </span>
          </div>
        </div>

        {/* Total Purchases & Supplier Due */}
        <div
          onClick={() => navigate('purchase_invoices')}
          className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Purchases &amp; Payables</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-zinc-100 mb-1">
            {formatCurrency(totalPurchases)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Payable: <strong className="text-amber-400">{formatCurrency(totalSupplierDue)}</strong></span>
            <span>{purchaseInvoices.length} Purchases</span>
          </div>
        </div>

        {/* Net Business Profit */}
        <div
          onClick={() => navigate('reports')}
          className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Calculated Net Operating Margin</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className={`text-xl font-black font-mono mb-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Expenses: {formatCurrency(totalExpenses)}</span>
            <span className="text-emerald-400 font-semibold">Live P&amp;L</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD DELIVERY MODULE: Specific Section Requested by User */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Truck size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">
                Delivery &amp; Logistics Overview
              </h2>
              <p className="text-[11px] text-zinc-400">
                Real-time tracking of dispatch, pending deliveries, returns, and delivery slip operations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('delivery_slips')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>All Delivery Slips</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 5 Delivery Status KPI Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-zinc-300">Deliveries Today</span>
              <Clock size={14} className="text-blue-400" />
            </div>
            <div className="text-xl font-black font-mono text-zinc-100">{deliveriesToday}</div>
            <span className="text-[10px] text-zinc-500">Scheduled for today</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-zinc-300">Pending Deliveries</span>
              <Truck size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-black font-mono text-amber-400">{pendingDeliveries}</div>
            <span className="text-[10px] text-zinc-500">Dispatched or awaiting</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-zinc-300">Partially Delivered</span>
              <AlertTriangle size={14} className="text-purple-400" />
            </div>
            <div className="text-xl font-black font-mono text-purple-400">{partiallyDeliveredInvoices}</div>
            <span className="text-[10px] text-zinc-500">Invoices in progress</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-zinc-300">Completed Deliveries</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-black font-mono text-emerald-400">{completedDeliveries}</div>
            <span className="text-[10px] text-zinc-500">Delivered &amp; confirmed</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-zinc-300">Returned Deliveries</span>
              <RotateCcw size={14} className="text-red-400" />
            </div>
            <div className="text-xl font-black font-mono text-red-400">{returnedDeliveriesCount}</div>
            <span className="text-[10px] text-zinc-500">Returns or damaged</span>
          </div>
        </div>

        {/* Recent Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-2 font-semibold text-zinc-300">Delivery Slip Number</th>
                <th className="pb-2 font-semibold text-zinc-300">Invoice Number</th>
                <th className="pb-2 font-semibold text-zinc-300">Customer</th>
                <th className="pb-2 font-semibold text-zinc-300">Delivery Date</th>
                <th className="pb-2 font-semibold text-zinc-300">Vehicle / Driver</th>
                <th className="pb-2 font-semibold text-zinc-300">Status</th>
                <th className="pb-2 font-semibold text-zinc-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {deliverySlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-500">
                    <Truck size={24} className="mx-auto mb-1.5 text-zinc-600" />
                    <p>No delivery slips generated yet.</p>
                  </td>
                </tr>
              ) : (
                deliverySlips.slice(0, 5).map(slip => (
                  <tr key={slip.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-amber-400">{slip.deliverySlipNumber}</td>
                    <td className="py-2.5 font-mono text-zinc-300">
                      <button
                        onClick={() => onSelectInvoice(slip.invoiceId)}
                        className="hover:underline hover:text-amber-400"
                      >
                        {slip.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-2.5 text-zinc-200">{slip.customerName}</td>
                    <td className="py-2.5 text-zinc-400">{formatDate(slip.deliveryDate)}</td>
                    <td className="py-2.5 text-zinc-400">
                      {slip.vehicleNumber || slip.driverName ? `${slip.vehicleNumber || ''} ${slip.driverName ? `(${slip.driverName})` : ''}` : 'Direct / Courier'}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        slip.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : slip.deliveryStatus === 'Dispatched'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                          : slip.deliveryStatus === 'Returned'
                          ? 'bg-red-950 text-red-400 border border-red-800/50'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                      }`}>
                        {slip.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onSelectInvoice(slip.invoiceId)}
                        className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-colors"
                      >
                        Open Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Top Products & Quick Trade/Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              <Package size={16} className="text-amber-400" />
              Top Products by Sales Volume
            </h3>
            <button
              onClick={() => navigate('products')}
              className="text-xs text-amber-400 hover:underline"
            >
              Catalog
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-lg border border-zinc-800/70">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-bold text-zinc-200 truncate">{p.name}</p>
                  <p className="text-[11px] text-zinc-400 font-mono">{p.qty} units sold</p>
                </div>
                <div className="text-right font-mono text-xs font-bold text-amber-400">
                  {formatCurrency(p.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Trade & Inventory Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              <Ship size={16} className="text-purple-400" />
              Import, Export &amp; LC Pipeline
            </h3>
            <button
              onClick={() => navigate('lc_management')}
              className="text-xs text-amber-400 hover:underline"
            >
              LC Manager
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Active Letters of Credit</span>
              <span className="text-lg font-mono font-bold text-purple-400">{activeLcCount} Active</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">In-Transit Shipments</span>
              <span className="text-lg font-mono font-bold text-blue-400">{pendingShipmentsCount} In-Transit</span>
            </div>
          </div>

          {/* Low Stock Watch */}
          <div className="border-t border-zinc-800 pt-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-400" />
                Low Stock Threshold Alerts ({lowStockProducts.length})
              </span>
              <button
                onClick={() => navigate('products')}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Manage Stock
              </button>
            </div>
            <div className="space-y-1.5">
              {lowStockProducts.slice(0, 3).map(prod => (
                <div key={prod.id} className="flex items-center justify-between p-2 bg-red-950/20 border border-red-900/30 rounded text-xs">
                  <span className="text-zinc-200 truncate">{prod.productName}</span>
                  <span className="text-red-400 font-bold font-mono">
                    {prod.stockQuantity} {prod.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Invoices Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">
              Recent Sales Invoices
            </h3>
            <p className="text-[11px] text-zinc-400">
              Latest invoices generated with payment status and delivery fulfillment state.
            </p>
          </div>
          <button
            onClick={() => navigate('invoices')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>View All Invoices</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-2 font-medium">Invoice No</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium text-right">Grand Total</th>
                <th className="pb-2 font-medium text-right">Paid</th>
                <th className="pb-2 font-medium text-right">Balance Due</th>
                <th className="pb-2 font-medium text-center">Payment</th>
                <th className="pb-2 font-medium text-center">Delivery</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {invoices.slice(0, 6).map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                  <td className="py-2.5">
                    <p className="font-semibold text-zinc-200">{inv.customerName}</p>
                    {inv.companyName && inv.companyName !== inv.customerName && (
                      <p className="text-[11px] text-zinc-400">{inv.companyName}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-zinc-400">{formatDate(inv.invoiceDate)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-zinc-100">
                    {formatCurrency(inv.grandTotal, inv.currency)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-400">
                    {formatCurrency(inv.paidAmount, inv.currency)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-red-400">
                    {formatCurrency(inv.balanceDue, inv.currency)}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.paymentStatus === 'Paid'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : inv.paymentStatus === 'Partially Paid'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                        : inv.paymentStatus === 'Overdue'
                        ? 'bg-red-950 text-red-400 border border-red-800/50'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      inv.deliveryStatus === 'Delivered'
                        ? 'bg-emerald-950 text-emerald-300'
                        : inv.deliveryStatus === 'Partially Delivered'
                        ? 'bg-purple-950 text-purple-300'
                        : inv.deliveryStatus === 'Returned'
                        ? 'bg-red-950 text-red-300'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {inv.deliveryStatus}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onSelectInvoice(inv.id)}
                      className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
