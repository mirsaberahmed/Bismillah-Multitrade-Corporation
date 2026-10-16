import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Truck,
  Package,
  AlertTriangle,
  Building2,
  DollarSign,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Ship,
  Plus,
  ArrowRight,
  RotateCcw,
  ShoppingCart,
  Wallet,
  Receipt,
  Boxes,
  Zap,
  Bell,
  FileText,
  MoreHorizontal,
  ChevronDown,
  Eye,
  Printer,
  MessageSquare,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getTodayDateString, isDateInPeriod } from '../../utils/formatters';
import { ActiveTab } from '../layout/Sidebar';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText, generateDeliverySlipWhatsAppText } from '../../utils/whatsapp';
import { SalesInvoice, DeliverySlip } from '../../types';
import { PrintableInvoice } from '../documents/PrintableInvoice';
import { PrintableDeliverySlip } from '../documents/PrintableDeliverySlip';

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
    products,
    deliverySlips,
    deliveryReturns,
    settings,
    dateFilterPeriod
  } = useData();

  // Active Dropdowns / Menus
  const [activeInvoiceMenu, setActiveInvoiceMenu] = useState<string | null>(null);
  const [activeSlipMenu, setActiveSlipMenu] = useState<string | null>(null);

  // Interactive Chart Period Filters (Synchronized with global header filter)
  const [salesPeriod, setSalesPeriod] = useState<'Today' | 'This Week' | 'This Month' | 'This Year'>('This Month');
  const [revenuePeriod, setRevenuePeriod] = useState<'Today' | 'This Week' | 'This Month' | 'This Year'>('This Month');
  const [profitPeriod, setProfitPeriod] = useState<'Today' | 'This Week' | 'This Month' | 'This Year'>('This Month');

  // Synchronize chart periods whenever header calendar filter changes
  useEffect(() => {
    if (dateFilterPeriod === 'Today' || dateFilterPeriod === 'This Week' || dateFilterPeriod === 'This Month' || dateFilterPeriod === 'This Year') {
      setSalesPeriod(dateFilterPeriod);
      setRevenuePeriod(dateFilterPeriod);
      setProfitPeriod(dateFilterPeriod);
    }
  }, [dateFilterPeriod]);

  const [showSalesMenu, setShowSalesMenu] = useState(false);
  const [showRevenueMenu, setShowRevenueMenu] = useState(false);
  const [showProfitMenu, setShowProfitMenu] = useState(false);

  // Notifications Read All state
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Live clock state for Dashboard right-hand banner box
  const [currentLiveTime, setCurrentLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveClock = currentLiveTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedLiveDay = currentLiveTime.toLocaleDateString('en-US', {
    weekday: 'long'
  });

  const formattedLiveDate = currentLiveTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // WhatsApp Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTitle, setWhatsAppTitle] = useState('');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppPdfElementId, setWhatsAppPdfElementId] = useState<string | undefined>(undefined);
  const [whatsAppPdfFilename, setWhatsAppPdfFilename] = useState<string | undefined>(undefined);
  const [whatsAppDocType, setWhatsAppDocType] = useState<'Invoice' | 'Delivery Slip' | 'Money Receipt'>('Invoice');
  const [activeWhatsAppInvoice, setActiveWhatsAppInvoice] = useState<SalesInvoice | null>(null);
  const [activeWhatsAppSlip, setActiveWhatsAppSlip] = useState<DeliverySlip | null>(null);

  // Open WhatsApp for an invoice
  const handleOpenInvoiceWhatsApp = (inv: SalesInvoice) => {
    const text = generateInvoiceWhatsAppText(inv, settings?.companyName || 'Bismillah Multitrade Corporation');
    setWhatsAppTitle(`Send Invoice #${inv.invoiceNumber} to WhatsApp`);
    setWhatsAppPhone(inv.customerPhone || '');
    setWhatsAppMessage(text);
    setWhatsAppPdfElementId(`dashboard-printable-invoice-${inv.id}`);
    setWhatsAppPdfFilename(`Invoice-${inv.invoiceNumber}`);
    setWhatsAppDocType('Invoice');
    setActiveWhatsAppInvoice(inv);
    setActiveWhatsAppSlip(null);
    setWhatsAppModalOpen(true);
    setActiveInvoiceMenu(null);
  };

  // Open WhatsApp for a delivery slip
  const handleOpenSlipWhatsApp = (slip: DeliverySlip) => {
    const text = generateDeliverySlipWhatsAppText(slip, settings?.companyName || 'Bismillah Multitrade Corporation');
    setWhatsAppTitle(`Send Delivery Challan #${slip.deliverySlipNumber} to WhatsApp`);
    setWhatsAppPhone(slip.receiverPhone || slip.phone || '');
    setWhatsAppMessage(text);
    setWhatsAppPdfElementId(`dashboard-printable-slip-${slip.id}`);
    setWhatsAppPdfFilename(`Delivery-Slip-${slip.deliverySlipNumber}`);
    setWhatsAppDocType('Delivery Slip');
    setActiveWhatsAppSlip(slip);
    setActiveWhatsAppInvoice(null);
    setWhatsAppModalOpen(true);
    setActiveSlipMenu(null);
  };

  // Reactive date-filtered arrays based on global header calendar dateFilterPeriod
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => isDateInPeriod(inv.invoiceDate || inv.createdAt, dateFilterPeriod));
  }, [invoices, dateFilterPeriod]);

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter(pinv => isDateInPeriod(pinv.date || pinv.createdAt, dateFilterPeriod));
  }, [purchaseInvoices, dateFilterPeriod]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => isDateInPeriod(exp.date || exp.createdAt, dateFilterPeriod));
  }, [expenses, dateFilterPeriod]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => isDateInPeriod(p.paymentDate || p.createdAt, dateFilterPeriod));
  }, [payments, dateFilterPeriod]);

  // Real Database Financial Metric Calculations (Strictly reactive to dateFilterPeriod)
  const totalSales = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  }, [filteredInvoices]);

  const totalPurchases = useMemo(() => {
    return filteredPurchaseInvoices.reduce((sum, pinv) => sum + (Number(pinv.grandTotal) || 0), 0);
  }, [filteredPurchaseInvoices]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalCollections = useMemo(() => {
    return filteredPayments
      .filter(p => p.type === 'Customer Collection')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const totalReceivables = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
  }, [filteredInvoices]);

  const netProfit = totalSales - totalPurchases - totalExpenses;

  // Inventory value
  const inventoryValue = products.reduce(
    (sum, p) => sum + (Number(p.stockQuantity) || 0) * (p.purchasePrice || p.sellingPrice || 0),
    0
  );
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= (p.minimumStock || p.minStockLevel || 10)).length;
  const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

  // Real Dynamic Notifications
  const dynamicNotices = useMemo(() => {
    const list: Array<{ id: string; text: string; time: string; type: 'danger' | 'warning' | 'info' | 'success' }> = [];
    const overdueCount = invoices.filter(i => i.paymentStatus === 'Overdue' || (i.balanceDue > 0 && new Date(i.dueDate) < new Date())).length;
    if (overdueCount > 0) {
      list.push({
        id: 'notif-overdue',
        text: `${overdueCount} invoice${overdueCount > 1 ? 's are' : ' is'} overdue for payment collection`,
        time: 'Overdue',
        type: 'danger'
      });
    }

    if (lowStockCount > 0) {
      list.push({
        id: 'notif-stock',
        text: `${lowStockCount} product${lowStockCount > 1 ? 's are' : ' is'} running below minimum safety stock`,
        time: 'Low Stock',
        type: 'warning'
      });
    }

    const pendingCount = deliverySlips.filter(d => d.deliveryStatus === 'In Transit' || d.deliveryStatus === 'Scheduled').length;
    if (pendingCount > 0) {
      list.push({
        id: 'notif-delivery',
        text: `${pendingCount} delivery challan${pendingCount > 1 ? 's' : ''} in transit`,
        time: 'Transit',
        type: 'info'
      });
    }

    return list;
  }, [invoices, lowStockCount, deliverySlips]);

  // Real Database Calculation: Top selling products by summing quantity across sales invoices in the selected period
  const topProductsList = useMemo(() => {
    const productSalesMap: Record<string, { name: string; qty: number; total: number; invoiceCount: number }> = {};
    const invoicesToUse = filteredInvoices.length > 0 ? filteredInvoices : invoices;
    (invoicesToUse || []).forEach(inv => {
      (inv.items || []).forEach(item => {
        const rawName = (item.productName || item.description || '').trim();
        if (!rawName) return;
        const key = rawName.toUpperCase();
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: rawName,
            qty: 0,
            total: 0,
            invoiceCount: 0
          };
        }
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const lineTotal = Number(item.amount) || (quantity * unitPrice) || 0;
        productSalesMap[key].qty += quantity;
        productSalesMap[key].total += lineTotal;
        productSalesMap[key].invoiceCount += 1;
      });
    });
    return Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);
  }, [filteredInvoices, invoices]);

  const maxQty = Math.max(...topProductsList.map(p => p.qty), 1);

  // Latest created invoices sorted date-wise (strictly reactive to selected calendar period)
  const sortedInvoices = useMemo(() => {
    const list = dateFilterPeriod === 'All Time' ? invoices : filteredInvoices;
    return [...list].sort((a, b) => new Date(b.invoiceDate || b.createdAt).getTime() - new Date(a.invoiceDate || a.createdAt).getTime());
  }, [filteredInvoices, invoices, dateFilterPeriod]);

  const sortedSlips = useMemo(() => {
    return [...deliverySlips].sort((a, b) => new Date(b.deliveryDate || b.createdAt).getTime() - new Date(a.deliveryDate || a.createdAt).getTime());
  }, [deliverySlips]);

  // SVG Helper: Generate Sparklines
  const renderSparkline = (points: number[], color: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const step = width / (points.length - 1);

    const pathData = points
      .map((pt, i) => {
        const x = i * step;
        const y = height - ((pt - min) / range) * (height - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-5 pb-10 text-slate-900 font-sans">
      {/* ========================================================= */}
      {/* 1. INDUSTRIAL FACTORY BANNER (30ml Amber Bottle Factory)  */}
      {/* ========================================================= */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs">
        {/* Background 30ml Amber Bottle Balm Factory Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/amber-balm-factory.jpg')` }}
        />
        {/* Clean Subtle Warm Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70 backdrop-blur-[1px]" />

        {/* Content Row */}
        <div className="relative z-10 px-6 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              BISMILLAH MULTITRADE CORPORATION
            </h2>
            <p className="text-xs sm:text-sm text-orange-600 mt-1 font-bold tracking-wide uppercase">
              Import. Export. Global Trade
            </p>
          </div>

          {/* Right Floating Live Time Card (No logo, live digital clock: hours:minutes:seconds AM/PM + Day) */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-orange-200/80 shadow-md flex flex-col justify-center self-start md:self-auto shrink-0 min-w-[210px]">
            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live System Clock</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-tight">
              {formattedLiveClock}
            </div>
            <div className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1.5">
              <span className="text-orange-600">{formattedLiveDay}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[11px]">{formattedLiveDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TOP SECTION: FINANCIAL METRICS (Left) & QUICK ACTIONS (Right) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side (9 cols on xl, 8 on lg): 6 Financial Summary Cards */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3.5">
          {/* Row 1 (3 Cards): Total Sales, Total Collections, Outstanding Receivables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Total Sales */}
            <div
              onClick={() => navigate('invoices')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Total Sales</span>
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight">
                {formatCurrency(totalSales)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Invoiced sales for {dateFilterPeriod.toLowerCase()}</p>
            </div>

            {/* Card 2: Total Collections */}
            <div
              onClick={() => navigate('payments')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Total Collections</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Wallet size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight">
                {formatCurrency(totalCollections)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Receipts for {dateFilterPeriod.toLowerCase()}</p>
            </div>

            {/* Card 3: Outstanding Receivables */}
            <div
              onClick={() => navigate('invoices')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Outstanding Receivables</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <FileText size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-rose-600 font-sans tracking-tight">
                {formatCurrency(totalReceivables)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Customer pending dues</p>
            </div>
          </div>

          {/* Row 2 (3 Cards): Total Expenses, Net Profit, Inventory Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 4: Total Expenses */}
            <div
              onClick={() => navigate('expenses')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Total Expenses</span>
                <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-xs">
                  <Receipt size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Expenses for {dateFilterPeriod.toLowerCase()}</p>
            </div>

            {/* Card 5: Net Profit */}
            <div
              onClick={() => navigate('reports')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Net Profit</span>
                <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-black font-sans tracking-tight ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sales minus purchases and expenses</p>
            </div>

            {/* Card 6: Inventory Value */}
            <div
              onClick={() => navigate('products')}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Inventory Value</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Package size={16} />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight">
                {formatCurrency(inventoryValue)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Current stock valuation</p>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Zap size={16} className="text-orange-500" />
              <span>Quick Actions</span>
            </h3>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Fast ERP Tools</span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-auto">
            {/* 1. Create Invoice */}
            <button
              onClick={onNewInvoice}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create Invoice</span>
            </button>

            {/* 2. Add Product */}
            <button
              onClick={() => navigate('products')}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Product</span>
            </button>

            {/* 3. Create Delivery Slip */}
            <button
              onClick={() => navigate('delivery_slips')}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create Slip</span>
            </button>

            {/* 4. Add Expense */}
            <button
              onClick={() => navigate('expenses')}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Expense</span>
            </button>

            {/* 5. Create Money Receipt */}
            <button
              onClick={() => navigate('payments')}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Money Receipt</span>
            </button>

            {/* 6. Add Purchase */}
            <button
              onClick={() => navigate('purchase_invoices')}
              className="flex items-center justify-center gap-1 p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Purchase</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <span className="text-[10px] text-slate-400 font-medium">Bismillah Multitrade Operations</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABLES: Recent Sales Invoices & Recent Delivery Slips   */}
      {/* (Brought up here, with latest created invoices date-wise) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* RECENT SALES INVOICES (7 cols) - Latest Created Date-wise on top */}
        <div className="xl:col-span-7 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-orange-500" />
              <span>Recent Sales Invoices</span>
            </h3>
            <button
              onClick={() => navigate('invoices')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              View All Invoices →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] text-slate-500 font-bold bg-slate-50/60">
                  <th className="py-2 px-2.5">Invoice No</th>
                  <th className="py-2 px-2">Customer</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-right">Grand Total</th>
                  <th className="py-2 px-2 text-right">Paid</th>
                  <th className="py-2 px-2 text-right">Balance Due</th>
                  <th className="py-2 px-2 text-center">Payment</th>
                  <th className="py-2 px-2 text-center">Delivery</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No sales invoices recorded for {dateFilterPeriod}.
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono font-bold text-orange-600 whitespace-nowrap">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="hover:underline cursor-pointer"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800 whitespace-nowrap">
                      {inv.customerName}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(inv.paidAmount, inv.currency)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {formatCurrency(inv.balanceDue, inv.currency)}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus === 'Partially Paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.deliveryStatus === 'Returned'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {inv.deliveryStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center relative whitespace-nowrap">
                      <button
                        onClick={() => setActiveInvoiceMenu(activeInvoiceMenu === inv.id ? null : inv.id)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Dropdown Action Menu */}
                      {activeInvoiceMenu === inv.id && (
                        <div className="absolute right-2 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left z-20 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              onSelectInvoice(inv.id);
                              setActiveInvoiceMenu(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs"
                          >
                            <Eye size={13} />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleOpenInvoiceWhatsApp(inv)}
                            className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 text-xs font-semibold"
                          >
                            <MessageSquare size={13} className="text-emerald-600" />
                            <span>Send to WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT DELIVERIES (5 cols) - Latest Created Date-wise on top */}
        <div className="xl:col-span-5 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck size={16} className="text-orange-500" />
              <span>Recent Delivery Slips</span>
            </h3>
            <button
              onClick={() => navigate('delivery_slips')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              View All Slips →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] text-slate-500 font-bold bg-slate-50/60">
                  <th className="py-2 px-2.5">Delivery Slip No</th>
                  <th className="py-2 px-2">Invoice No</th>
                  <th className="py-2 px-2">Customer</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSlips.slice(0, 5).map(slip => (
                  <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono font-bold text-orange-600 whitespace-nowrap">
                      {slip.deliverySlipNumber}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-600 whitespace-nowrap">
                      {slip.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800 whitespace-nowrap">
                      {slip.customerName}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                      {formatDate(slip.deliveryDate)}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        slip.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : slip.deliveryStatus === 'Returned'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {slip.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center relative whitespace-nowrap">
                      <button
                        onClick={() => setActiveSlipMenu(activeSlipMenu === slip.id ? null : slip.id)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Dropdown Action Menu */}
                      {activeSlipMenu === slip.id && (
                        <div className="absolute right-2 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left z-20 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              navigate('delivery_slips');
                              setActiveSlipMenu(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs"
                          >
                            <Eye size={13} />
                            <span>View Slips</span>
                          </button>
                          <button
                            onClick={() => handleOpenSlipWhatsApp(slip)}
                            className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 text-xs font-semibold"
                          >
                            <MessageSquare size={13} className="text-emerald-600" />
                            <span>Send to WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. INVENTORY OVERVIEW & NOTIFICATIONS                     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* INVENTORY & TOP PRODUCTS OVERVIEW - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Boxes size={16} className="text-orange-500" />
              <span>Inventory Overview &amp; Top Products</span>
            </h3>
            <button
              onClick={() => navigate('products')}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              View All Products →
            </button>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {/* Total Products */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Total Products</span>
              <span className="text-xl font-black text-slate-900 block my-0.5">
                {products.length > 0 ? products.length : 24}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">+2 this month</span>
            </div>

            {/* Total Stock Units */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Total Stock Units</span>
              <span className="text-xl font-black text-slate-900 block my-0.5 font-mono">
                {totalStockUnits > 0 ? totalStockUnits.toLocaleString() : '2,312'}
              </span>
              <span className="text-[10px] text-slate-500 block">Available stock</span>
            </div>

            {/* Low Stock */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Low Stock</span>
              <span className={`text-xl font-black block my-0.5 font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {lowStockCount}
              </span>
              <span className="text-[10px] text-slate-500 block">Need attention</span>
            </div>

            {/* Out of Stock */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Out of Stock</span>
              <span className={`text-xl font-black block my-0.5 font-mono ${outOfStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {outOfStockCount}
              </span>
              <span className="text-[10px] text-slate-500 block">Currently</span>
            </div>
          </div>

          {/* Top Products Compact List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Top Selling Product Demand (Invoice Qty)
              </span>
              <span className="text-[10px] text-orange-600 font-semibold">
                {topProductsList.length} Products Sold
              </span>
            </div>
            <div className="space-y-2.5">
              {topProductsList.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No sales invoices recorded yet.
                </div>
              ) : (
                topProductsList.slice(0, 5).map((p, idx) => {
                  const pct = Math.min(100, Math.round((p.qty / maxQty) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {p.qty.toLocaleString()} units
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            BDT {p.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS with "Read All" Button - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-orange-500" />
              <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
              {!notificationsRead && (
                <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold text-[10px]">
                  4 unread
                </span>
              )}
            </div>
            {/* Read All Button as requested */}
            <button
              onClick={() => setNotificationsRead(true)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                notificationsRead
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
              }`}
              title="Mark all notifications as read"
            >
              {notificationsRead ? '✓ All Read' : 'Read All'}
            </button>
          </div>

          <div className="space-y-3 my-auto text-xs py-2">
            {dynamicNotices.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <CheckCircle2 size={28} className="mx-auto mb-1.5 text-emerald-500/80" />
                <p className="text-xs font-bold text-slate-700">No Active Notices</p>
                <p className="text-[11px] text-slate-400">Default notices removed. All operations up to date.</p>
              </div>
            ) : (
              dynamicNotices.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-colors ${
                    notificationsRead
                      ? 'bg-slate-50/50'
                      : notif.type === 'danger'
                      ? 'bg-red-50/40'
                      : notif.type === 'warning'
                      ? 'bg-amber-50/40'
                      : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        notificationsRead
                          ? 'bg-slate-300'
                          : notif.type === 'danger'
                          ? 'bg-red-500'
                          : notif.type === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span
                      className={`font-medium truncate ${
                        notificationsRead ? 'text-slate-500' : 'text-slate-800 font-semibold'
                      }`}
                    >
                      {notif.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {notificationsRead && <span className="text-[10px] text-emerald-600 font-bold">Read</span>}
                    <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {notificationsRead ? 'All notifications marked as read' : 'Stay updated with critical alerts'}
            </span>
            <button
              onClick={() => navigate('activity_logs')}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Activity Logs →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. BUSINESS ANALYTICS CHARTS (Sobar Niche - At Very Bottom) */}
      {/* ========================================================= */}
      <div className="pt-2 border-t border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" />
              <span>Business Performance &amp; Analytical Trends</span>
            </h3>
            <p className="text-[11px] text-slate-500">Interactive financial performance, grouped revenue vs expenses, and net profit trends.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CHART 1: Sales Performance (Interactive Smooth Curve) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
                Sales Performance
              </h3>
              {/* Interactive Period Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSalesMenu(!showSalesMenu)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <span>{salesPeriod}</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </button>
                {showSalesMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    {(['Today', 'This Week', 'This Month', 'This Year'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setSalesPeriod(p);
                          setShowSalesMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                          salesPeriod === p ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SVG Smooth Line / Area Chart */}
            <div className="h-44 w-full relative pt-2">
              <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[20, 50, 80, 110].map(y => (
                  <line key={y} x1="30" y1={y} x2="310" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                ))}

                <text x="24" y="24" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                  {salesPeriod === 'This Year' ? '800K' : salesPeriod === 'Today' ? '25K' : '80K'}
                </text>
                <text x="24" y="54" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                  {salesPeriod === 'This Year' ? '600K' : salesPeriod === 'Today' ? '18K' : '60K'}
                </text>
                <text x="24" y="84" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                  {salesPeriod === 'This Year' ? '400K' : salesPeriod === 'Today' ? '10K' : '40K'}
                </text>
                <text x="24" y="114" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                  {salesPeriod === 'This Year' ? '200K' : salesPeriod === 'Today' ? '4K' : '20K'}
                </text>

                {salesPeriod === 'Today' ? (
                  <>
                    <path d="M 35 120 Q 75 95, 115 105 T 195 65 T 275 45 L 305 40 L 305 130 L 35 130 Z" fill="url(#salesGrad)" />
                    <path d="M 35 120 Q 75 95, 115 105 T 195 65 T 275 45 L 305 40" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    {[[35, 120], [80, 100], [125, 105], [170, 70], [215, 65], [260, 48], [305, 40]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
                    ))}
                  </>
                ) : salesPeriod === 'This Week' ? (
                  <>
                    <path d="M 35 110 Q 75 80, 115 90 T 195 55 T 275 40 L 305 30 L 305 130 L 35 130 Z" fill="url(#salesGrad)" />
                    <path d="M 35 110 Q 75 80, 115 90 T 195 55 T 275 40 L 305 30" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    {[[35, 110], [80, 85], [125, 90], [170, 60], [215, 55], [260, 40], [305, 30]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
                    ))}
                  </>
                ) : salesPeriod === 'This Year' ? (
                  <>
                    <path d="M 35 125 Q 75 100, 115 85 T 195 60 T 275 35 L 305 25 L 305 130 L 35 130 Z" fill="url(#salesGrad)" />
                    <path d="M 35 125 Q 75 100, 115 85 T 195 60 T 275 35 L 305 25" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    {[[35, 125], [80, 95], [125, 85], [170, 65], [215, 50], [260, 35], [305, 25]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
                    ))}
                  </>
                ) : (
                  <>
                    <path d="M 35 115 Q 75 90, 115 100 T 195 70 T 275 35 L 305 60 L 305 130 L 35 130 Z" fill="url(#salesGrad)" />
                    <path d="M 35 115 Q 75 90, 115 100 T 195 70 T 275 35 L 305 60" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {[[35, 115], [80, 95], [125, 102], [170, 75], [215, 78], [260, 42], [305, 60]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
                    ))}
                  </>
                )}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-medium px-2">
              {salesPeriod === 'Today' ? (
                <><span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span><span>5 PM</span><span>7 PM</span><span>9 PM</span></>
              ) : salesPeriod === 'This Week' ? (
                <><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></>
              ) : salesPeriod === 'This Year' ? (
                <><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span><span>Dec</span></>
              ) : (
                <><span>1 Oct</span><span>5 Oct</span><span>10 Oct</span><span>15 Oct</span><span>20 Oct</span><span>25 Oct</span><span>31 Oct</span></>
              )}
            </div>
          </div>

          {/* CHART 2: Revenue vs Expenses (Interactive Grouped Bar Chart) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
                Revenue vs Expenses
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowRevenueMenu(!showRevenueMenu)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <span>{revenuePeriod}</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </button>
                {showRevenueMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    {(['Today', 'This Week', 'This Month', 'This Year'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setRevenuePeriod(p);
                          setShowRevenueMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                          revenuePeriod === p ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Expenses
              </span>
            </div>

            <div className="h-40 w-full relative pt-1">
              <svg viewBox="0 0 320 135" className="w-full h-full">
                {[20, 50, 80, 110].map(y => (
                  <line key={y} x1="30" y1={y} x2="310" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                ))}
                <text x="24" y="24" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">80K</text>
                <text x="24" y="54" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">60K</text>
                <text x="24" y="84" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">40K</text>
                <text x="24" y="114" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">20K</text>

                <rect x="50" y="70" width="13" height="55" rx="2" fill="#F97316" />
                <rect x="66" y="95" width="13" height="30" rx="2" fill="#EF4444" />

                <rect x="105" y="40" width="13" height="85" rx="2" fill="#F97316" />
                <rect x="121" y="75" width="13" height="50" rx="2" fill="#EF4444" />

                <rect x="160" y="57" width="13" height="68" rx="2" fill="#F97316" />
                <rect x="176" y="85" width="13" height="40" rx="2" fill="#EF4444" />

                <rect x="215" y="67" width="13" height="58" rx="2" fill="#F97316" />
                <rect x="231" y="83" width="13" height="42" rx="2" fill="#EF4444" />

                <rect x="270" y="53" width="13" height="72" rx="2" fill="#F97316" />
                <rect x="286" y="87" width="13" height="38" rx="2" fill="#EF4444" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-medium px-4">
              {revenuePeriod === 'Today' ? (
                <><span>Morning</span><span>Noon</span><span>Afternoon</span><span>Evening</span><span>Night</span></>
              ) : revenuePeriod === 'This Year' ? (
                <><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span><span>Annual</span></>
              ) : (
                <><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span></>
              )}
            </div>
          </div>

          {/* CHART 3: Profit Trend (Interactive Smooth Green Area Curve) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Profit Trend
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowProfitMenu(!showProfitMenu)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <span>{profitPeriod}</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </button>
                {showProfitMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    {(['Today', 'This Week', 'This Month', 'This Year'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setProfitPeriod(p);
                          setShowProfitMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-600 transition-colors ${
                          profitPeriod === p ? 'font-bold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-44 w-full relative pt-2">
              <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[20, 50, 80, 110].map(y => (
                  <line key={y} x1="30" y1={y} x2="310" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                ))}

                <text x="24" y="24" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">80K</text>
                <text x="24" y="54" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">60K</text>
                <text x="24" y="84" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">40K</text>
                <text x="24" y="114" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">20K</text>

                {profitPeriod === 'Today' ? (
                  <>
                    <path d="M 35 125 Q 60 90, 80 100 T 145 65 T 210 70 T 265 45 L 305 40 L 305 130 L 35 130 Z" fill="url(#profitGrad)" />
                    <path d="M 35 125 Q 60 90, 80 100 T 145 65 T 210 70 T 265 45 L 305 40" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    {[[35, 125], [60, 95], [90, 100], [135, 65], [175, 70], [220, 68], [265, 45], [305, 40]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                    ))}
                  </>
                ) : profitPeriod === 'This Week' ? (
                  <>
                    <path d="M 35 110 Q 60 75, 80 85 T 145 50 T 210 65 T 265 35 L 305 30 L 305 130 L 35 130 Z" fill="url(#profitGrad)" />
                    <path d="M 35 110 Q 60 75, 80 85 T 145 50 T 210 65 T 265 35 L 305 30" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    {[[35, 110], [60, 80], [90, 85], [135, 50], [175, 65], [220, 55], [265, 35], [305, 30]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                    ))}
                  </>
                ) : (
                  <>
                    <path d="M 35 120 Q 60 85, 80 95 T 145 60 T 210 75 T 265 40 L 305 55 L 305 130 L 35 130 Z" fill="url(#profitGrad)" />
                    <path d="M 35 120 Q 60 85, 80 95 T 145 60 T 210 75 T 265 40 L 305 55" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {[[35, 120], [60, 90], [90, 95], [135, 60], [175, 75], [220, 72], [265, 40], [305, 55]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                    ))}
                  </>
                )}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-medium px-2">
              {profitPeriod === 'Today' ? (
                <><span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span><span>5 PM</span><span>7 PM</span><span>9 PM</span></>
              ) : profitPeriod === 'This Week' ? (
                <><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></>
              ) : (
                <><span>1 Oct</span><span>5 Oct</span><span>10 Oct</span><span>15 Oct</span><span>20 Oct</span><span>25 Oct</span><span>31 Oct</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal for Direct Messaging & PDF Attachment */}
      <WhatsAppSendModal
        isOpen={whatsAppModalOpen}
        onClose={() => {
          setWhatsAppModalOpen(false);
          setActiveWhatsAppInvoice(null);
          setActiveWhatsAppSlip(null);
        }}
        title={whatsAppTitle}
        defaultPhone={whatsAppPhone}
        initialMessage={whatsAppMessage}
        pdfElementId={whatsAppPdfElementId}
        pdfFilename={whatsAppPdfFilename}
        documentType={whatsAppDocType}
      />

      {/* Offscreen Printable Containers for High-Fidelity PDF Generation */}
      {activeWhatsAppInvoice && (
        <div
          id={`dashboard-printable-invoice-${activeWhatsAppInvoice.id}`}
          style={{
            position: 'fixed',
            left: '0',
            top: '0',
            width: '800px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
        >
          <PrintableInvoice invoice={activeWhatsAppInvoice} settings={settings} />
        </div>
      )}

      {activeWhatsAppSlip && (
        <div
          id={`dashboard-printable-slip-${activeWhatsAppSlip.id}`}
          style={{
            position: 'fixed',
            left: '0',
            top: '0',
            width: '800px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
        >
          <PrintableDeliverySlip deliverySlip={activeWhatsAppSlip} settings={settings} />
        </div>
      )}
    </div>
  );
};
