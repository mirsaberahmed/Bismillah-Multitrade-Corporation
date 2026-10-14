import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceDetails } from './components/invoices/InvoiceDetails';
import { DeliverySlipList } from './components/delivery/DeliverySlipList';
import { CustomerList } from './components/customers/CustomerList';
import { SupplierList } from './components/suppliers/SupplierList';
import { ProductList } from './components/inventory/ProductList';
import { ImportExportManager } from './components/trade/ImportExportManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { DataImportExport } from './components/system/DataImportExport';
import { SettingsManager } from './components/system/SettingsManager';
import { UserManagement } from './components/system/UserManagement';
import { UserProfileModal } from './components/system/UserProfileModal';
import { QuotationManager } from './components/quotations/QuotationManager';
import { LoginPage } from './components/auth/LoginPage';

import { ExpenseList } from './components/finance/ExpenseList';
import { ExpenseForm } from './components/finance/ExpenseForm';
import { ExpenseDetails } from './components/finance/ExpenseDetails';

const SESSION_AUTH_KEY = 'bismillah_erp_session_authenticated_v1';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Invoices module sub-navigation
  const [invoiceView, setInvoiceView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Expenses module sub-navigation (Exact same 1st class architecture as Invoices)
  const [expenseView, setExpenseView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const handleNavigate = (tab: string | ActiveTab) => {
    if (tab === 'create_invoice') {
      handleOpenCreateInvoice();
      return;
    }
    setActiveTab(tab as ActiveTab);
    if (tab === 'invoices') {
      setInvoiceView('list');
      setSelectedInvoiceId(null);
    }
    if (tab === 'expenses') {
      setExpenseView('list');
      setSelectedExpenseId(null);
    }
  };

  const handleOpenCreateInvoice = () => {
    setActiveTab('invoices');
    setSelectedInvoiceId(null);
    setInvoiceView('create');
  };

  const handleSelectInvoice = (id: string) => {
    setActiveTab('invoices');
    setSelectedInvoiceId(id);
    setInvoiceView('details');
  };

  const handleEditInvoice = (id: string) => {
    setActiveTab('invoices');
    setSelectedInvoiceId(id);
    setInvoiceView('edit');
  };

  const handleOpenCreateExpense = () => {
    setActiveTab('expenses');
    setSelectedExpenseId(null);
    setExpenseView('create');
  };

  const handleSelectExpense = (id: string) => {
    setActiveTab('expenses');
    setSelectedExpenseId(id);
    setExpenseView('details');
  };

  const handleEditExpense = (id: string) => {
    setActiveTab('expenses');
    setSelectedExpenseId(id);
    setExpenseView('edit');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F7F4] text-slate-900 font-sans antialiased overflow-hidden selection:bg-orange-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNewInvoice={handleOpenCreateInvoice}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onToggleSidebar={() => setMobileMenuOpen(prev => !prev)}
          onOpenMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          setActiveTab={handleNavigate}
          onNewInvoice={handleOpenCreateInvoice}
          onSelectInvoice={handleSelectInvoice}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 bg-[#F8F7F4]">
          <div className="max-w-[1680px] mx-auto space-y-5">
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                onSelectInvoice={handleSelectInvoice}
                onNewInvoice={handleOpenCreateInvoice}
              />
            )}

            {/* 2. PRICE QUOTATIONS */}
            {activeTab === 'quotations' && (
              <QuotationManager
                onNavigateToInvoice={(invId) => {
                  setActiveTab('invoices');
                  setSelectedInvoiceId(invId);
                  setInvoiceView('details');
                }}
              />
            )}

            {/* 3. SALES INVOICES & BILLING */}
            {(activeTab === 'invoices' || activeTab === 'sales_orders') && (
              <>
                {invoiceView === 'list' && (
                  <InvoiceList
                    onSelectInvoice={handleSelectInvoice}
                    onNewInvoice={handleOpenCreateInvoice}
                    onEditInvoice={handleEditInvoice}
                  />
                )}

                {invoiceView === 'create' && (
                  <InvoiceForm
                    onCancel={() => setInvoiceView('list')}
                    onSuccess={(savedId) => {
                      if (savedId) {
                        handleSelectInvoice(savedId);
                      } else {
                        setInvoiceView('list');
                      }
                    }}
                  />
                )}

                {invoiceView === 'edit' && selectedInvoiceId && (
                  <InvoiceForm
                    invoiceId={selectedInvoiceId}
                    onCancel={() => setInvoiceView('list')}
                    onSuccess={(savedId) => {
                      if (savedId) {
                        handleSelectInvoice(savedId);
                      } else {
                        setInvoiceView('list');
                      }
                    }}
                  />
                )}

                {invoiceView === 'details' && selectedInvoiceId && (
                  <InvoiceDetails
                    invoiceId={selectedInvoiceId}
                    onBack={() => setInvoiceView('list')}
                    onEdit={(id) => handleEditInvoice(id)}
                  />
                )}
              </>
            )}

            {/* 3. DELIVERY SLIPS & CHALLANS */}
            {(activeTab === 'delivery_slips' || activeTab === 'delivery_challans') && (
              <DeliverySlipList onSelectInvoice={handleSelectInvoice} />
            )}

            {/* 4. CUSTOMERS & CLIENT DIRECTORY */}
            {activeTab === 'customers' && <CustomerList />}

            {/* 5. SUPPLIERS & PROCUREMENT */}
            {(activeTab === 'suppliers' || activeTab === 'purchase_invoices' || activeTab === 'purchase_orders') && <SupplierList />}

            {/* 6. INVENTORY & STOCK */}
            {(activeTab === 'products' || activeTab === 'categories' || activeTab === 'inventory_movements') && <ProductList />}

            {/* 7. IMPORT-EXPORT & TRADE */}
            {(activeTab === 'import_records' || activeTab === 'export_records' || activeTab === 'proforma_invoices' || activeTab === 'commercial_invoices' || activeTab === 'lc_management' || activeTab === 'shipments') && <ImportExportManager />}

            {/* 8. EXPENSES & DEBIT VOUCHERS (1ST-CLASS INVOICE-MATCHED ARCHITECTURE) */}
            {activeTab === 'expenses' && (
              <>
                {expenseView === 'list' && (
                  <ExpenseList
                    onSelectExpense={handleSelectExpense}
                    onNewExpense={handleOpenCreateExpense}
                    onEditExpense={handleEditExpense}
                  />
                )}

                {expenseView === 'create' && (
                  <ExpenseForm
                    onCancel={() => setExpenseView('list')}
                    onSuccess={(savedId) => {
                      if (savedId) {
                        handleSelectExpense(savedId);
                      } else {
                        setExpenseView('list');
                      }
                    }}
                  />
                )}

                {expenseView === 'edit' && selectedExpenseId && (
                  <ExpenseForm
                    expenseId={selectedExpenseId}
                    onCancel={() => setExpenseView('list')}
                    onSuccess={(savedId) => {
                      if (savedId) {
                        handleSelectExpense(savedId);
                      } else {
                        setExpenseView('list');
                      }
                    }}
                  />
                )}

                {expenseView === 'details' && selectedExpenseId && (
                  <ExpenseDetails
                    expenseId={selectedExpenseId}
                    onBack={() => setExpenseView('list')}
                    onEdit={(id) => handleEditExpense(id)}
                  />
                )}
              </>
            )}

            {/* 9. PAYMENTS & FINANCIAL ACCOUNTS (TREASURY & COLLECTIONS) */}
            {activeTab === 'payments' && (
              <FinanceManager defaultTab="collections" />
            )}

            {/* 9. REPORTS & INTELLIGENCE */}
            {activeTab === 'reports' && <ReportsManager />}

            {/* 10. EXCEL / CSV DATA CENTER */}
            {(activeTab === 'data_import' || activeTab === 'data_export' || activeTab === 'backup_restore') && <DataImportExport />}

            {/* 11. USER MANAGEMENT & RBAC */}
            {activeTab === 'user_management' && <UserManagement initialTab="users" />}

            {/* 12. AUDIT LOGS */}
            {activeTab === 'activity_logs' && <UserManagement initialTab="logs" />}

            {/* 13. SETTINGS & COMPANY PROFILE */}
            {activeTab === 'settings' && <SettingsManager />}
          </div>
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
