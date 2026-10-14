import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  saveErpSectionToFirestore,
  loadAllErpSectionsFromFirestore,
  subscribeToErpSections
} from '../firebase';
import {
  CompanySettings,
  Customer,
  Supplier,
  ProductCategory,
  Product,
  SalesInvoice,
  DeliverySlip,
  DeliveryReturn,
  PurchaseInvoice,
  Quotation,
  SalesOrder,
  PurchaseOrder,
  DeliveryChallan,
  ProformaInvoice,
  CommercialInvoice,
  ImportRecord,
  ExportRecord,
  LcRecord,
  ShipmentRecord,
  PaymentRecord,
  ExpenseRecord,
  StockMovement,
  StockMovementType,
  UserAccount,
  UserRole,
  UserStatus,
  ActivityLog,
  PaymentStatus,
  DeliveryStatus
} from '../types';
import {
  initialCompanySettings,
  initialCategories,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialInvoices,
  initialDeliverySlips,
  initialPurchaseInvoices,
  initialQuotations,
  initialSalesOrders,
  initialPurchaseOrders,
  initialDeliveryChallans,
  initialProformaInvoices,
  initialCommercialInvoices,
  initialImportRecords,
  initialExportRecords,
  initialLcRecords,
  initialShipments,
  initialPayments,
  initialExpenses,
  initialUsers,
  initialActivityLogs
} from '../data/initialData';
import { numberToWordsBDT, getTodayDateString, DatePeriod } from '../utils/formatters';

interface DataContextType {
  // Global Period Filter (controlled from header calendar)
  dateFilterPeriod: DatePeriod;
  setDateFilterPeriod: (period: DatePeriod) => void;

  // State
  settings: CompanySettings;
  updateSettings: (newSettings: CompanySettings) => void;
  
