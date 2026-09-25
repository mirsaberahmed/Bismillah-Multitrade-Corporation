import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Truck,
  FileSpreadsheet,
  ShoppingCart,
  Package,
  Users,
  Building2,
  Ship,
  FileCheck,
  CreditCard,
  Receipt,
  BarChart3,
  Upload,
  Download,
  Database,
  History,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Compass,
  AlertCircle,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';

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
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  mobileMenuOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onCloseMobile?: () => void;
  onNewInvoice?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  mobileOpen,
  mobileMenuOpen,
  setMobileOpen,
  onCloseMobile,
  onNewInvoice
}) => {
  const isMobileOpen = mobileOpen || mobileMenuOpen || false;
  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
    if (onCloseMobile) onCloseMobile();
  };
  const selectTab = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
    closeMobile();
  };

  const { products, invoices, deliverySlips } = useData();
  
  // Calculate badges
  const lowStockCount = products.filter(p => p.stockQuantity <= (p.minimumStock || p.minStockLevel || 10)).length;
  const unpaidInvoices = invoices.filter(i => i.paymentStatus === 'Unpaid' || i.paymentStatus === 'Overdue').length;
  const pendingDeliveries = deliverySlips.filter(d => d.deliveryStatus !== 'Delivered' && d.deliveryStatus !== 'Cancelled').length;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    sales: true,
    purchase: true,
    contacts: true,
    inventory: true,
    trade: true,
    finance: true,
    system: true
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navItem = (tab: ActiveTab, label: string, icon: React.ReactNode, badge?: number | string, badgeColor?: string) => {
    const isActive = activeTab === tab;
    const hasBadge = badge !== undefined && (typeof badge === 'number' ? badge > 0 : Boolean(badge));
    return (
      <button
        key={tab}
        onClick={() => selectTab(tab)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
          isActive
            ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-amber-400'}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {hasBadge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              isActive
                ? 'bg-zinc-950 text-amber-400'
                : badgeColor || 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const navGroup = (title: string, groupKey: string, children: React.ReactNode) => {
    const isExpanded = expandedGroups[groupKey] ?? true;
    return (
      <div className="mb-3">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:text-zinc-100 mb-1"
        >
          <span>{title}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isExpanded && <div className="space-y-0.5">{children}</div>}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for Toggle Menu (Hidden by default, shown when menu is clicked) */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer (Hidden by default with -translate-x-full, slides in when toggle clicked) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Brand Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-base shadow-sm">
              B
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase text-zinc-100 tracking-tight leading-tight truncate">
                Bismillah Multitrade
              </h2>
              <p className="text-[10px] text-amber-400/90 font-medium truncate">
                ERP &amp; Trade Management
              </p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors"
            title="Close Menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick New Invoice Action Button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => {
              if (onNewInvoice) onNewInvoice();
              closeMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Create New Invoice</span>
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          {/* Dashboard */}
          <div className="mb-3">
            {navItem('dashboard', 'Dashboard', <LayoutDashboard size={16} />)}
          </div>

          {/* Sales & Billing */}
          {navGroup(
            'Sales & Billing',
            'sales',
            <>
              {navItem('invoices', 'Sales Invoices', <FileText size={16} />, unpaidInvoices, 'bg-amber-500/20 text-amber-400')}
              {navItem('delivery_slips', 'Delivery Slips', <Truck size={16} />, pendingDeliveries, 'bg-blue-500/20 text-blue-400')}
              {navItem('delivery_challans', 'Delivery Challans', <FileSpreadsheet size={16} />)}
              {navItem('quotations', 'Quotations', <FileCheck size={16} />)}
              {navItem('sales_orders', 'Sales Orders', <ShoppingCart size={16} />)}
            </>
          )}

          {/* Purchase & Procurement */}
          {navGroup(
            'Procurement',
            'purchase',
            <>
              {navItem('purchase_invoices', 'Purchase Invoices', <Receipt size={16} />)}
              {navItem('purchase_orders', 'Purchase Orders', <ShoppingCart size={16} />)}
              {navItem('suppliers', 'Suppliers', <Building2 size={16} />)}
            </>
          )}

          {/* Customers */}
          {navGroup(
            'Customer Relations',
            'contacts',
            <>
              {navItem('customers', 'Customer Directory', <Users size={16} />)}
            </>
          )}

          {/* Inventory */}
          {navGroup(
            'Inventory & Stock',
            'inventory',
            <>
              {navItem('products', 'Product Catalog', <Package size={16} />, lowStockCount > 0 ? `${lowStockCount} Low` : undefined, 'bg-red-500/20 text-red-400')}
              {navItem('categories', 'Categories', <Compass size={16} />)}
              {navItem('inventory_movements', 'Stock Movements', <History size={16} />)}
            </>
          )}

          {/* Import & Export Concern */}
          {navGroup(
            'Import & Export',
            'trade',
            <>
              {navItem('import_records', 'Import & Landed Cost', <Ship size={16} />)}
              {navItem('export_records', 'Export Records', <Ship size={16} />)}
              {navItem('proforma_invoices', 'Proforma Invoices (PI)', <FileText size={16} />)}
              {navItem('commercial_invoices', 'Commercial Invoices (CI)', <FileCheck size={16} />)}
              {navItem('lc_management', 'LC Management', <ShieldCheck size={16} />)}
              {navItem('shipments', 'Shipment Tracking', <Truck size={16} />)}
            </>
          )}

          {/* Finance & Accounts */}
          {navGroup(
            'Finance & Accounts',
            'finance',
            <>
              {navItem('payments', 'Money Receipts & Pay', <CreditCard size={16} />)}
              {navItem('expenses', 'Operating Expenses', <Receipt size={16} />)}
              {navItem('reports', 'Business Reports', <BarChart3 size={16} />)}
            </>
          )}

          {/* Data & System Settings */}
          {navGroup(
            'System & Data',
            'system',
            <>
              {navItem('data_import', 'Import Data (Excel/CSV)', <Upload size={16} />)}
              {navItem('data_export', 'Export Data', <Download size={16} />)}
              {navItem('backup_restore', 'Backup & Restore', <Database size={16} />)}
              {navItem('activity_logs', 'Activity Logs', <History size={16} />)}
              {navItem('settings', 'Company Settings', <Settings size={16} />)}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 text-[10px] text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">Mirpur, Dhaka-1216</span>
            <span className="text-amber-400 font-mono font-bold">BDT (৳)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
