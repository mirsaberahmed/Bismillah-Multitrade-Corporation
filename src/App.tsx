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

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Invoices module sub-navigation
  const [invoiceView, setInvoiceView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const handleNavigate = (tab: string | ActiveTab) => {
    setActiveTab(tab as ActiveTab);
    if (tab === 'invoices') {
      setInvoiceView('list');
      setSelectedInvoiceId(null);
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

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden selection:bg-amber-500 selection:text-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setMobileMenuOpen(prev => !prev)}
          onOpenMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          setActiveTab={setActiveTab}
          onNewInvoice={handleOpenCreateInvoice}
          onSelectInvoice={handleSelectInvoice}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                onSelectInvoice={handleSelectInvoice}
                onNewInvoice={handleOpenCreateInvoice}
              />
            )}

            {/* 2. SALES INVOICES & BILLING */}
            {activeTab === 'invoices' && (
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
                    onSuccess={() => setInvoiceView('list')}
                  />
                )}

                {invoiceView === 'edit' && selectedInvoiceId && (
                  <InvoiceForm
                    invoiceId={selectedInvoiceId}
                    onCancel={() => setInvoiceView('list')}
                    onSuccess={() => setInvoiceView('list')}
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

            {/* 3. DELIVERY SLIPS & LOGISTICS */}
            {activeTab === 'delivery_slips' && (
              <DeliverySlipList onSelectInvoice={handleSelectInvoice} />
            )}

            {/* 4. CUSTOMERS & CLIENT DIRECTORY */}
            {activeTab === 'customers' && <CustomerList />}

            {/* 5. SUPPLIERS & VENDORS */}
            {activeTab === 'suppliers' && <SupplierList />}

            {/* 6. INVENTORY & STOCK */}
            {(activeTab === 'products' || activeTab === 'categories' || activeTab === 'inventory_movements') && <ProductList />}

            {/* 7. IMPORT-EXPORT & TRADE */}
            {(activeTab === 'import_records' || activeTab === 'export_records' || activeTab === 'proforma_invoices' || activeTab === 'commercial_invoices' || activeTab === 'lc_management' || activeTab === 'shipments') && <ImportExportManager />}

            {/* 8. PAYMENTS & FINANCIAL ACCOUNTS */}
            {(activeTab === 'payments' || activeTab === 'expenses') && <FinanceManager />}

            {/* 9. REPORTS & INTELLIGENCE */}
            {activeTab === 'reports' && <ReportsManager />}

            {/* 10. EXCEL / CSV DATA CENTER */}
            {(activeTab === 'data_import' || activeTab === 'data_export' || activeTab === 'backup_restore') && <DataImportExport />}

            {/* 11. SETTINGS & COMPANY PROFILE */}
            {(activeTab === 'settings' || activeTab === 'activity_logs') && <SettingsManager />}
          </div>
        </main>
      </div>
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
