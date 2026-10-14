import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Building2,
  CreditCard,
  Receipt,
  FileCheck,
  BarChart3,
  Truck,
  Boxes,
  PieChart,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  ChevronLeft,
  Activity,
  Globe,
  Database
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { BalmBottleLogo } from '../common/BalmBottleLogo';

export type ActiveTab =
  | 'dashboard'
  | 'invoices'
  | 'create_invoice'
  | 'delivery_slips'
  | 'quotations'
  | 'sales_orders'
  | 'delivery_challans'
  | 'purchase_invoices'
  | 'purchase_orders'
  | 'suppliers'
  | 'customers'
  | 'products'
  | 'categories'
  | 'inventory_movements'
  | 'import_records'
  | 'export_records'
  | 'proforma_invoices'
  | 'commercial_invoices'
  | 'lc_management'
  | 'shipments'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'data_import'
  | 'data_export'
  | 'backup_restore'
  | 'activity_logs'
  | 'user_management'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  isOpen?: boolean;
  mobileOpen?: boolean;
  mobileMenuOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onNewInvoice?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  isOpen,
  mobileOpen,
  mobileMenuOpen,
  setMobileOpen,
  onClose,
  onCloseMobile,
  onLogout
}) => {
  const isMenuOpen = isOpen ?? (mobileOpen || mobileMenuOpen || false);
  const [collapsed] = useState(false);

  const closeMenu = () => {
    if (onClose) onClose();
    if (setMobileOpen) setMobileOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const selectTab = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
    closeMenu();
  };

  const { invoices, deliverySlips, currentUser } = useData();
  const unpaidCount = invoices.filter(i => i.paymentStatus === 'Unpaid' || i.paymentStatus === 'Overdue').length;
  const pendingDeliveries = deliverySlips.filter(d => d.deliveryStatus !== 'Delivered' && d.deliveryStatus !== 'Cancelled').length;

  // Submenu states
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenu(prev => (prev === key ? null : key));
  };

  return (
    <>
      {/* Universal Backdrop (Closes sidebar on click outside) */}
      {isMenuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300 print:hidden"
        />
      )}

      {/* Main Sidebar Drawer - Starts CLOSED by default on initial app open, opens when Menu is clicked */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#F8F9FA] border-r border-slate-200/90 text-slate-800 shadow-2xl transition-transform duration-300 ease-in-out print:hidden w-[260px] ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo Section */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/90 bg-white/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Amber Balm Bottle Logo */}
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-xs">
              <BalmBottleLogo size={26} className="shrink-0 drop-shadow-xs" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-[13px] font-black tracking-wider text-slate-900 uppercase leading-tight truncate font-sans">
                  BISMILLAH
                </h1>
                <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase leading-tight truncate">
                  MULTITRADE CORP
                </p>
              </div>
            )}
          </div>

          {/* Close button (Active on all screen sizes) */}
          <button
            onClick={closeMenu}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
          {/* 1. MAIN MENU */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                MAIN MENU
              </p>
            )}
            <div className="space-y-1">
              {/* Dashboard Item */}
              <button
                onClick={() => selectTab('dashboard')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Dashboard"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard size={16} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Dashboard</span>}
                </div>
              </button>

              {/* Sales & Invoices Submenu */}
              <div>
                <button
                  onClick={() => {
                    selectTab('invoices');
                    toggleSubmenu('sales');
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === 'invoices' || activeTab === 'quotations' || activeTab === 'sales_orders'
                      ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                  title="Sales & Invoices"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className={activeTab === 'invoices' || activeTab === 'quotations' || activeTab === 'sales_orders' ? 'text-white' : 'text-slate-500'} />
                    {!collapsed && <span className="truncate">Sales &amp; Invoices</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      size={14}
                      className={`text-slate-400 transition-transform ${openSubmenu === 'sales' ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                {!collapsed && openSubmenu === 'sales' && (
                  <div className="pl-8 pr-2 py-1 space-y-1 text-[11px]">
                    <button
                      onClick={() => selectTab('invoices')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'invoices' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      All Sales Invoices
                    </button>
                    <button
                      onClick={() => selectTab('quotations')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'quotations' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Price Quotations
                    </button>
                    <button
                      onClick={() => selectTab('sales_orders')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'sales_orders' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Sales Orders
                    </button>
                  </div>
                )}
              </div>

              {/* Purchases Submenu */}
              <div>
                <button
                  onClick={() => {
                    selectTab('purchase_invoices');
                    toggleSubmenu('purchases');
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === 'purchase_invoices' || activeTab === 'purchase_orders'
                      ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                  title="Purchases"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShoppingCart size={16} className={activeTab === 'purchase_invoices' || activeTab === 'purchase_orders' ? 'text-white' : 'text-slate-500'} />
                    {!collapsed && <span className="truncate">Purchases</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      size={14}
                      className={`text-slate-400 transition-transform ${openSubmenu === 'purchases' ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                {!collapsed && openSubmenu === 'purchases' && (
                  <div className="pl-8 pr-2 py-1 space-y-1 text-[11px]">
                    <button
                      onClick={() => selectTab('purchase_invoices')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'purchase_invoices' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Purchase Invoices
                    </button>
                    <button
                      onClick={() => selectTab('purchase_orders')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'purchase_orders' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Purchase Orders (PO)
                    </button>
                  </div>
                )}
              </div>

              {/* Inventory Submenu */}
              <div>
                <button
                  onClick={() => {
                    selectTab('products');
                    toggleSubmenu('inventory');
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === 'products' || activeTab === 'categories' || activeTab === 'inventory_movements'
                      ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                  title="Inventory"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Package size={16} className={activeTab === 'products' || activeTab === 'categories' || activeTab === 'inventory_movements' ? 'text-white' : 'text-slate-500'} />
                    {!collapsed && <span className="truncate">Inventory</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      size={14}
                      className={`text-slate-400 transition-transform ${openSubmenu === 'inventory' ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                {!collapsed && openSubmenu === 'inventory' && (
                  <div className="pl-8 pr-2 py-1 space-y-1 text-[11px]">
                    <button
                      onClick={() => selectTab('products')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'products' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Product Master
                    </button>
                    <button
                      onClick={() => selectTab('categories')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'categories' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Item Categories
                    </button>
                    <button
                      onClick={() => selectTab('inventory_movements')}
                      className={`block w-full text-left py-1 px-2 rounded ${activeTab === 'inventory_movements' ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                      Stock Movements
                    </button>
                  </div>
                )}
              </div>

              {/* Customers */}
              <button
                onClick={() => selectTab('customers')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Customers"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users size={16} className={activeTab === 'customers' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Customers</span>}
                </div>
              </button>

              {/* Suppliers */}
              <button
                onClick={() => selectTab('suppliers')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'suppliers'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Suppliers"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 size={16} className={activeTab === 'suppliers' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Suppliers</span>}
                </div>
              </button>
            </div>
          </div>

          {/* 2. FINANCE */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                FINANCE
              </p>
            )}
            <div className="space-y-1">
              {/* Money Receipts */}
              <button
                onClick={() => selectTab('payments')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Money Receipts"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CreditCard size={16} className={activeTab === 'payments' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Money Receipts</span>}
                </div>
              </button>

              {/* Expenses */}
              <button
                onClick={() => selectTab('expenses')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Expenses"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Receipt size={16} className={activeTab === 'expenses' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Expenses</span>}
                </div>
              </button>

              {/* Customer Receivables */}
              <button
                onClick={() => selectTab('invoices')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Customer Receivables"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCheck size={16} className="text-slate-500" />
                  {!collapsed && <span className="truncate">Customer Receivables</span>}
                </div>
                {!collapsed && unpaidCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-mono text-[10px] font-bold">
                    {unpaidCount}
                  </span>
                )}
              </button>

              {/* Supplier Payables */}
              <button
                onClick={() => selectTab('suppliers')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Supplier Payables"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 size={16} className="text-slate-500" />
                  {!collapsed && <span className="truncate">Supplier Payables</span>}
                </div>
              </button>

              {/* Accounting & Reports */}
              <button
                onClick={() => selectTab('reports')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Accounting & Reports"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BarChart3 size={16} className={activeTab === 'reports' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Accounting &amp; Reports</span>}
                </div>
              </button>
            </div>
          </div>

          {/* 3. OPERATIONS & TRADE */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                OPERATIONS &amp; TRADE
              </p>
            )}
            <div className="space-y-1">
              {/* Delivery Management */}
              <button
                onClick={() => selectTab('delivery_slips')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'delivery_slips' || activeTab === 'delivery_challans'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Delivery Management"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Truck size={16} className={activeTab === 'delivery_slips' || activeTab === 'delivery_challans' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Delivery Slips &amp; Challans</span>}
                </div>
                {!collapsed && pendingDeliveries > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                    {pendingDeliveries}
                  </span>
                )}
              </button>

              {/* Import & Export Operations */}
              <button
                onClick={() => selectTab('import_records')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'import_records' || activeTab === 'export_records' || activeTab === 'proforma_invoices' || activeTab === 'commercial_invoices' || activeTab === 'lc_management' || activeTab === 'shipments'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Import & Export Concern"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe size={16} className={activeTab === 'import_records' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Import-Export &amp; LC</span>}
                </div>
              </button>
            </div>
          </div>

          {/* 4. SYSTEM & ADMINISTRATION */}
          <div>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                SYSTEM
              </p>
            )}
            <div className="space-y-1">
              {/* Settings */}
              <button
                onClick={() => selectTab('settings')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Company Settings"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Settings size={16} className={activeTab === 'settings' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Company Settings</span>}
                </div>
              </button>

              {/* User Management */}
              <button
                onClick={() => selectTab('user_management')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'user_management'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="User Management"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck size={16} className={activeTab === 'user_management' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">User Management</span>}
                </div>
              </button>

              {/* Audit & Activity Logs */}
              <button
                onClick={() => selectTab('activity_logs')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'activity_logs'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Activity & Audit Logs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Activity size={16} className={activeTab === 'activity_logs' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Audit &amp; Activity Logs</span>}
                </div>
              </button>

              {/* Data Backup & Restore */}
              <button
                onClick={() => selectTab('backup_restore')}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'backup_restore' || activeTab === 'data_import' || activeTab === 'data_export'
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Backup & Restore"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Database size={16} className={activeTab === 'backup_restore' ? 'text-white' : 'text-slate-500'} />
                  {!collapsed && <span className="truncate">Backup &amp; Restore</span>}
                </div>
              </button>

              {/* Logout */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LogOut size={16} className="text-rose-600" />
                    {!collapsed && <span className="truncate">Sign Out</span>}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Current User Card */}
        {!collapsed && currentUser && (
          <div className="p-3 border-t border-slate-200/90 bg-white shrink-0">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-orange-600 font-semibold truncate leading-tight">
                    {currentUser.role || 'Super Admin'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