  categories: ProductCategory[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: SalesInvoice[];
  deliverySlips: DeliverySlip[];
  deliveryReturns: DeliveryReturn[];
  purchaseInvoices: PurchaseInvoice[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  deliveryChallans: DeliveryChallan[];
  proformaInvoices: ProformaInvoice[];
  commercialInvoices: CommercialInvoice[];
  importRecords: ImportRecord[];
  exportRecords: ExportRecord[];
  lcRecords: LcRecord[];
  shipments: ShipmentRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  stockMovements: StockMovement[];
  users: UserAccount[];
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  activityLogs: ActivityLog[];
  
  // Actions
  logActivity: (action: string, details: string) => void;
  
  // Customer & Supplier CRUD
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => boolean;
  saveSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => boolean;
  
  // Product CRUD & Inventory
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => boolean;
  saveCategory: (category: ProductCategory) => void;
  adjustStock: (productId: string, quantity: number, type: 'Adjustment In' | 'Adjustment Out' | 'Damage', notes?: string) => void;
  
  // Sales Invoice & Delivery Slip
  saveInvoice: (invoice: SalesInvoice) => string;
  deleteInvoice: (id: string) => boolean;
  createDeliverySlipForInvoice: (slipData: Partial<DeliverySlip>) => DeliverySlip;
  updateDeliverySlip: (slip: DeliverySlip) => void;
  deleteDeliverySlip: (slipId: string) => boolean;
  updateDeliverySlipStatus: (slipId: string, status: DeliveryStatus, receiverInfo?: { name: string; phone?: string; designation?: string; time?: string }) => void;
  recordDeliveryReturn: (returnRecord: Omit<DeliveryReturn, 'id' | 'createdAt'>) => void;
  
  // Purchase & Orders
  savePurchaseInvoice: (pinv: PurchaseInvoice) => void;
  deletePurchaseInvoice: (id: string) => boolean;
  saveQuotation: (quotation: Quotation) => void;
  convertQuotationToInvoice: (quotationId: string) => string;
  saveSalesOrder: (so: SalesOrder) => void;
  convertSalesOrderToInvoice: (soId: string) => string;
  savePurchaseOrder: (po: PurchaseOrder) => void;
  convertPurchaseOrderToInvoice: (poId: string) => string;
  saveDeliveryChallan: (dc: DeliveryChallan) => void;
  
  // Trade & LC
  saveProformaInvoice: (pi: ProformaInvoice) => void;
  convertPiToCommercialInvoice: (piId: string) => string;
  convertPiToSalesInvoice: (piId: string) => string;
  saveCommercialInvoice: (ci: CommercialInvoice) => void;
  saveImportRecord: (imp: ImportRecord) => void;
  saveExportRecord: (exp: ExportRecord) => void;
  saveLcRecord: (lc: LcRecord) => void;
  saveShipment: (shipment: ShipmentRecord) => void;
  
  // Finance
  recordPayment: (payment: PaymentRecord) => void;
  saveExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => boolean;
  
  // User Management & RBAC
  saveUser: (user: UserAccount) => void;
  deleteUser: (id: string) => boolean;
  approveUser: (userId: string, role?: UserRole, department?: string) => void;
  rejectUser: (userId: string, reason?: string) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  registerUser: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => { success: boolean; message: string; user?: UserAccount };
  
  // Backup, Restore & Reset
  exportDatabaseBackup: () => string;
  restoreDatabaseBackup: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
  
  // Sequential Number Generators
  getNextNumber: (type: 'invoice' | 'delivery_slip' | 'quotation' | 'pi' | 'ci' | 'payment' | 'po' | 'so' | 'challan' | 'import' | 'export' | 'expense' | 'purchase_invoice') => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'bismillah_multitrade_erp_v3_';

const defaultSuperAdmin: UserAccount = {
  id: 'usr-admin',
  name: 'Zia Ahmed',
  fullName: 'Zia Ahmed',
  username: 'admin',
  email: 'admin@bismillah.com',
  phone: '+880 1819-223344',
  employeeId: 'EMP-001',
  department: 'Management',
  designation: 'Managing Director',
  role: 'Super Admin',
  status: 'Active',
  active: true,
  permissions: ['All Modules', 'Manage Users', 'Approve Registrations', 'Assign Roles', 'Manage Permissions', 'View Financial Reports', 'Manage Settings', 'Access Audit Logs'],
  createdAt: '2026-01-01',
  lastLoginAt: '2026-10-14 09:30 AM'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'products');
    if (!saved) return initialProducts;
    try {
      const parsed: Product[] = JSON.parse(saved);
      // Filter out demo products so only BALM and custom user products remain
      const filtered = parsed.filter(p => {
        const name = p.productName.toLowerCase();
        return !name.includes('variable vane') && 
               !name.includes('hydraulic pump') && 
               !name.includes('electric induction motor') &&
               !name.includes('galvanized steel') &&
               !name.includes('pvc resin') &&
               !name.includes('cotton carded') &&
               !name.includes('proximity sensor');
      });
      // Keep name synchronized to BURMIS PAIN RELIEF BALM with empty description
      return filtered.map(p => {
        if (p.id === 'prod-burmis-pain-relief' || p.productName.toLowerCase().includes('burmis')) {
          return { ...p, productName: 'BURMIS PAIN RELIEF BALM', description: '' };
        }
        return p;
      });
    } catch {
      return initialProducts;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [deliverySlips, setDeliverySlips] = useState<DeliverySlip[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'delivery_slips');
    return saved ? JSON.parse(saved) : initialDeliverySlips;
  });

  const [deliveryReturns, setDeliveryReturns] = useState<DeliveryReturn[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'delivery_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'purchase_invoices');
    return saved ? JSON.parse(saved) : initialPurchaseInvoices;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'quotations');
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'sales_orders');
    return saved ? JSON.parse(saved) : initialSalesOrders;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'purchase_orders');
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'delivery_challans');
    return saved ? JSON.parse(saved) : initialDeliveryChallans;
  });

  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'proforma_invoices');
    return saved ? JSON.parse(saved) : initialProformaInvoices;
  });

  const [commercialInvoices, setCommercialInvoices] = useState<CommercialInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'commercial_invoices');
    return saved ? JSON.parse(saved) : initialCommercialInvoices;
  });

  const [importRecords, setImportRecords] = useState<ImportRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'import_records');
    return saved ? JSON.parse(saved) : initialImportRecords;
  });

  const [exportRecords, setExportRecords] = useState<ExportRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'export_records');
    return saved ? JSON.parse(saved) : initialExportRecords;
  });

  const [lcRecords, setLcRecords] = useState<LcRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'lc_records');
    return saved ? JSON.parse(saved) : initialLcRecords;
  });

  const [shipments, setShipments] = useState<ShipmentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'shipments');
    return saved ? JSON.parse(saved) : initialShipments;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'stock_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    return initialUsers[0] || defaultSuperAdmin;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'activity_logs');
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  // Global Calendar Period Filter (defaults to 'This Month', synchronized from Navbar to Dashboard)
  const [dateFilterPeriod, setDateFilterPeriod] = useState<DatePeriod>('This Month');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'delivery_slips', JSON.stringify(deliverySlips));
  }, [deliverySlips]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'delivery_returns', JSON.stringify(deliveryReturns));
  }, [deliveryReturns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'purchase_invoices', JSON.stringify(purchaseInvoices));
  }, [purchaseInvoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sales_orders', JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'delivery_challans', JSON.stringify(deliveryChallans));
  }, [deliveryChallans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'proforma_invoices', JSON.stringify(proformaInvoices));
  }, [proformaInvoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'commercial_invoices', JSON.stringify(commercialInvoices));
  }, [commercialInvoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'import_records', JSON.stringify(importRecords));
  }, [importRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'export_records', JSON.stringify(exportRecords));
  }, [exportRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'lc_records', JSON.stringify(lcRecords));
  }, [lcRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Cross-PC / Multi-Device Firebase Firestore & Server Synchronization
  const [serverReady, setServerReady] = useState(false);
  const lastSyncedJsonRef = useRef<Record<string, string>>({});

  const mergeById = <T extends { id: string }>(
    cloudArr: T[] | undefined,
    serverArr: T[] | undefined,
    localArr: T[]
  ): T[] => {
    const map = new Map<string, T>();
    // Put local items first, then server items, then cloud (Firestore) items so cloud is authoritative
    if (Array.isArray(localArr)) {
      localArr.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
    }
    if (Array.isArray(serverArr)) {
      serverArr.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
    }
    if (Array.isArray(cloudArr)) {
      cloudArr.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    let cancelled = false;
    let unsubscribeFirestore: (() => void) | null = null;

    async function hydrateFromCloud() {
      let firestoreSections: Record<string, any> = {};
      let serverData: Record<string, any> = {};

      try {
        const fsRes = await loadAllErpSectionsFromFirestore();
        firestoreSections = fsRes.sections || {};
      } catch (e) {
        console.warn('Firestore initial load warning:', e);
      }

      try {
        const res = await fetch('/api/state');
        const json = await res.json();
        if (json && json.ok && json.data) {
          serverData = json.data;
        }
      } catch {
        // ignore local server fallback error
      }

      if (cancelled) return;

      const resolvedSettings = firestoreSections.settings || serverData.settings || settings;
      const resolvedCategories = mergeById<ProductCategory>(firestoreSections.categories, serverData.categories, categories);
      const resolvedProducts = mergeById<Product>(firestoreSections.products, serverData.products, products);
      const resolvedInvoices = mergeById<SalesInvoice>(firestoreSections.invoices, serverData.invoices, invoices);
      const rawCustomers = mergeById<Customer>(firestoreSections.customers, serverData.customers, customers);

      // Ensure every customer from any invoice is present in Customer Directory
      const custMap = new Map<string, Customer>();
      rawCustomers.forEach(c => {
        if (c && c.id) custMap.set(c.id, c);
      });
      resolvedInvoices.forEach(inv => {
        if (!inv || !inv.customerName || !inv.customerName.trim()) return;
        const found = Array.from(custMap.values()).find(
          c =>
            (inv.customerId && c.id === inv.customerId) ||
            c.customerName.trim().toLowerCase() === inv.customerName.trim().toLowerCase() ||
            (inv.customerPhone && c.phone && c.phone.trim() === inv.customerPhone.trim())
        );
        if (!found) {
          const newCustId = inv.customerId || `cust-${inv.id}`;
          const recoveredCustomer: Customer = {
            id: newCustId,
            customerId: 'CUST-' + newCustId.slice(-4).toUpperCase(),
            customerName: inv.customerName.trim(),
            companyName: (inv.companyName || inv.customerName).trim(),
            customerType: 'Corporate',
            contactPerson: inv.customerName.trim(),
            phone: inv.customerPhone || '',
            email: inv.customerEmail || '',
            billingAddress: inv.customerAddress || '',
            shippingAddress: inv.customerAddress || '',
            city: 'Dhaka',
            district: 'Dhaka',
            country: 'Bangladesh',
            postalCode: '1216',
            binNumber: inv.customerBin || '',
            tinNumber: inv.customerTin || '',
            openingBalance: inv.previousDue || 0,
            currentBalance: inv.balanceDue || 0,
            creditLimit: 500000,
            paymentTerms: inv.paymentTerms || '15 Days Credit',
            createdAt: inv.createdAt || getTodayDateString(),
            updatedAt: inv.updatedAt || getTodayDateString()
          };
          custMap.set(recoveredCustomer.id, recoveredCustomer);
        }
      });
      const resolvedCustomers = Array.from(custMap.values());

      const resolvedSuppliers = mergeById<Supplier>(firestoreSections.suppliers, serverData.suppliers, suppliers);
      const resolvedDeliverySlips = mergeById<DeliverySlip>(firestoreSections.deliverySlips, serverData.deliverySlips, deliverySlips);
      const resolvedDeliveryReturns = mergeById<DeliveryReturn>(firestoreSections.deliveryReturns, serverData.deliveryReturns, deliveryReturns);
      const resolvedPurchaseInvoices = mergeById<PurchaseInvoice>(firestoreSections.purchaseInvoices, serverData.purchaseInvoices, purchaseInvoices);
      const resolvedQuotations = mergeById<Quotation>(firestoreSections.quotations, serverData.quotations, quotations);
      const resolvedSalesOrders = mergeById<SalesOrder>(firestoreSections.salesOrders, serverData.salesOrders, salesOrders);
      const resolvedPurchaseOrders = mergeById<PurchaseOrder>(firestoreSections.purchaseOrders, serverData.purchaseOrders, purchaseOrders);
      const resolvedDeliveryChallans = mergeById<DeliveryChallan>(firestoreSections.deliveryChallans, serverData.deliveryChallans, deliveryChallans);
      const resolvedProformaInvoices = mergeById<ProformaInvoice>(firestoreSections.proformaInvoices, serverData.proformaInvoices, proformaInvoices);
      const resolvedCommercialInvoices = mergeById<CommercialInvoice>(firestoreSections.commercialInvoices, serverData.commercialInvoices, commercialInvoices);
      const resolvedImportRecords = mergeById<ImportRecord>(firestoreSections.importRecords, serverData.importRecords, importRecords);
      const resolvedExportRecords = mergeById<ExportRecord>(firestoreSections.exportRecords, serverData.exportRecords, exportRecords);
      const resolvedLcRecords = mergeById<LcRecord>(firestoreSections.lcRecords, serverData.lcRecords, lcRecords);
      const resolvedShipments = mergeById<ShipmentRecord>(firestoreSections.shipments, serverData.shipments, shipments);
      const resolvedPayments = mergeById<PaymentRecord>(firestoreSections.payments, serverData.payments, payments);
      const resolvedExpenses = mergeById<ExpenseRecord>(firestoreSections.expenses, serverData.expenses, expenses);
      const resolvedStockMovements = mergeById<StockMovement>(firestoreSections.stockMovements, serverData.stockMovements, stockMovements);
      const resolvedUsers = mergeById<UserAccount>(firestoreSections.users, serverData.users, users);
      const resolvedActivityLogs = mergeById<ActivityLog>(firestoreSections.activityLogs, serverData.activityLogs, activityLogs).slice(0, 200);

      const allResolved: Record<string, any> = {
        settings: resolvedSettings,
        categories: resolvedCategories,
        products: resolvedProducts,
        customers: resolvedCustomers,
        suppliers: resolvedSuppliers,
        invoices: resolvedInvoices,
        deliverySlips: resolvedDeliverySlips,
        deliveryReturns: resolvedDeliveryReturns,
        purchaseInvoices: resolvedPurchaseInvoices,
        quotations: resolvedQuotations,
        salesOrders: resolvedSalesOrders,
        purchaseOrders: resolvedPurchaseOrders,
        deliveryChallans: resolvedDeliveryChallans,
        proformaInvoices: resolvedProformaInvoices,
        commercialInvoices: resolvedCommercialInvoices,
        importRecords: resolvedImportRecords,
        exportRecords: resolvedExportRecords,
        lcRecords: resolvedLcRecords,
        shipments: resolvedShipments,
        payments: resolvedPayments,
        expenses: resolvedExpenses,
        stockMovements: resolvedStockMovements,
        users: resolvedUsers,
        activityLogs: resolvedActivityLogs,
      };

      // Record baseline JSON strings and seed Firestore for any sections not yet stored or updated
      Object.entries(allResolved).forEach(([secKey, val]) => {
        const jsonStr = JSON.stringify(val);
        lastSyncedJsonRef.current[secKey] = jsonStr;
        const existingFsJson = firestoreSections[secKey] !== undefined ? JSON.stringify(firestoreSections[secKey]) : '';
        if (existingFsJson !== jsonStr) {
          saveErpSectionToFirestore(secKey, val, currentUser.name).catch(() => {});
        }
      });

      setSettings(resolvedSettings);
      setCategories(resolvedCategories);
      setProducts(resolvedProducts);
      setCustomers(resolvedCustomers);
      setSuppliers(resolvedSuppliers);
      setInvoices(resolvedInvoices);
      setDeliverySlips(resolvedDeliverySlips);
      setDeliveryReturns(resolvedDeliveryReturns);
      setPurchaseInvoices(resolvedPurchaseInvoices);
      setQuotations(resolvedQuotations);
      setSalesOrders(resolvedSalesOrders);
      setPurchaseOrders(resolvedPurchaseOrders);
      setDeliveryChallans(resolvedDeliveryChallans);
      setProformaInvoices(resolvedProformaInvoices);
      setCommercialInvoices(resolvedCommercialInvoices);
      setImportRecords(resolvedImportRecords);
      setExportRecords(resolvedExportRecords);
      setLcRecords(resolvedLcRecords);
      setShipments(resolvedShipments);
      setPayments(resolvedPayments);
      setExpenses(resolvedExpenses);
      setStockMovements(resolvedStockMovements);
      setUsers(resolvedUsers);
      setActivityLogs(resolvedActivityLogs);

      setServerReady(true);

      // Attach real-time Firestore listener so changes from other devices appear live
      try {
        unsubscribeFirestore = subscribeToErpSections((sectionId, parsedData) => {
          if (cancelled || parsedData === undefined || parsedData === null) return;
          const incomingJson = JSON.stringify(parsedData);
          if (lastSyncedJsonRef.current[sectionId] === incomingJson) return;
          lastSyncedJsonRef.current[sectionId] = incomingJson;

          switch (sectionId) {
            case 'settings': setSettings(parsedData); break;
            case 'categories': setCategories(parsedData); break;
            case 'products': setProducts(parsedData); break;
            case 'customers': setCustomers(parsedData); break;
            case 'suppliers': setSuppliers(parsedData); break;
            case 'invoices': setInvoices(parsedData); break;
            case 'deliverySlips': setDeliverySlips(parsedData); break;
            case 'deliveryReturns': setDeliveryReturns(parsedData); break;
            case 'purchaseInvoices': setPurchaseInvoices(parsedData); break;
            case 'quotations': setQuotations(parsedData); break;
            case 'salesOrders': setSalesOrders(parsedData); break;
            case 'purchaseOrders': setPurchaseOrders(parsedData); break;
            case 'deliveryChallans': setDeliveryChallans(parsedData); break;
            case 'proformaInvoices': setProformaInvoices(parsedData); break;
            case 'commercialInvoices': setCommercialInvoices(parsedData); break;
            case 'importRecords': setImportRecords(parsedData); break;
            case 'exportRecords': setExportRecords(parsedData); break;
            case 'lcRecords': setLcRecords(parsedData); break;
            case 'shipments': setShipments(parsedData); break;
            case 'payments': setPayments(parsedData); break;
            case 'expenses': setExpenses(parsedData); break;
            case 'stockMovements': setStockMovements(parsedData); break;
            case 'users': setUsers(parsedData); break;
            case 'activityLogs': setActivityLogs(parsedData); break;
          }
        });
      } catch (err) {
        console.warn('Firestore subscription warning:', err);
      }
    }

    hydrateFromCloud();

    return () => {
      cancelled = true;
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  useEffect(() => {
    if (!serverReady) return;
    const currentSections: Record<string, any> = {
      settings,
      categories,
      products,
      customers,
      suppliers,
      invoices,
      deliverySlips,
      deliveryReturns,
      purchaseInvoices,
      quotations,
      salesOrders,
      purchaseOrders,
      deliveryChallans,
      proformaInvoices,
      commercialInvoices,
      importRecords,
      exportRecords,
      lcRecords,
      shipments,
      payments,
      expenses,
      stockMovements,
      users,
      activityLogs: activityLogs.slice(0, 200)
    };

    // Sync changed sections immediately to Firebase Firestore
    Object.entries(currentSections).forEach(([secKey, val]) => {
      const jsonStr = JSON.stringify(val);
      if (lastSyncedJsonRef.current[secKey] !== jsonStr) {
        lastSyncedJsonRef.current[secKey] = jsonStr;
        saveErpSectionToFirestore(secKey, val, currentUser.name).catch(() => {});
      }
    });

    const timer = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSections)
      }).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [
    serverReady,
    settings,
    categories,
    products,
    customers,
    suppliers,
    invoices,
    deliverySlips,
    deliveryReturns,
    purchaseInvoices,
    quotations,
    salesOrders,
    purchaseOrders,
    deliveryChallans,
    proformaInvoices,
    commercialInvoices,
    importRecords,
    exportRecords,
    lcRecords,
    shipments,
    payments,
    expenses,
    stockMovements,
    users,
    activityLogs
  ]);

  // Activity logger
  const logActivity = (action: string, details: string) => {
    const now = new Date();
    const newLog: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user: currentUser.name,
      action,
      date: getTodayDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  const updateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    logActivity('Settings Updated', 'Company profile and operational settings saved.');
  };

  // Helper for sequential numbering (starts from user specified base counts)
  const getNextNumber = (type: 'invoice' | 'delivery_slip' | 'quotation' | 'pi' | 'ci' | 'payment' | 'po' | 'so' | 'challan' | 'import' | 'export' | 'expense' | 'purchase_invoice'): string => {
    const year = new Date().getFullYear();
    let prefix = '';
    let count = 0;

    switch (type) {
      case 'invoice': {
        const baseSeq = 161425;
        let maxSeq = baseSeq - 1;
        invoices.forEach(inv => {
          if (!inv.invoiceNumber) return;
          const match = inv.invoiceNumber.match(/(?:INV[_-]\d+[-_]|INV[-_])?(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });
        const nextSeq = maxSeq + 1;
        return `INV_2026-${nextSeq}`;
      }
      case 'delivery_slip': {
        const baseSeq = 4702;
        let maxSeq = baseSeq - 1;
        deliverySlips.forEach(ds => {
          if (!ds.deliverySlipNumber) return;
          const match = ds.deliverySlipNumber.match(/(?:DS[_-]\d+[-_]|DS[-_])?(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });
        const nextSeq = maxSeq + 1;
        return `DS-2026-${nextSeq}`;
      }
      case 'quotation':
        prefix = settings.quotationPrefix || `QT-${year}-`;
        count = quotations.length;
        break;
      case 'pi':
        prefix = settings.piPrefix || `PI-${year}-`;
        count = proformaInvoices.length;
        break;
      case 'ci':
        prefix = settings.commercialInvoicePrefix || `CI-${year}-`;
        count = commercialInvoices.length;
        break;
      case 'payment':
        prefix = settings.moneyReceiptPrefix || `MR-${year}-`;
        count = payments.length;
        break;
      case 'po':
        prefix = settings.purchaseOrderPrefix || `PO-${year}-`;
        count = purchaseOrders.length;
        break;
      case 'so':
        prefix = settings.salesOrderPrefix || `SO-${year}-`;
        count = salesOrders.length;
        break;
      case 'challan':
        prefix = settings.challanPrefix || `DC-${year}-`;
        count = deliveryChallans.length;
        break;
      case 'import':
        prefix = settings.importPrefix || `IMP-${year}-`;
        count = importRecords.length;
        break;
      case 'export':
        prefix = settings.exportPrefix || `EXP-${year}-`;
        count = exportRecords.length;
        break;
      case 'expense':
        prefix = settings.expensePrefix || `EXPNS-${year}-`;
        count = expenses.length;
        break;
      case 'purchase_invoice':
        prefix = settings.purchaseInvoicePrefix || `PINV-${year}-`;
        count = purchaseInvoices.length;
        break;
    }

    return `${prefix}${String(count).padStart(4, '0')}`;
  };

  // Customer Management
  const saveCustomer = (customer: Customer) => {
    const isNew = !customers.some(c => c.id === customer.id);
    if (isNew) {
      setCustomers(prev => {
        const next = [customer, ...prev];
        localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(next));
        return next;
      });
      logActivity('Customer Created', `Added customer: ${customer.customerName} (${customer.companyName})`);
    } else {
      setCustomers(prev => {
        const next = prev.map(c => c.id === customer.id ? customer : c);
        localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(next));
        return next;
      });
      logActivity('Customer Updated', `Updated customer: ${customer.customerName}`);
    }
    // Immediately persist customer to cloud server
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    }).catch(() => {});
  };

  const deleteCustomer = (id: string): boolean => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return false;
    // Check if has invoices
    const hasInvoices = invoices.some(i => i.customerId === id);
    if (hasInvoices) {
      alert(`Cannot delete customer "${customer.customerName}" because they have existing sales invoices. Archive or cancel invoices first.`);
      return false;
    }
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(next));
      return next;
    });
    fetch(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
    logActivity('Customer Deleted', `Deleted customer: ${customer.customerName}`);
    return true;
  };

  // Supplier Management
  const saveSupplier = (supplier: Supplier) => {
    const isNew = !suppliers.some(s => s.id === supplier.id);
    if (isNew) {
      setSuppliers(prev => [supplier, ...prev]);
      logActivity('Supplier Created', `Added supplier: ${supplier.supplierName} (${supplier.companyName})`);
    } else {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
      logActivity('Supplier Updated', `Updated supplier: ${supplier.supplierName}`);
    }
  };

  const deleteSupplier = (id: string): boolean => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return false;
    const hasPurchases = purchaseInvoices.some(p => p.supplierId === id);
    if (hasPurchases) {
      alert(`Cannot delete supplier "${supplier.supplierName}" because there are associated purchase invoices.`);
      return false;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logActivity('Supplier Deleted', `Deleted supplier: ${supplier.supplierName}`);
    return true;
  };

  // Product & Category Management
  const saveCategory = (cat: ProductCategory) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === cat.id);
      return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat];
    });
  };

  const saveProduct = (product: Product) => {
    const isNew = !products.some(p => p.id === product.id);
    if (isNew) {
      setProducts(prev => [product, ...prev]);
      // Record opening stock movement if opening stock > 0
      if (product.stockQuantity > 0) {
        const movement: StockMovement = {
          id: 'mov-' + Date.now(),
          date: getTodayDateString(),
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          type: 'Opening',
          quantity: product.stockQuantity,
          previousStock: 0,
          newStock: product.stockQuantity,
          referenceNumber: 'INITIAL-STOCK',
          notes: 'Product creation opening stock',
          createdBy: currentUser.name
        };
        setStockMovements(m => [movement, ...m]);
      }
      logActivity('Product Created', `Added product: ${product.productName} (SKU: ${product.sku})`);
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      logActivity('Product Updated', `Updated product: ${product.productName}`);
    }
  };

  const deleteProduct = (id: string): boolean => {
    const product = products.find(p => p.id === id);
    if (!product) return false;
    // Check if in invoices
    const inInvoices = invoices.some(i => i.items.some(item => item.productId === id));
    if (inInvoices) {
      alert(`Cannot delete product "${product.productName}" because it is referenced in sales invoices.`);
      return false;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    logActivity('Product Deleted', `Deleted product: ${product.productName}`);
    return true;
  };

  const adjustStock = (productId: string, quantity: number, type: StockMovementType, notes?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const previousStock = product.stockQuantity;
    const isPositive = type === 'Adjustment In' || type === 'Purchase' || type === 'Sales Return' || type === 'Opening';
    const delta = isPositive ? quantity : -quantity;
    const newStock = Math.max(0, previousStock + delta);

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockQuantity: newStock } : p));

    const movement: StockMovement = {
      id: 'mov-' + Date.now(),
      date: getTodayDateString(),
      productId: product.id,
      productName: product.productName,
      sku: product.sku,
      type,
      quantity: delta,
      previousStock,
      newStock,
      referenceNumber: 'ADJ-' + Date.now().toString().slice(-4),
      notes: notes || `Manual stock adjustment: ${type}`,
      createdBy: currentUser.name
    };
    setStockMovements(prev => [movement, ...prev]);
    logActivity('Stock Adjusted', `${product.productName} adjusted by ${delta > 0 ? '+' : ''}${delta} ${product.unit}. New Stock: ${newStock}`);
  };

  // Sales Invoices
  const saveInvoice = (invoiceData: SalesInvoice): string => {
    const isNew = !invoices.some(i => i.id === invoiceData.id);

    // Calculate totals automatically
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let vatTotal = 0;
    let taxTotal = 0;

    const updatedItems = invoiceData.items.map(item => {
      const lineBase = item.quantity * item.unitPrice;
      const discount = item.discountType === 'percentage'
        ? (lineBase * item.discountValue) / 100
        : item.discountValue;
      const discounted = Math.max(0, lineBase - discount);
      const vat = (discounted * (item.vatRate || 0)) / 100;
      const tax = (discounted * (item.taxRate || 0)) / 100;
      const lineTotal = discounted + vat + tax;

      subtotal += lineBase;
      itemDiscountTotal += discount;
      vatTotal += vat;
      taxTotal += tax;

      return {
        ...item,
        amount: Math.round(lineTotal * 100) / 100
      };
    });

    const netAfterDiscount = subtotal - itemDiscountTotal - (invoiceData.overallDiscount || 0);
    const overallVat = vatTotal;
    const overallTax = taxTotal;
    const grandTotalCalculated =
      netAfterDiscount +
      overallVat +
      overallTax +
      (invoiceData.aitAmount || 0) +
      (invoiceData.shippingCharge || 0) +
      (invoiceData.transportCharge || 0) +
      (invoiceData.loadingCharge || 0) +
      (invoiceData.otherCharge || 0) +
      (invoiceData.previousDue || 0) +
      (invoiceData.roundAdjustment || 0);

    const paid = invoiceData.paidAmount || 0;
    const balanceDue = Math.max(0, grandTotalCalculated - paid);

    // Calculate payment status
    let paymentStatus: PaymentStatus = 'Unpaid';
    if (paid >= grandTotalCalculated && grandTotalCalculated > 0) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partially Paid';
    } else if (invoiceData.dueDate && new Date(invoiceData.dueDate) < new Date() && paid === 0) {
      paymentStatus = 'Overdue';
    }

    // Auto-match or auto-create customer in Customer Directory so every invoice customer is saved
    let resolvedCustomerId = invoiceData.customerId;
    const existingCust = customers.find(
      c =>
        (resolvedCustomerId && c.id === resolvedCustomerId) ||
        c.customerName.trim().toLowerCase() === invoiceData.customerName.trim().toLowerCase() ||
        (invoiceData.customerPhone && c.phone.trim() === invoiceData.customerPhone.trim())
    );

    if (existingCust) {
      resolvedCustomerId = existingCust.id;
    } else if (invoiceData.customerName.trim()) {
      resolvedCustomerId = 'cust-' + Date.now();
      const autoNewCustomer: Customer = {
        id: resolvedCustomerId,
        customerId: 'CUST-' + Date.now().toString().slice(-4),
        customerName: invoiceData.customerName.trim(),
        companyName: (invoiceData.companyName || invoiceData.customerName).trim(),
        customerType: 'Corporate',
        contactPerson: invoiceData.customerName.trim(),
        phone: invoiceData.customerPhone || '',
        email: invoiceData.customerEmail || '',
        billingAddress: invoiceData.customerAddress || '',
        shippingAddress: invoiceData.customerAddress || '',
        city: 'Dhaka',
        district: 'Dhaka',
        country: 'Bangladesh',
        postalCode: '1216',
        binNumber: invoiceData.customerBin || '',
        tinNumber: invoiceData.customerTin || '',
        openingBalance: invoiceData.previousDue || 0,
        currentBalance: (invoiceData.previousDue || 0) + (isNew ? Math.round(balanceDue * 100) / 100 : 0),
        creditLimit: 500000,
        paymentTerms: invoiceData.paymentTerms || '15 Days Credit',
        createdAt: getTodayDateString(),
        updatedAt: getTodayDateString()
      };
      setCustomers(prev => {
        const next = [autoNewCustomer, ...prev];
        localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(next));
        return next;
      });
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoNewCustomer)
      }).catch(() => {});
    }

    const fullInvoice: SalesInvoice = {
      ...invoiceData,
      customerId: resolvedCustomerId,
      items: updatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      itemDiscount: Math.round(itemDiscountTotal * 100) / 100,
      vatAmount: Math.round(overallVat * 100) / 100,
      taxAmount: Math.round(overallTax * 100) / 100,
      grandTotal: Math.round(grandTotalCalculated * 100) / 100,
      paidAmount: paid,
      balanceDue: Math.round(balanceDue * 100) / 100,
      amountInWords: numberToWordsBDT(Math.round(grandTotalCalculated * 100) / 100),
      paymentStatus,
      deliveryStatus: invoiceData.deliveryStatus || 'Ready for Delivery',
      deliverySlipIds: invoiceData.deliverySlipIds || [],
      paymentIds: invoiceData.paymentIds || [],
      updatedAt: getTodayDateString()
    };

    if (isNew) {
      setInvoices(prev => [fullInvoice, ...prev]);

      // If settings reduce stock at 'invoice_confirmation', update stock immediately
      if (settings.reduceStockAt === 'invoice_confirmation') {
        fullInvoice.items.forEach(item => {
          adjustStock(item.productId, item.quantity, 'Adjustment Out', `Deducted on Invoice ${fullInvoice.invoiceNumber}`);
        });
      } else {
        // Reserve stock
        setProducts(prev => prev.map(p => {
          const matchedItem = fullInvoice.items.find(i => i.productId === p.id);
          if (matchedItem) {
            return {
              ...p,
              reservedStock: (p.reservedStock || 0) + matchedItem.quantity
            };
          }
          return p;
        }));
      }

      // Update existing customer balance & latest contact details
      if (existingCust) {
        const updatedCust: Customer = {
          ...existingCust,
          companyName: fullInvoice.companyName || existingCust.companyName,
          phone: fullInvoice.customerPhone || existingCust.phone,
          email: fullInvoice.customerEmail || existingCust.email,
          billingAddress: fullInvoice.customerAddress || existingCust.billingAddress,
          shippingAddress: fullInvoice.customerAddress || existingCust.shippingAddress,
          binNumber: fullInvoice.customerBin || existingCust.binNumber,
          tinNumber: fullInvoice.customerTin || existingCust.tinNumber,
          currentBalance: (existingCust.currentBalance || 0) + fullInvoice.balanceDue,
          updatedAt: getTodayDateString()
        };
        setCustomers(prev => {
          const next = prev.map(c => c.id === existingCust.id ? updatedCust : c);
          localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(next));
          return next;
        });
        fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCust)
        }).catch(() => {});
      }

      logActivity('Invoice Created', `Created invoice ${fullInvoice.invoiceNumber} for ${fullInvoice.customerName} (Grand Total: ৳ ${fullInvoice.grandTotal.toLocaleString()})`);
    } else {
      setInvoices(prev => prev.map(i => i.id === fullInvoice.id ? fullInvoice : i));
      logActivity('Invoice Updated', `Updated invoice ${fullInvoice.invoiceNumber}`);
    }

    return fullInvoice.id;
  };

  const deleteInvoice = (id: string): boolean => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return false;

    // Related delivery slips
    const relatedSlips = deliverySlips.filter(ds => ds.invoiceId === id);

    // Release reserved stock or restore stock deducted on creation
    if (settings.reduceStockAt === 'delivery_confirmation') {
      setProducts(prev => prev.map(p => {
        const item = invoice.items?.find(i => i.productId === p.id);
        if (!item) return p;

        // Sum up what was dispatched in related delivery slips
        const deliveredQty = relatedSlips.reduce((sum, s) => {
          const slipItem = s.items?.find(si => si.productId === p.id);
          return sum + (slipItem ? (slipItem.deliveredQuantity || 0) : 0);
        }, 0);
        const unDeliveredQty = Math.max(0, item.quantity - deliveredQty);

        return {
          ...p,
          stockQuantity: (p.stockQuantity || 0) + deliveredQty,
          reservedStock: Math.max(0, (p.reservedStock || 0) - unDeliveredQty)
        };
      }));
    } else {
      setProducts(prev => prev.map(p => {
        const item = invoice.items?.find(i => i.productId === p.id);
        if (!item) return p;
        return {
          ...p,
          stockQuantity: (p.stockQuantity || 0) + item.quantity
        };
      }));
    }

    // Clean up customer balance
    if (invoice.customerId && invoice.balanceDue > 0) {
      setCustomers(prev => prev.map(c => {
        if (c.id === invoice.customerId) {
          return {
            ...c,
            currentBalance: Math.max(0, (c.currentBalance || 0) - invoice.balanceDue)
          };
        }
        return c;
      }));
    }

    // Clean up related delivery slips, delivery returns, and invoice-specific payments
    setDeliverySlips(prev => prev.filter(ds => ds.invoiceId !== id));
    setDeliveryReturns(prev => prev.filter(dr => dr.invoiceId !== id));
    setPayments(prev => prev.filter(pm => pm.invoiceId !== id));

    setInvoices(prev => prev.filter(i => i.id !== id));
    logActivity('Invoice Deleted', `Deleted invoice ${invoice.invoiceNumber}`);
    return true;
  };

  // Delivery Slip Creation & Execution (seamlessly linked to Invoice)
  const createDeliverySlipForInvoice = (slipData: Partial<DeliverySlip>): DeliverySlip => {
    const invoice = invoices.find(i => i.id === slipData.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const year = new Date().getFullYear();
    let slipNumber = slipData.deliverySlipNumber?.trim();
    if (!slipNumber) {
      slipNumber = getNextNumber('delivery_slip');
    }

    // Map items and calculate pending quantities
    const items: DeliverySlip['items'] = (slipData.items || []).map(item => {
      const invItem = invoice.items.find(
        i => (item.invoiceItemId && i.id === item.invoiceItemId) || (item.productId && i.productId === item.productId) || i.productName === item.productName
      );
      const orderedQty = invItem ? invItem.quantity : item.orderedQuantity;

      // Calculate previously delivered across existing delivery slips for this invoice
      const prevDelivered = deliverySlips
        .filter(ds => ds.invoiceId === invoice.id && ds.deliveryStatus !== 'Cancelled')
        .reduce((sum, ds) => {
          const match = ds.items.find(
            di => (item.invoiceItemId && di.invoiceItemId === item.invoiceItemId) || (item.productId && di.productId === item.productId) || di.productName === item.productName
          );
          return sum + (match ? match.deliveredQuantity : 0);
        }, 0);

      const delivered = Number(item.deliveredQuantity || 0);
      const remaining = Math.max(0, orderedQty - (prevDelivered + delivered));
      const resolvedBox = item.boxCount !== undefined && item.boxCount !== '' ? String(item.boxCount) : (item.boxes !== undefined ? String(item.boxes) : '');
      const resolvedWeight = item.weight !== undefined ? String(item.weight) : '';

      return {
        id: 'ds-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        invoiceItemId: invItem ? invItem.id : item.invoiceItemId,
        productId: item.productId,
        productName: item.productName,
        description: item.description || '',
        unit: item.unit,
        orderedQuantity: orderedQty,
        previouslyDelivered: prevDelivered,
        deliveredQuantity: delivered,
        remainingQuantity: remaining,
        boxCount: resolvedBox,
        boxes: resolvedBox,
        weight: resolvedWeight,
        unitPrice: invItem ? invItem.unitPrice : item.unitPrice,
        amount: invItem ? invItem.unitPrice * delivered : (item.unitPrice || 0) * delivered,
        remarks: item.remarks || ''
      };
    });

    const newSlip: DeliverySlip = {
      id: 'ds-' + Date.now(),
      deliverySlipNumber: slipNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      deliveryDate: slipData.deliveryDate || getTodayDateString(),
      expectedDeliveryDate: slipData.expectedDeliveryDate,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      companyName: invoice.companyName,
      contactPerson: slipData.contactPerson || invoice.customerName,
      phone: slipData.phone || invoice.customerPhone,
      deliveryAddress: slipData.deliveryAddress || invoice.customerAddress,
      shippingAddress: slipData.shippingAddress || invoice.customerAddress,
      vehicleNumber: slipData.vehicleNumber,
      driverName: slipData.driverName,
      driverPhone: slipData.driverPhone,
      deliveryPerson: slipData.deliveryPerson || currentUser.name,
      deliveryMethod: slipData.deliveryMethod || 'Truck',
      warehouse: slipData.warehouse || 'Mirpur Central Depot, Dhaka',
      referenceNumber: slipData.referenceNumber,
      poNumber: slipData.poNumber || invoice.poNumber,
      remarks: slipData.remarks,
      deliveryInstructions: slipData.deliveryInstructions,
      totalBoxes: slipData.totalBoxes !== undefined ? String(slipData.totalBoxes) : '',
      totalWeight: slipData.totalWeight !== undefined ? String(slipData.totalWeight) : '',
      receivedBy: slipData.receivedBy || slipData.receiverName,
      receiverName: slipData.receiverName || slipData.receivedBy,
      receiverPhone: slipData.receiverPhone,
      receiverDesignation: slipData.receiverDesignation,
      receivedDate: slipData.receivedDate,
      items,
      deliveryStatus: slipData.deliveryStatus || 'Dispatched',
      createdBy: currentUser.name,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    // Save Delivery Slip
    setDeliverySlips(prev => [newSlip, ...prev]);

    // Update Invoice Delivery Status & deliverySlipIds
    const allDeliveredSlips = [...deliverySlips.filter(d => d.invoiceId === invoice.id && d.deliveryStatus !== 'Cancelled'), newSlip];
    
    // Check if fully or partially delivered
    let totalOrdered = 0;
    let totalDelivered = 0;
    invoice.items.forEach(invItem => {
      totalOrdered += invItem.quantity;
      const deliveredSoFar = allDeliveredSlips.reduce((sum, ds) => {
        const matchingItem = ds.items.find(di => di.productId === invItem.productId);
        return sum + (matchingItem ? matchingItem.deliveredQuantity : 0);
      }, 0);
      totalDelivered += deliveredSoFar;
    });

    let newDeliveryStatus: DeliveryStatus = 'Partially Delivered';
    if (totalDelivered >= totalOrdered) {
      newDeliveryStatus = 'Delivered';
    } else if (totalDelivered === 0) {
      newDeliveryStatus = 'Ready for Delivery';
    }

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          deliveryStatus: newDeliveryStatus,
          deliverySlipIds: Array.from(new Set([...(inv.deliverySlipIds || []), newSlip.id]))
        };
      }
      return inv;
    }));

    // If reduceStockAt === 'delivery_confirmation', deduct stock now!
    if (settings.reduceStockAt === 'delivery_confirmation') {
      newSlip.items.forEach(item => {
        if (item.deliveredQuantity > 0) {
          adjustStock(item.productId, item.deliveredQuantity, 'Adjustment Out', `Dispatched via Delivery Slip ${newSlip.deliverySlipNumber}`);
          // Reduce reserved stock
          setProducts(prev => prev.map(p => p.id === item.productId ? {
            ...p,
            reservedStock: Math.max(0, (p.reservedStock || 0) - item.deliveredQuantity)
          } : p));
        }
      });
    }

    logActivity('Delivery Slip Created', `Generated delivery slip ${newSlip.deliverySlipNumber} for ${invoice.invoiceNumber}`);
    return newSlip;
  };

  const updateDeliverySlipStatus = (
    slipId: string,
    status: DeliveryStatus,
    receiverInfo?: { name: string; phone?: string; designation?: string; time?: string }
  ) => {
    const targetSlip = deliverySlips.find(d => d.id === slipId);

    setDeliverySlips(prev => prev.map(ds => {
      if (ds.id === slipId) {
        return {
          ...ds,
          deliveryStatus: status,
          receivedBy: receiverInfo?.name || ds.receivedBy,
          receiverName: receiverInfo?.name || ds.receiverName,
          receiverPhone: receiverInfo?.phone || ds.receiverPhone,
          receiverDesignation: receiverInfo?.designation || ds.receiverDesignation,
          receivedDate: receiverInfo ? getTodayDateString() : (ds.receivedDate || getTodayDateString()),
          receivedTime: receiverInfo?.time || ds.receivedTime,
          updatedAt: getTodayDateString()
        };
      }
      return ds;
    }));

    // If target slip exists, update the associated invoice's delivery status
    if (targetSlip && targetSlip.invoiceId) {
      const invoice = invoices.find(i => i.id === targetSlip.invoiceId);
      if (invoice) {
        const updatedSlips = deliverySlips.map(ds => ds.id === slipId ? { ...ds, deliveryStatus: status } : ds);
        const invSlips = updatedSlips.filter(d => d.invoiceId === invoice.id && d.deliveryStatus !== 'Cancelled');
        
        let totalOrdered = 0;
        let totalDelivered = 0;
        invoice.items.forEach(invItem => {
          totalOrdered += invItem.quantity;
          const deliveredSoFar = invSlips.reduce((sum, ds) => {
            const matchingItem = ds.items.find(di => di.productId === invItem.productId);
            return sum + (matchingItem ? matchingItem.deliveredQuantity : 0);
          }, 0);
          totalDelivered += deliveredSoFar;
        });

        let newStatus: DeliveryStatus = 'Ready for Delivery';
        if (totalDelivered >= totalOrdered && invSlips.some(s => s.deliveryStatus === 'Delivered')) {
          newStatus = 'Delivered';
        } else if (totalDelivered > 0 || invSlips.length > 0) {
          newStatus = 'Partially Delivered';
        }

        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? {
          ...inv,
          deliveryStatus: newStatus
        } : inv));
      }
    }

    logActivity('Delivery Status Updated', `Delivery slip status changed to ${status} for slip ${targetSlip?.deliverySlipNumber || slipId}`);
  };

  const updateDeliverySlip = (slip: DeliverySlip) => {
    setDeliverySlips(prev => prev.map(s => s.id === slip.id ? { ...slip, updatedAt: getTodayDateString() } : s));
    
    // Recalculate delivery status for the associated invoice
    if (slip.invoiceId) {
      const invoice = invoices.find(i => i.id === slip.invoiceId);
      if (invoice) {
        const otherSlips = deliverySlips.filter(d => d.id !== slip.id && d.invoiceId === invoice.id && d.deliveryStatus !== 'Cancelled');
        const activeSlips = slip.deliveryStatus !== 'Cancelled' ? [...otherSlips, slip] : otherSlips;
        
        let totalOrdered = 0;
        let totalDelivered = 0;
        invoice.items.forEach(invItem => {
          totalOrdered += invItem.quantity;
          const deliveredSoFar = activeSlips.reduce((sum, ds) => {
            const matchingItem = ds.items.find(di => di.productId === invItem.productId);
            return sum + (matchingItem ? matchingItem.deliveredQuantity : 0);
          }, 0);
          totalDelivered += deliveredSoFar;
        });

        let newStatus: DeliveryStatus = 'Ready for Delivery';
        if (totalDelivered >= totalOrdered && activeSlips.some(s => s.deliveryStatus === 'Delivered')) {
          newStatus = 'Delivered';
        } else if (totalDelivered > 0 || activeSlips.length > 0) {
          newStatus = 'Partially Delivered';
        }

        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? {
          ...inv,
          deliveryStatus: newStatus
        } : inv));
      }
    }
    logActivity('Delivery Slip Updated', `Updated delivery slip ${slip.deliverySlipNumber}`);
  };

  const deleteDeliverySlip = (slipId: string): boolean => {
    const target = deliverySlips.find(s => s.id === slipId);
    if (!target) return false;

    setDeliverySlips(prev => prev.filter(s => s.id !== slipId));

    // Update invoice delivery status
    if (target.invoiceId) {
      const invoice = invoices.find(i => i.id === target.invoiceId);
      if (invoice) {
        const remainingSlips = deliverySlips.filter(d => d.id !== slipId && d.invoiceId === invoice.id && d.deliveryStatus !== 'Cancelled');
        
        let totalOrdered = 0;
        let totalDelivered = 0;
        invoice.items.forEach(invItem => {
          totalOrdered += invItem.quantity;
          const deliveredSoFar = remainingSlips.reduce((sum, ds) => {
            const matchingItem = ds.items.find(di => di.productId === invItem.productId);
            return sum + (matchingItem ? matchingItem.deliveredQuantity : 0);
          }, 0);
          totalDelivered += deliveredSoFar;
        });

        let newStatus: DeliveryStatus = 'Ready for Delivery';
        if (totalDelivered >= totalOrdered && remainingSlips.length > 0 && remainingSlips.some(s => s.deliveryStatus === 'Delivered')) {
          newStatus = 'Delivered';
        } else if (totalDelivered > 0 || remainingSlips.length > 0) {
          newStatus = 'Partially Delivered';
        }

        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? {
          ...inv,
          deliveryStatus: newStatus
        } : inv));
      }
    }

    logActivity('Delivery Slip Deleted', `Deleted delivery slip ${target.deliverySlipNumber}`);
    return true;
  };

  const recordDeliveryReturn = (returnRecord: Omit<DeliveryReturn, 'id' | 'createdAt'>) => {
    const newReturn: DeliveryReturn = {
      ...returnRecord,
      id: 'ret-' + Date.now(),
      createdAt: getTodayDateString()
    };

    setDeliveryReturns(prev => [newReturn, ...prev]);

    // Return to inventory if not damaged beyond repair
    if (newReturn.returnType !== 'Damaged Return') {
      adjustStock(newReturn.productId, newReturn.returnQty, 'Sales Return', `Returned from Delivery Slip ${newReturn.deliverySlipNumber}. Reason: ${newReturn.reason}`);
    }

    // Update invoice delivery status to 'Returned'
    setInvoices(prev => prev.map(inv => {
      if (inv.id === newReturn.invoiceId) {
        return {
          ...inv,
          deliveryStatus: 'Returned'
        };
      }
      return inv;
    }));

    logActivity('Delivery Return Recorded', `Recorded ${newReturn.returnType} of ${newReturn.returnQty} for ${newReturn.productName} (Slip: ${newReturn.deliverySlipNumber})`);
  };

  // Purchase Invoices
  const savePurchaseInvoice = (pinv: PurchaseInvoice) => {
    const isNew = !purchaseInvoices.some(p => p.id === pinv.id);
    if (isNew) {
      setPurchaseInvoices(prev => [pinv, ...prev]);
      // Update inventory when purchase invoice is confirmed!
      pinv.items.forEach(item => {
        adjustStock(item.productId, item.quantity, 'Adjustment In', `Stock added from Purchase Invoice ${pinv.purchaseInvoiceNumber}`);
      });
      // Update supplier payable
      setSuppliers(prev => prev.map(s => s.id === pinv.supplierId ? {
        ...s,
        currentPayable: (s.currentPayable || 0) + pinv.balanceDue
      } : s));
      logActivity('Purchase Invoice Created', `Created purchase invoice ${pinv.purchaseInvoiceNumber} from ${pinv.supplierName}`);
    } else {
      setPurchaseInvoices(prev => prev.map(p => p.id === pinv.id ? pinv : p));
      logActivity('Purchase Invoice Updated', `Updated purchase invoice ${pinv.purchaseInvoiceNumber}`);
    }
  };

  const deletePurchaseInvoice = (id: string): boolean => {
    const pinv = purchaseInvoices.find(p => p.id === id);
    if (!pinv) return false;
    setPurchaseInvoices(prev => prev.filter(p => p.id !== id));
    logActivity('Purchase Invoice Deleted', `Deleted purchase invoice ${pinv.purchaseInvoiceNumber}`);
    return true;
  };

  // Quotation, Orders, Challans
  const saveQuotation = (quotation: Quotation) => {
    setQuotations(prev => {
      const exists = prev.some(q => q.id === quotation.id);
      return exists ? prev.map(q => q.id === quotation.id ? quotation : q) : [quotation, ...prev];
    });
    logActivity('Quotation Saved', `Quotation ${quotation.quotationNumber} saved.`);
  };

  const convertQuotationToInvoice = (quotationId: string): string => {
    const qt = quotations.find(q => q.id === quotationId);
    if (!qt) throw new Error('Quotation not found');

    const customer = customers.find(c => c.id === qt.customerId);
    const invoiceNumber = getNextNumber('invoice');

    const newInvoice: SalesInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      invoiceDate: getTodayDateString(),
      dueDate: getTodayDateString(),
      customerId: qt.customerId,
      customerName: qt.customerName,
      companyName: qt.customerCompany,
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      customerAddress: customer?.billingAddress || '',
      referenceNumber: qt.quotationNumber,
      currency: qt.currency,
      exchangeRate: qt.exchangeRate,
      paymentTerms: '15 Days Credit',
      items: qt.items,
      subtotal: qt.subtotal,
      itemDiscount: 0,
      overallDiscount: qt.discount,
      vatAmount: qt.vat,
      taxAmount: 0,
      aitAmount: 0,
      shippingCharge: 0,
      transportCharge: 0,
      loadingCharge: 0,
      otherCharge: 0,
      previousDue: customer?.currentBalance || 0,
      roundAdjustment: 0,
      grandTotal: qt.grandTotal,
      paidAmount: 0,
      balanceDue: qt.grandTotal,
      amountInWords: numberToWordsBDT(qt.grandTotal),
      paymentStatus: 'Unpaid',
      deliveryStatus: 'Ready for Delivery',
      deliverySlipIds: [],
      paymentIds: [],
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveInvoice(newInvoice);

    setQuotations(prev => prev.map(q => q.id === quotationId ? {
      ...q,
      status: 'Accepted',
      convertedToInvoiceId: newInvoice.id
    } : q));

    logActivity('Quotation Converted', `Quotation ${qt.quotationNumber} converted to Invoice ${invoiceNumber}`);
    return newInvoice.id;
  };

  const saveSalesOrder = (so: SalesOrder) => {
    setSalesOrders(prev => {
      const exists = prev.some(s => s.id === so.id);
      return exists ? prev.map(s => s.id === so.id ? so : s) : [so, ...prev];
    });
  };

  const convertSalesOrderToInvoice = (soId: string): string => {
    const so = salesOrders.find(s => s.id === soId);
    if (!so) throw new Error('Sales Order not found');

    const customer = customers.find(c => c.id === so.customerId);
    const invoiceNumber = getNextNumber('invoice');

    const newInvoice: SalesInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      invoiceDate: getTodayDateString(),
      dueDate: getTodayDateString(),
      customerId: so.customerId,
      customerName: so.customerName,
      companyName: so.customerCompany,
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      customerAddress: customer?.billingAddress || '',
      referenceNumber: so.salesOrderNumber,
      currency: so.currency,
      exchangeRate: 1,
      paymentTerms: '15 Days Credit',
      items: so.items,
      subtotal: so.grandTotal,
      itemDiscount: 0,
      overallDiscount: 0,
      vatAmount: 0,
      taxAmount: 0,
      aitAmount: 0,
      shippingCharge: 0,
      transportCharge: 0,
      loadingCharge: 0,
      otherCharge: 0,
      previousDue: customer?.currentBalance || 0,
      roundAdjustment: 0,
      grandTotal: so.grandTotal,
      paidAmount: 0,
      balanceDue: so.grandTotal,
      amountInWords: numberToWordsBDT(so.grandTotal),
      paymentStatus: 'Unpaid',
      deliveryStatus: 'Ready for Delivery',
      deliverySlipIds: [],
      paymentIds: [],
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveInvoice(newInvoice);

    setSalesOrders(prev => prev.map(s => s.id === soId ? {
      ...s,
      status: 'Confirmed',
      convertedToInvoiceId: newInvoice.id
    } : s));

    logActivity('Sales Order Converted', `Sales Order ${so.salesOrderNumber} converted to Invoice ${invoiceNumber}`);
    return newInvoice.id;
  };

  const savePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const exists = prev.some(p => p.id === po.id);
      return exists ? prev.map(p => p.id === po.id ? po : p) : [po, ...prev];
    });
  };

  const convertPurchaseOrderToInvoice = (poId: string): string => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) throw new Error('Purchase Order not found');

    const pinvNumber = getNextNumber('purchase_invoice');
    const newPinv: PurchaseInvoice = {
      id: 'pinv-' + Date.now(),
      purchaseInvoiceNumber: pinvNumber,
      supplierInvoiceNumber: 'SUPP-' + Date.now().toString().slice(-4),
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      companyName: po.supplierCompany,
      date: getTodayDateString(),
      dueDate: getTodayDateString(),
      purchaseOrder: po.poNumber,
      currency: po.currency,
      exchangeRate: 1,
      items: po.items,
      subtotal: po.grandTotal,
      taxAmount: 0,
      vatAmount: 0,
      otherCharge: 0,
      grandTotal: po.grandTotal,
      paidAmount: 0,
      balanceDue: po.grandTotal,
      status: 'Unpaid',
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    savePurchaseInvoice(newPinv);

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? {
      ...p,
      status: 'Received',
      convertedToPurchaseInvoiceId: newPinv.id
    } : p));

    logActivity('Purchase Order Converted', `Purchase Order ${po.poNumber} converted to ${pinvNumber}`);
    return newPinv.id;
  };

  const saveDeliveryChallan = (dc: DeliveryChallan) => {
    setDeliveryChallans(prev => {
      const exists = prev.some(d => d.id === dc.id);
      return exists ? prev.map(d => d.id === dc.id ? dc : d) : [dc, ...prev];
    });
    logActivity('Challan Created', `Created Delivery Challan ${dc.challanNumber}`);
  };

  // Trade & LC
  const saveProformaInvoice = (pi: ProformaInvoice) => {
    setProformaInvoices(prev => {
      const exists = prev.some(p => p.id === pi.id);
      return exists ? prev.map(p => p.id === pi.id ? pi : p) : [pi, ...prev];
    });
    logActivity('Proforma Invoice Saved', `Proforma Invoice ${pi.piNumber} saved.`);
  };

  const convertPiToCommercialInvoice = (piId: string): string => {
    const pi = proformaInvoices.find(p => p.id === piId);
    if (!pi) throw new Error('PI not found');

    const ciNumber = getNextNumber('ci');
    const newCi: CommercialInvoice = {
      id: 'ci-' + Date.now(),
      commercialInvoiceNumber: ciNumber,
      invoiceDate: getTodayDateString(),
      exporter: pi.sellerInfo,
      consignee: pi.buyerInfo,
      notifyParty: 'Same as consignee',
      buyer: pi.buyerName,
      countryOfOrigin: pi.countryOfOrigin,
      countryOfDestination: pi.countryOfDestination,
      bankInformation: `${settings.bankName}, ${settings.branchName}. Swift: ${settings.swiftCode}`,
      shipmentMethod: pi.shipmentMethod,
      vesselFlightName: 'TBA (Pending Booking)',
      portOfLoading: pi.portOfLoading,
      portOfDischarge: pi.portOfDischarge,
      blAwbNumber: 'TBA',
      incoterm: pi.incoterm,
      paymentTerms: pi.paymentTerms,
      items: pi.items.map(item => ({
        sl: item.sl,
        description: item.description || item.productName,
        hsCode: item.hsCode,
        countryOfOrigin: pi.countryOfOrigin,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.total,
        netWeight: item.quantity * 10,
        grossWeight: item.quantity * 11
      })),
      totalQuantity: pi.items.reduce((sum, i) => sum + i.quantity, 0),
      totalNetWeight: pi.items.reduce((sum, i) => sum + i.quantity * 10, 0),
      totalGrossWeight: pi.items.reduce((sum, i) => sum + i.quantity * 11, 0),
      fob: pi.fobValue,
      freight: pi.freight,
      insurance: pi.insurance,
      cifValue: pi.cif,
      grandTotal: pi.grandTotal,
      createdAt: getTodayDateString()
    };

    setCommercialInvoices(prev => [newCi, ...prev]);
    logActivity('PI Converted', `PI ${pi.piNumber} converted to Commercial Invoice ${ciNumber}`);
    return newCi.id;
  };

  const convertPiToSalesInvoice = (piId: string): string => {
    const pi = proformaInvoices.find(p => p.id === piId);
    if (!pi) throw new Error('PI not found');

    const invNumber = getNextNumber('invoice');
    const newInv: SalesInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invNumber,
      invoiceDate: getTodayDateString(),
      dueDate: getTodayDateString(),
      customerId: customers[0]?.id || 'cust-1',
      customerName: pi.buyerName,
      companyName: pi.buyerName,
      customerPhone: settings.phonePrimary,
      customerEmail: settings.email,
      customerAddress: pi.buyerInfo,
      referenceNumber: pi.piNumber,
      currency: pi.currency,
      exchangeRate: pi.exchangeRate,
      paymentTerms: pi.paymentTerms,
      items: pi.items.map((item, idx) => ({
        id: 'item-' + idx,
        productId: products[0]?.id || 'prod-1',
        productName: item.productName,
        description: item.description,
        hsCode: item.hsCode,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountType: 'fixed',
        discountValue: 0,
        vatRate: 0,
        taxRate: 0,
        amount: item.total
      })),
      subtotal: pi.fobValue,
      itemDiscount: 0,
      overallDiscount: pi.discount,
      vatAmount: 0,
      taxAmount: 0,
      aitAmount: 0,
      shippingCharge: pi.freight,
      transportCharge: 0,
      loadingCharge: 0,
      otherCharge: pi.otherCharges,
      previousDue: 0,
      roundAdjustment: 0,
      grandTotal: pi.grandTotal,
      paidAmount: 0,
      balanceDue: pi.grandTotal,
      amountInWords: numberToWordsBDT(pi.grandTotal),
      paymentStatus: 'Unpaid',
      deliveryStatus: 'Ready for Delivery',
      deliverySlipIds: [],
      paymentIds: [],
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveInvoice(newInv);
    logActivity('PI Converted', `PI ${pi.piNumber} converted to Sales Invoice ${invNumber}`);
    return newInv.id;
  };

  const saveCommercialInvoice = (ci: CommercialInvoice) => {
    setCommercialInvoices(prev => {
      const exists = prev.some(c => c.id === ci.id);
      return exists ? prev.map(c => c.id === ci.id ? ci : c) : [ci, ...prev];
    });
  };

  const saveImportRecord = (imp: ImportRecord) => {
    // Automatically calculate Landed Cost:
    // CIF = FOB + freight + insurance
    // Customs duties = CD + VAT + AIT + AT + RD
    // Port + C&F + Transport + other
    const fob = imp.fob || 0;
    const freight = imp.freight || imp.shippingCharges || 0;
    const insurance = imp.insurance || 0;
    const cif = imp.cif || (fob + freight + insurance);
    const customDuty = imp.customDuty || imp.customsDuty || 0;
    const vat = imp.vat || imp.vatTax || 0;
    const ait = imp.ait || imp.aitTax || 0;
    const at = imp.at || imp.advanceTax || 0;
    const rd = imp.rd || imp.regulatoryDuty || 0;
    const dutyTotal = customDuty + vat + ait + at + rd;
    const portCharge = imp.portCharge || 0;
    const cnfCharge = imp.cnfCharge || imp.cnfCharges || 0;
    const transportation = imp.transportation || 0;
    const otherExpenses = imp.otherExpenses || imp.otherCharges || 0;
    const localExpenses = portCharge + cnfCharge + transportation + otherExpenses;
    const totalLandedCost = imp.totalLandedCost || (cif + dutyTotal + localExpenses);

    const items = imp.items || [];
    const totalQty = items.reduce((s, i) => s + i.quantity, 0) || 1;
    const landedCostPerProduct = Math.round((totalLandedCost / totalQty) * 100) / 100;

    const fullImp: ImportRecord = {
      ...imp,
      cif,
      totalLandedCost,
      items: items.map(item => ({
        ...item,
        landedCostPerUnit: landedCostPerProduct
      }))
    };

    setImportRecords(prev => {
      const exists = prev.some(i => i.id === fullImp.id);
      return exists ? prev.map(i => i.id === fullImp.id ? fullImp : i) : [fullImp, ...prev];
    });

    logActivity('Import Record Saved', `Import Reference ${fullImp.importReference} calculated. Total Landed Cost: ৳ ${totalLandedCost.toLocaleString()}`);
  };

  const saveExportRecord = (exp: ExportRecord) => {
    setExportRecords(prev => {
      const exists = prev.some(e => e.id === exp.id);
      return exists ? prev.map(e => e.id === exp.id ? exp : e) : [exp, ...prev];
    });
  };

  const saveLcRecord = (lc: LcRecord) => {
    setLcRecords(prev => {
      const exists = prev.some(l => l.id === lc.id);
      return exists ? prev.map(l => l.id === lc.id ? lc : l) : [lc, ...prev];
    });
  };

  const saveShipment = (shipment: ShipmentRecord) => {
    setShipments(prev => {
      const exists = prev.some(s => s.id === shipment.id);
      return exists ? prev.map(s => s.id === shipment.id ? shipment : s) : [shipment, ...prev];
    });
  };

  // Payments & Money Receipts
  const recordPayment = (payment: PaymentRecord) => {
    const isNew = !payments.some(p => p.id === payment.id);
    const fullPayment: PaymentRecord = {
      ...payment,
      amountInWords: numberToWordsBDT(payment.amount)
    };

    if (isNew) {
      setPayments(prev => [fullPayment, ...prev]);

      // If against an invoice, allocate and update invoice status
      if (fullPayment.invoiceId) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === fullPayment.invoiceId) {
            const newPaid = (inv.paidAmount || 0) + fullPayment.amount;
            const newDue = Math.max(0, inv.grandTotal - newPaid);
            let status: PaymentStatus = 'Partially Paid';
            if (newPaid >= inv.grandTotal) {
              status = 'Paid';
            } else if (newPaid === 0) {
              status = 'Unpaid';
            }
            return {
              ...inv,
              paidAmount: newPaid,
              balanceDue: newDue,
              paymentStatus: status,
              paymentIds: Array.from(new Set([...(inv.paymentIds || []), fullPayment.id]))
            };
          }
          return inv;
        }));
      }

      // Update customer or supplier balance
      if (fullPayment.type === 'Customer Collection') {
        setCustomers(prev => prev.map(c => c.id === fullPayment.entityId ? {
          ...c,
          currentBalance: Math.max(0, (c.currentBalance || 0) - fullPayment.amount)
        } : c));
      } else {
        setSuppliers(prev => prev.map(s => s.id === fullPayment.entityId ? {
          ...s,
          currentPayable: Math.max(0, (s.currentPayable || 0) - fullPayment.amount)
        } : s));
      }

      logActivity('Payment Recorded', `Recorded ${fullPayment.type} of ৳ ${fullPayment.amount.toLocaleString()} (Receipt: ${fullPayment.receiptNumber})`);
    } else {
      setPayments(prev => prev.map(p => p.id === fullPayment.id ? fullPayment : p));
    }
  };

  // Expenses
  const saveExpense = (expense: ExpenseRecord) => {
    setExpenses(prev => {
      const exists = prev.some(e => e.id === expense.id);
      return exists ? prev.map(e => e.id === expense.id ? expense : e) : [expense, ...prev];
    });
    logActivity('Expense Recorded', `Recorded ${expense.category} expense of ৳ ${expense.amount.toLocaleString()} (${expense.expenseNumber})`);
  };

  const deleteExpense = (id: string): boolean => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return false;
    setExpenses(prev => prev.filter(e => e.id !== id));
    logActivity('Expense Deleted', `Deleted expense ${expense.expenseNumber}`);
    return true;
  };

  // Users & RBAC
  const saveUser = (user: UserAccount) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      return exists ? prev.map(u => u.id === user.id ? user : u) : [user, ...prev];
    });
    logActivity('User Profile Updated', `Updated account for ${user.username} (${user.fullName || user.name})`);
  };

  const approveUser = (userId: string, assignedRole?: UserRole, assignedDepartment?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'Active',
          active: true,
          role: assignedRole || u.role,
          department: assignedDepartment || u.department,
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser?.name || 'Administrator'
        };
      }
      return u;
    }));
    logActivity('Account Approved', `Approved user account ID ${userId} with role ${assignedRole || 'assigned'}`);
  };

  const rejectUser = (userId: string, reason?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'Rejected',
          active: false
        };
      }
      return u;
    }));
    logActivity('Account Rejected', `Rejected user account ID ${userId}${reason ? ` (Reason: ${reason})` : ''}`);
  };

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status,
          active: status === 'Active'
        };
      }
      return u;
    }));
    logActivity('Status Changed', `Changed status for user ID ${userId} to ${status}`);
  };

  const registerUser = (newUser: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; message: string; user?: UserAccount } => {
    const cleanUser = newUser.username.trim().toLowerCase();
    const cleanEmail = newUser.email.trim().toLowerCase();

    // Check uniqueness
    const usernameTaken = users.some(u => u.username.toLowerCase() === cleanUser);
    if (usernameTaken) {
      return { success: false, message: 'Username is already taken. Please choose another.' };
    }
    const emailTaken = users.some(u => u.email.toLowerCase() === cleanEmail);
    if (emailTaken) {
      return { success: false, message: 'Email address is already registered in the system.' };
    }

    const created: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      username: cleanUser,
      email: cleanEmail,
      status: 'Pending',
      active: false, // Security: Pending users cannot access until approved by an administrator
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [created, ...prev]);
    logActivity('Registration Submitted', `New user registration submitted: ${created.username} (${created.fullName || created.name})`);
    return {
      success: true,
      message: 'Registration submitted successfully! Your account is pending administrator approval before ERP access is granted.',
      user: created
    };
  };

  const deleteUser = (id: string): boolean => {
    if (currentUser?.role !== 'Super Admin') {
      alert('Permission Denied: Only a Super Admin can delete or remove user accounts.');
      return false;
    }
    if (users.length <= 1) {
      alert('Cannot delete the only remaining user account.');
      return false;
    }
    const target = users.find(u => u.id === id);
    if (target?.id === currentUser?.id) {
      alert('You cannot delete your own Super Admin account.');
      return false;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity('User Deleted', `Super Admin deleted user account ${target?.username || id}`);
    return true;
  };

  // Backup & Restore
  const exportDatabaseBackup = (): string => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings,
      categories,
      products,
      customers,
      suppliers,
      invoices,
      deliverySlips,
      deliveryReturns,
      purchaseInvoices,
      quotations,
      salesOrders,
      purchaseOrders,
      deliveryChallans,
      proformaInvoices,
      commercialInvoices,
      importRecords,
      exportRecords,
      lcRecords,
      shipments,
      payments,
      expenses,
      stockMovements,
      users,
      activityLogs
    };
    logActivity('Backup Created', 'Generated full JSON system backup');
    return JSON.stringify(backupData, null, 2);
  };

  const restoreDatabaseBackup = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.settings || !data.customers || !data.products) {
        alert('Invalid backup file format.');
        return false;
      }
      if (data.settings) setSettings(data.settings);
      if (data.categories) setCategories(data.categories);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.invoices) setInvoices(data.invoices);
      if (data.deliverySlips) setDeliverySlips(data.deliverySlips);
      if (data.deliveryReturns) setDeliveryReturns(data.deliveryReturns);
      if (data.purchaseInvoices) setPurchaseInvoices(data.purchaseInvoices);
      if (data.quotations) setQuotations(data.quotations);
      if (data.salesOrders) setSalesOrders(data.salesOrders);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.deliveryChallans) setDeliveryChallans(data.deliveryChallans);
      if (data.proformaInvoices) setProformaInvoices(data.proformaInvoices);
      if (data.commercialInvoices) setCommercialInvoices(data.commercialInvoices);
      if (data.importRecords) setImportRecords(data.importRecords);
      if (data.exportRecords) setExportRecords(data.exportRecords);
      if (data.lcRecords) setLcRecords(data.lcRecords);
      if (data.shipments) setShipments(data.shipments);
      if (data.payments) setPayments(data.payments);
      if (data.expenses) setExpenses(data.expenses);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.users) setUsers(data.users);
      if (data.activityLogs) setActivityLogs(data.activityLogs);

      logActivity('Database Restored', 'Full system database restored from backup file.');
      return true;
    } catch (err) {
      console.error(err);
      alert('Error parsing backup file: ' + (err as Error).message);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setSettings(initialCompanySettings);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setInvoices(initialInvoices);
    setDeliverySlips(initialDeliverySlips);
    setDeliveryReturns([]);
    setPurchaseInvoices(initialPurchaseInvoices);
    setQuotations(initialQuotations);
    setSalesOrders(initialSalesOrders);
    setPurchaseOrders(initialPurchaseOrders);
    setDeliveryChallans(initialDeliveryChallans);
    setProformaInvoices(initialProformaInvoices);
    setCommercialInvoices(initialCommercialInvoices);
    setImportRecords(initialImportRecords);
    setExportRecords(initialExportRecords);
    setLcRecords(initialLcRecords);
    setShipments(initialShipments);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setStockMovements([]);
    setUsers(initialUsers);
    setActivityLogs(initialActivityLogs);
    localStorage.clear();
    logActivity('System Reset', 'Reset database to factory demonstration seed data.');
  };

  return (
    <DataContext.Provider
      value={{
        dateFilterPeriod,
        setDateFilterPeriod,
        settings,
        updateSettings,
        categories,
        products,
        customers,
        suppliers,
        invoices,
        deliverySlips,
        deliveryReturns,
        purchaseInvoices,
        quotations,
        salesOrders,
        purchaseOrders,
        deliveryChallans,
        proformaInvoices,
        commercialInvoices,
        importRecords,
        exportRecords,
        lcRecords,
        shipments,
        payments,
        expenses,
        stockMovements,
        users,
        currentUser,
        setCurrentUser,
        activityLogs,
        logActivity,
        saveCustomer,
        deleteCustomer,
        saveSupplier,
        deleteSupplier,
        saveProduct,
        deleteProduct,
        saveCategory,
        adjustStock,
        saveInvoice,
        deleteInvoice,
        createDeliverySlipForInvoice,
        updateDeliverySlip,
        deleteDeliverySlip,
        updateDeliverySlipStatus,
        recordDeliveryReturn,
        savePurchaseInvoice,
        deletePurchaseInvoice,
        saveQuotation,
        convertQuotationToInvoice,
        saveSalesOrder,
        convertSalesOrderToInvoice,
        savePurchaseOrder,
        convertPurchaseOrderToInvoice,
        saveDeliveryChallan,
        saveProformaInvoice,
        convertPiToCommercialInvoice,
        convertPiToSalesInvoice,
        saveCommercialInvoice,
        saveImportRecord,
        saveExportRecord,
        saveLcRecord,
        saveShipment,
        recordPayment,
        saveExpense,
        deleteExpense,
        saveUser,
        deleteUser,
        approveUser,
        rejectUser,
        updateUserStatus,
        registerUser,
        exportDatabaseBackup,
        restoreDatabaseBackup,
        resetToDefaultData,
        getNextNumber
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
