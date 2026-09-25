import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Package,
  Building2,
  Database,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  exportToExcel,
  exportToCSV,
  readExcelFile,
  downloadTemplate,
  validateCustomerImport,
  validateProductImport
} from '../../utils/exportImport';

export const DataImportExport: React.FC = () => {
  const { customers, products, suppliers, invoices, saveCustomer, saveProduct } = useData();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importEntity, setImportEntity] = useState<'customers' | 'products'>('customers');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStage, setImportStage] = useState<'select' | 'preview' | 'done'>('select');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    try {
      const data = await readExcelFile(file);
      setPreviewRows(data);
      setImportStage('preview');
      setImportErrors([]);
    } catch (err: any) {
      alert('Failed to read file: ' + err.message);
    }
  };

  // Perform import
  const handleCommitImport = () => {
    if (previewRows.length === 0) return;

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    if (importEntity === 'customers') {
      previewRows.forEach((row, idx) => {
        const check = validateCustomerImport(row);
        if (!check.valid) {
          failedCount++;
          errors.push(`Row ${idx + 2}: ${check.error}`);
        } else {
          saveCustomer({
            id: 'cust-imp-' + Date.now() + '-' + idx,
            customerId: 'CUST-IMP-' + (idx + 1).toString().padStart(4, '0'),
            customerName: String(row['Customer Name'] || row['customerName'] || ''),
            companyName: String(row['Company Name'] || row['companyName'] || row['Customer Name'] || ''),
            customerType: 'Corporate',
            contactPerson: String(row['Contact Person'] || ''),
            phone: String(row['Phone'] || row['phone'] || ''),
            email: String(row['Email'] || row['email'] || ''),
            billingAddress: String(row['Address'] || row['billingAddress'] || ''),
            shippingAddress: String(row['Address'] || row['billingAddress'] || ''),
            city: 'Dhaka',
            district: 'Dhaka',
            country: 'Bangladesh',
            postalCode: '1216',
            binNumber: String(row['BIN'] || ''),
            tinNumber: String(row['TIN'] || ''),
            openingBalance: 0,
            currentBalance: Number(row['Opening Balance'] || 0),
            creditLimit: Number(row['Credit Limit'] || 500000),
            paymentTerms: '15 Days Credit',
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10)
          });
          successCount++;
        }
      });
    } else if (importEntity === 'products') {
      previewRows.forEach((row, idx) => {
        const check = validateProductImport(row);
        if (!check.valid) {
          failedCount++;
          errors.push(`Row ${idx + 2}: ${check.error}`);
        } else {
          saveProduct({
            id: 'prod-imp-' + Date.now() + '-' + idx,
            productId: 'PROD-IMP-' + (idx + 1).toString().padStart(4, '0'),
            sku: String(row['Product Code'] || 'PRD-' + (products.length + idx + 1).toString().padStart(4, '0')),
            productCode: String(row['Product Code'] || 'PRD-' + (products.length + idx + 1).toString().padStart(4, '0')),
            productName: String(row['Product Name'] || row['productName'] || ''),
            categoryId: 'cat-general',
            categoryName: String(row['Category'] || 'General Trading'),
            category: String(row['Category'] || 'General Trading'),
            brand: String(row['Brand'] || ''),
            countryOfOrigin: 'Bangladesh',
            originCountry: 'Bangladesh',
            unit: (row['Unit'] || 'Pcs') as any,
            hsCode: String(row['HS Code'] || ''),
            purchasePrice: Number(row['Cost Price'] || 0),
            sellingPrice: Number(row['Selling Price'] || 0),
            wholesalePrice: Number(row['Selling Price'] || 0),
            stockQuantity: Number(row['Stock Quantity'] || 0),
            reservedStock: 0,
            minimumStock: 5,
            minStockLevel: 5,
            weight: 0,
            cbm: 0,
            warehouseLocation: 'Mirpur Central Depot',
            description: '',
            vatRate: 0,
            taxRate: 0,
            status: 'Active',
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10)
          });
          successCount++;
        }
      });
    }

    setImportStats({ success: successCount, failed: failedCount });
    setImportErrors(errors);
    setImportStage('done');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-emerald-400" />
            Data Import &amp; Export Center
          </h1>
          <p className="text-xs text-zinc-400">
            Bulk migration engine supporting MS Excel (.xlsx) and CSV with template downloads and validation preview.
          </p>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'export' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Data Export
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportStage('select');
            }}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'import' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Bulk Import Wizard
          </button>
        </div>
      </div>

      {/* TAB 1: EXPORT HUB */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Customers Export */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <Users size={18} />
                <h3>Customer Directory</h3>
              </div>
              <p className="text-zinc-400">
                Exports all registered customers with phone numbers, billing address, BIN/TIN, credit limit, and current due balance.
              </p>
              <div className="mt-3 font-mono text-zinc-300">
                Total Records: <strong>{customers.length}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const data = customers.map(c => ({
                    'Customer Name': c.customerName,
                    'Company Name': c.companyName,
                    'Phone': c.phone,
                    'Email': c.email,
                    'Address': c.billingAddress,
                    'BIN': c.binNumber,
                    'TIN': c.tinNumber,
                    'Credit Limit': c.creditLimit,
                    'Current Due': c.currentBalance
                  }));
                  exportToExcel(data, 'Bismillah_Customers');
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold text-center"
              >
                Export Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  const data = customers.map(c => ({
                    'Customer Name': c.customerName,
                    'Phone': c.phone,
                    'Due': c.currentBalance
                  }));
                  exportToCSV(data, 'Customers_CSV');
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Products Export */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <Package size={18} />
                <h3>Products &amp; Inventory Register</h3>
              </div>
              <p className="text-zinc-400">
                Exports item master with product code, HS code, category, stock quantities, cost, and selling rates.
              </p>
              <div className="mt-3 font-mono text-zinc-300">
                Total Records: <strong>{products.length}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const data = products.map(p => ({
                    'Product Code': p.productCode,
                    'Product Name': p.productName,
                    'Category': p.category,
                    'HS Code': p.hsCode,
                    'Unit': p.unit,
                    'Cost Price': p.purchasePrice,
                    'Selling Price': p.sellingPrice,
                    'Available Stock': p.stockQuantity,
                    'Depot': p.warehouseLocation
                  }));
                  exportToExcel(data, 'Bismillah_Products_Inventory');
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold text-center"
              >
                Export Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  const data = products.map(p => ({
                    'Product Code': p.productCode,
                    'Product Name': p.productName,
                    'Stock': p.stockQuantity,
                    'Price': p.sellingPrice
                  }));
                  exportToCSV(data, 'Products_CSV');
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Invoices Export */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                <FileText size={18} />
                <h3>Sales Invoices &amp; Billing History</h3>
              </div>
              <p className="text-zinc-400">
                Exports complete sales transactions, grand totals, payments collected, and delivery fulfillment statuses.
              </p>
              <div className="mt-3 font-mono text-zinc-300">
                Total Invoices: <strong>{invoices.length}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const data = invoices.map(i => ({
                    'Invoice No': i.invoiceNumber,
                    'Date': i.invoiceDate,
                    'Customer': i.customerName,
                    'Grand Total': i.grandTotal,
                    'Paid Amount': i.paidAmount,
                    'Balance Due': i.balanceDue,
                    'Payment Status': i.paymentStatus,
                    'Delivery Status': i.deliveryStatus
                  }));
                  exportToExcel(data, 'Bismillah_Sales_Invoices');
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold text-center"
              >
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Suppliers Export */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                <Building2 size={18} />
                <h3>Suppliers &amp; International Vendors</h3>
              </div>
              <p className="text-zinc-400">
                Exports vendor directory with country of origin, foreign currency, and payable balances.
              </p>
              <div className="mt-3 font-mono text-zinc-300">
                Total Suppliers: <strong>{suppliers.length}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const data = suppliers.map(s => ({
                    'Supplier Name': s.supplierName,
                    'Company': s.companyName,
                    'Country': s.country,
                    'Phone': s.phone,
                    'Currency': s.currency,
                    'Payable': s.currentBalance
                  }));
                  exportToExcel(data, 'Bismillah_Suppliers');
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold text-center"
              >
                Export Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BULK IMPORT WIZARD */}
      {activeTab === 'import' && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-6 text-xs max-w-3xl mx-auto">
          {/* Step 1: Select Type & Template */}
          {importStage === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-zinc-100 text-sm">Step 1: Choose Import Target &amp; Download Template</h3>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded font-semibold text-[11px]">
                  Step 1 of 3
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setImportEntity('customers')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    importEntity === 'customers'
                      ? 'bg-zinc-800 border-amber-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Users size={20} className="text-amber-500 mb-2" />
                  <h4 className="font-bold text-zinc-100">Customer Accounts</h4>
                  <p className="text-zinc-400 text-[11px] mt-1">Import client addresses, contact numbers, and balances.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportEntity('products')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    importEntity === 'products'
                      ? 'bg-zinc-800 border-emerald-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Package size={20} className="text-emerald-400 mb-2" />
                  <h4 className="font-bold text-zinc-100">Products &amp; Inventory</h4>
                  <p className="text-zinc-400 text-[11px] mt-1">Import product codes, HS codes, prices, and stock units.</p>
                </button>
              </div>

              {/* Template Download Box */}
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-zinc-200">Download Official Standard Template</h4>
                  <p className="text-zinc-400 text-[11px]">
                    Use this formatted spreadsheet to ensure exact column compatibility.
                  </p>
                </div>
                <button
                  onClick={() => downloadTemplate(importEntity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded font-semibold border border-zinc-700"
                >
                  <Download size={14} />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl p-8 text-center bg-zinc-950/60 transition-colors">
                <Upload size={32} className="mx-auto mb-2 text-zinc-500" />
                <p className="font-bold text-zinc-200 mb-1">Select Excel (.xlsx) or CSV file</p>
                <p className="text-zinc-500 text-[11px] mb-4">Supported formats: .xlsx, .xls, .csv</p>
                <label className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer">
                  Browse File
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Validation */}
          {importStage === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">Step 2: Preview &amp; Confirm Data Validation</h3>
                  <p className="text-zinc-400 text-[11px]">
                    File: <strong className="text-zinc-200">{importFile?.name}</strong> • Total rows found: <strong className="text-amber-400">{previewRows.length}</strong>
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded font-semibold text-[11px]">
                  Step 2 of 3
                </span>
              </div>

              {/* Preview table */}
              <div className="border border-zinc-800 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                      {previewRows[0] && Object.keys(previewRows[0]).slice(0, 5).map(col => (
                        <th key={col} className="p-2">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {previewRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        {Object.keys(previewRows[0]).slice(0, 5).map(col => (
                          <td key={col} className="p-2 text-zinc-300 truncate max-w-xs">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setImportStage('select')}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Back
                </button>
                <button
                  onClick={handleCommitImport}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-md"
                >
                  <span>Commit Import ({previewRows.length} rows)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Finished */}
          {importStage === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Data Import Finished!</h3>
              <p className="text-zinc-400">
                Successfully processed and imported <strong className="text-emerald-400">{importStats.success}</strong> records into Bismillah Multitrade Corporation database.
              </p>

              {importErrors.length > 0 && (
                <div className="p-3 bg-red-950/30 border border-red-800 text-left rounded text-xs text-red-300 max-h-32 overflow-y-auto">
                  <p className="font-bold mb-1">Encountered errors on {importStats.failed} row(s):</p>
                  {importErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setImportStage('select');
                  setActiveTab('export');
                }}
                className="px-5 py-2 bg-amber-500 text-zinc-950 font-bold rounded"
              >
                Return to Data Center
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
