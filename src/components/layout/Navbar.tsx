import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  User,
  Shield,
  Clock,
  AlertTriangle,
  Truck,
  CheckCircle2,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ActiveTab } from './Sidebar';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectInvoice: (invoiceId: string) => void;
  onNewInvoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenMobileMenu,
  setActiveTab,
  onSelectInvoice,
  onNewInvoice
}) => {
  const toggleMenu = onToggleSidebar || onOpenMobileMenu || (() => {});
  const handleTabChange = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
  };
  const {
    settings,
    currentUser,
    users,
    setCurrentUser,
    invoices,
    products,
    deliverySlips,
    customers,
    suppliers
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Global Search Filter
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery.length >= 2 ? {
    invoices: invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(trimmedQuery) ||
      i.customerName.toLowerCase().includes(trimmedQuery) ||
      i.customerPhone.includes(trimmedQuery) ||
      (i.poNumber && i.poNumber.toLowerCase().includes(trimmedQuery))
    ).slice(0, 5),
    slips: deliverySlips.filter(d =>
      d.deliverySlipNumber.toLowerCase().includes(trimmedQuery) ||
      d.customerName.toLowerCase().includes(trimmedQuery) ||
      (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(trimmedQuery)) ||
      (d.driverName && d.driverName.toLowerCase().includes(trimmedQuery))
    ).slice(0, 4),
    products: products.filter(p =>
      p.productName.toLowerCase().includes(trimmedQuery) ||
      p.sku.toLowerCase().includes(trimmedQuery) ||
      (p.hsCode && p.hsCode.toLowerCase().includes(trimmedQuery))
    ).slice(0, 4),
    customers: customers.filter(c =>
      c.customerName.toLowerCase().includes(trimmedQuery) ||
      c.phone.includes(trimmedQuery) ||
      c.companyName.toLowerCase().includes(trimmedQuery)
    ).slice(0, 4)
  } : null;

  const totalResults = searchResults
    ? searchResults.invoices.length +
      searchResults.slips.length +
      searchResults.products.length +
      searchResults.customers.length
    : 0;

  // Alerts
  const lowStockProducts = products.filter(p => p.stockQuantity <= (p.minimumStock || p.minStockLevel || 10));
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'Overdue' || (i.balanceDue > 0 && new Date(i.dueDate) < new Date()));
  const totalAlerts = lowStockProducts.length + overdueInvoices.length;

  return (
    <header className="sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 text-zinc-100 h-14 flex items-center justify-between px-4 gap-3">
      {/* Left: Toggle Menu Button & Brand Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold text-xs border border-zinc-700 transition-colors shadow-xs"
          title="Toggle Menu"
        >
          <Menu size={17} />
          <span>Toggle Menu</span>
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
            {settings.companyName}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-400">
            Mirpur, Dhaka (BDT ৳)
          </span>
        </div>
      </div>

      {/* Middle: Unified Global Search Bar */}
      <div className="relative flex-1 max-w-lg">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search Invoice #, Customer, Phone, SKU, Slip #, Vehicle, Container..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchResults && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="p-2 border-b border-zinc-800 flex justify-between items-center text-[11px] text-zinc-400">
              <span>{totalResults} matches found</span>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            {totalResults === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No matching records found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-1 space-y-2">
                {/* Invoices */}
                {searchResults.invoices.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      Sales Invoices
                    </div>
                    {searchResults.invoices.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          onSelectInvoice(inv.id);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-mono font-bold text-zinc-200 group-hover:text-amber-400">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-zinc-400 ml-2">{inv.customerName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-zinc-300">{formatCurrency(inv.grandTotal)}</span>
                          <span className={`ml-2 text-[10px] font-semibold px-1 rounded ${
                            inv.paymentStatus === 'Paid' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Delivery Slips */}
                {searchResults.slips.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Delivery Slips
                    </div>
                    {searchResults.slips.map(ds => (
                      <button
                        key={ds.id}
                        onClick={() => {
                          onSelectInvoice(ds.invoiceId);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-300">
                            {ds.deliverySlipNumber}
                          </span>
                          <span className="text-zinc-400 ml-2">{ds.customerName}</span>
                          {ds.vehicleNumber && (
                            <span className="text-zinc-500 text-[11px] ml-2">({ds.vehicleNumber})</span>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {ds.deliveryStatus}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Products
                    </div>
                    {searchResults.products.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          handleTabChange('products');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-200">{prod.productName}</span>
                          <span className="text-zinc-400 font-mono text-[11px] ml-2">SKU: {prod.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-400 text-[11px]">Stock: </span>
                          <strong className={prod.stockQuantity <= (prod.minimumStock || prod.minStockLevel || 10) ? 'text-red-400' : 'text-zinc-200'}>
                            {prod.stockQuantity} {prod.unit}
                          </strong>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Customers
                    </div>
                    {searchResults.customers.map(cust => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          handleTabChange('customers');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-zinc-800 rounded flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-200">{cust.customerName}</span>
                          <span className="text-zinc-400 text-[11px] ml-2">{cust.companyName}</span>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">{cust.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action: New Invoice */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow-xs transition-colors"
          title="Create New Invoice"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>New Invoice</span>
        </button>
      </div>
    </header>
  );
};
