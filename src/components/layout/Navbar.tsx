import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Calendar,
  ChevronDown,
  Bell,
  User,
  LogOut,
  Settings,
  X,
  FileText,
  Truck,
  Package,
  Users,
  Clock,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ActiveTab } from './Sidebar';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BalmBottleLogo } from '../common/BalmBottleLogo';

interface NavbarProps {
  activeTab?: ActiveTab;
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectInvoice: (invoiceId: string) => void;
  onNewInvoice: () => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenMobileMenu,
  setActiveTab,
  onSelectInvoice,
  onLogout,
  onOpenProfile
}) => {
  const toggleMobileMenu = onOpenMobileMenu || onToggleSidebar || (() => {});
  const { invoices, products, deliverySlips, customers, currentUser, dateFilterPeriod, setDateFilterPeriod } = useData();

  // Search & Results
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [notificationsReadAll, setNotificationsReadAll] = useState(false);

  // Live Today Date & Time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering
  const trimmed = searchQuery.trim().toLowerCase();
  const searchResults = trimmed.length >= 2 ? {
    invoices: invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(trimmed) ||
      i.customerName.toLowerCase().includes(trimmed)
    ).slice(0, 4),
    slips: deliverySlips.filter(s =>
      s.deliverySlipNumber.toLowerCase().includes(trimmed) ||
      s.customerName.toLowerCase().includes(trimmed)
    ).slice(0, 3),
    products: products.filter(p =>
      p.productName.toLowerCase().includes(trimmed) ||
      (p.sku && p.sku.toLowerCase().includes(trimmed))
    ).slice(0, 3),
    customers: customers.filter(c =>
      c.customerName.toLowerCase().includes(trimmed) ||
      (c.phone && c.phone.includes(trimmed))
    ).slice(0, 3)
  } : null;

  const totalResults = searchResults
    ? searchResults.invoices.length + searchResults.slips.length + searchResults.products.length + searchResults.customers.length
    : 0;

  // Real operational alerts
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'Overdue' || (i.balanceDue > 0 && new Date(i.dueDate) < new Date()));
  const lowStock = products.filter(p => p.stockQuantity <= (p.minimumStock || p.minStockLevel || 10));
  const pendingDeliveries = deliverySlips.filter(d => d.deliveryStatus !== 'Delivered' && d.deliveryStatus !== 'Cancelled');

  const unreadAlertsCount = notificationsReadAll ? 0 : (overdueInvoices.length > 0 ? 3 : 0) + (lowStock.length > 0 ? 1 : 0) + 1;

  // Format live date & time
  const formatLiveDateTime = (d: Date) => {
    const datePart = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return { datePart, timePart };
  };

  const { datePart } = formatLiveDateTime(currentTime);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs print:hidden h-16">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Side: Sidebar Toggle Menu + Date & Period Filter */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleMobileMenu}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            title="Toggle Menu"
          >
            <Menu size={18} className="text-orange-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 hidden sm:inline">Menu</span>
          </button>

          {/* Date & Period (Positioned on the Left Beside Sidebar) */}
          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              title="Click to select period filter"
            >
              <Calendar size={14} className="text-orange-500 shrink-0" />
              <div className="text-left font-sans leading-tight">
                <span className="font-bold text-slate-900 block text-[11px]">
                  {datePart}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  Period: <strong className="text-orange-600 font-bold">{dateFilterPeriod}</strong>
                </span>
              </div>
              <ChevronDown size={12} className="text-slate-400 ml-1" />
            </button>

            {/* Dropdown Options: Today, This Week, This Month, Last Month, This Quarter, This Year, All Time */}
            {showDateMenu && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Filter Period
                </div>
                {(['Today', 'This Week', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'All Time'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateFilterPeriod(range);
                      setShowDateMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                      dateFilterPeriod === range ? 'font-bold text-orange-600 bg-orange-50/60' : 'text-slate-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Header Branding: Centered Balm Bottle Logo on Left of Title + Subtitle */}
        <div className="flex items-center justify-center gap-3 text-center mx-auto min-w-0">
          <BalmBottleLogo size={32} className="shrink-0 drop-shadow-xs" />
          <div className="text-center min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-[#0B1B2E] tracking-tight uppercase leading-tight font-sans truncate">
              BISMILLAH MULTITRADE CORPORATION
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-orange-600 leading-tight truncate">
              Import and export concern.
            </p>
          </div>
        </div>

        {/* Right Side: Compact Search, Notification Bell, User Avatar */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">

          {/* Compact Search Box (strictly "Search" placeholder, extra compact, positioned right) */}
          <div className="relative" ref={searchRef}>
            <div className="relative w-20 sm:w-28 md:w-32 focus-within:w-44 transition-all duration-300">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-lg pl-7 pr-5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Live Search Results Modal */}
            {showSearchResults && searchResults && (
              <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 text-xs z-50 max-h-[75vh] overflow-y-auto">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Found {totalResults} matches for "{searchQuery}"</span>
                  <button onClick={() => setShowSearchResults(false)} className="hover:text-slate-700">Close</button>
                </div>

                {totalResults === 0 ? (
                  <div className="p-4 text-center text-slate-500">No matching records found.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {/* Invoices */}
                    {searchResults.invoices.length > 0 && (
                      <div className="py-1.5">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <FileText size={11} /> Invoices
                        </p>
                        {searchResults.invoices.map(inv => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              onSelectInvoice(inv.id);
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-orange-600 block">{inv.invoiceNumber}</span>
                              <span className="text-slate-600 text-[11px]">{inv.customerName}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delivery Slips */}
                    {searchResults.slips.length > 0 && (
                      <div className="py-1.5">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Truck size={11} /> Delivery Slips
                        </p>
                        {searchResults.slips.map(slip => (
                          <div
                            key={slip.id}
                            onClick={() => {
                              if (setActiveTab) setActiveTab('delivery_slips');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-orange-600 block">{slip.deliverySlipNumber}</span>
                              <span className="text-slate-600 text-[11px]">{slip.customerName}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              {slip.deliveryStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div className="py-1.5">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Package size={11} /> Products
                        </p>
                        {searchResults.products.map(prod => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (setActiveTab) setActiveTab('products');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{prod.productName}</span>
                            <span className="font-mono text-slate-600">{prod.stockQuantity} {prod.unit || 'units'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Customers */}
                    {searchResults.customers.length > 0 && (
                      <div className="py-1.5">
                        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Users size={11} /> Customers
                        </p>
                        {searchResults.customers.map(cust => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              if (setActiveTab) setActiveTab('customers');
                              setShowSearchResults(false);
                            }}
                            className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{cust.customerName}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{cust.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell with "Read All" Capability */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900">Operational Alerts</h4>
                  <button
                    onClick={() => setNotificationsReadAll(true)}
                    className="text-[11px] text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                  >
                    Read all
                  </button>
                </div>

                <div className="py-2 space-y-2.5">
                  {notificationsReadAll && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> All notifications marked as read
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">0 unread</span>
                    </div>
                  )}

                  {overdueInvoices.length > 0 && (
                    <div className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${notificationsReadAll ? 'bg-slate-50 border-slate-200' : 'bg-red-50/70 border-red-100'}`}>
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${notificationsReadAll ? 'bg-slate-300' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-xs ${notificationsReadAll ? 'text-slate-700' : 'text-red-900'}`}>Overdue Invoices</p>
                          {notificationsReadAll && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">Read</span>}
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {overdueInvoices.length} invoices require collection follow-up.
                        </p>
                      </div>
                    </div>
                  )}

                  {lowStock.length > 0 && (
                    <div className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${notificationsReadAll ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/70 border-amber-100'}`}>
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${notificationsReadAll ? 'bg-slate-300' : 'bg-amber-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-xs ${notificationsReadAll ? 'text-slate-700' : 'text-amber-900'}`}>Low Stock Alert</p>
                          {notificationsReadAll && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">Read</span>}
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {lowStock[0]?.productName} is below reorder threshold.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${notificationsReadAll ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/70 border-blue-100'}`}>
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${notificationsReadAll ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-xs ${notificationsReadAll ? 'text-slate-700' : 'text-blue-900'}`}>Pending Deliveries</p>
                        {notificationsReadAll && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">Read</span>}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {pendingDeliveries.length} orders scheduled for dispatch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0B1B2E] to-slate-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-500/20">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ZA'}
              </div>
              <div className="hidden xl:block text-left">
                <span className="font-bold text-xs text-slate-800 block leading-tight">
                  {currentUser?.name || 'Zia Ahmed'}
                </span>
                <span className="text-[10px] font-semibold text-orange-600 block leading-tight">
                  {currentUser?.role || 'Super Admin'}
                </span>
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{currentUser?.name || 'Zia Ahmed'}</p>
                  <p className="text-[10px] text-slate-500">{currentUser?.email || 'admin@bismillahmultitrade.com'}</p>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-[9px] mt-1">
                    {currentUser?.role || 'Super Admin'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onOpenProfile) onOpenProfile();
                    else if (setActiveTab) setActiveTab('settings');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (setActiveTab) setActiveTab('user_management');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Shield size={14} className="text-orange-500" />
                  <span>User Management &amp; Roles</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (setActiveTab) setActiveTab('activity_logs');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Clock size={14} className="text-slate-500" />
                  <span>Security Audit Logs</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (setActiveTab) setActiveTab('settings');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Settings size={14} />
                  <span>ERP Settings</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100 cursor-pointer font-semibold"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
