import {
  CompanySettings,
  Customer,
  Supplier,
  ProductCategory,
  Product,
  SalesInvoice,
  DeliverySlip,
  PurchaseInvoice,
  Quotation,
  SalesOrder,
  PurchaseOrder,
  ProformaInvoice,
  CommercialInvoice,
  ImportRecord,
  ExportRecord,
  LcRecord,
  ShipmentRecord,
  PaymentRecord,
  ExpenseRecord,
  StockMovement,
  UserAccount,
  ActivityLog,
  DeliveryChallan
} from '../types';

export const initialCompanySettings: CompanySettings = {
  companyName: 'Bismillah Multitrade Corporation',
  businessType: 'Import & Export Concern / Trading Company',
  address: 'Ananda Nibash, South Shewrapara, Mirpur, Dhaka-1216, Bangladesh',
  phonePrimary: '+880 1312-893729',
  phoneSecondary: '+880 1400-967693',
  email: 'info@bismillahmultitrade.com',
  website: 'www.bismillahmultitrade.com',
  defaultCountry: 'Bangladesh',
  defaultCurrency: 'BDT',
  
  binNumber: '',
  tinNumber: '',
  tradeLicenseNumber: '',
  ircNumber: '',
  ercNumber: '',
  membershipNumber: '',
  vatRegistrationNumber: '',
  
  bankName: '',
  accountName: '',
  accountNumber: '',
  branchName: '',
  routingNumber: '',
  swiftCode: '',
  
  bkashNumber: '',
  nagadNumber: '',
  rocketNumber: '',
  
  authorizedSignatureName: 'BISMILLAH MULTITRADE CORPORATION',
  authorizedSignatureTitle: '',
  companySealText: 'BISMILLAH MULTITRADE CORPORATION',
  termsAndConditions: '1. All payments must be made to Bismillah Multitrade Corporation official accounts.\n2. Goods once sold and delivered in good condition will not be returned unless covered under manufacturing warranty.\n3. Discrepancies in goods or delivery slip must be reported in writing within 48 hours.',
  deliverySlipNote: 'Goods received in good condition unless otherwise stated.',
  
  reduceStockAt: 'delivery_confirmation',
  showPriceOnDeliverySlip: false,
  deliverySlipNumbering: 'sequential',
  
  invoicePrefix: 'INV_2026-',
  deliverySlipPrefix: 'DS-2026-',
  quotationPrefix: 'QT-2026-',
  piPrefix: 'PI-2026-',
  commercialInvoicePrefix: 'CI-2026-',
  moneyReceiptPrefix: 'MR-2026-',
  purchaseOrderPrefix: 'PO-2026-',
  salesOrderPrefix: 'SO-2026-',
  challanPrefix: 'DC-2026-',
  importPrefix: 'IMP-2026-',
  exportPrefix: 'EXP-2026-',
  expensePrefix: 'EXPNS-2026-',
  purchaseInvoicePrefix: 'PINV-2026-'
};

export const initialCategories: ProductCategory[] = [
  { id: 'cat-balm', name: 'Pain Relief Balm & Healthcare', description: '' }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-burmis-pain-relief',
    productId: 'PRD-0001',
    sku: 'BPRB-001',
    productCode: 'PRD-0001',
    productName: 'BURMIS PAIN RELIEF BALM',
    categoryId: 'cat-balm',
    categoryName: 'Pain Relief Balm & Healthcare',
    category: 'Pain Relief Balm & Healthcare',
    brand: 'Burmis',
    description: '',
    hsCode: '3004.90.00',
    countryOfOrigin: 'Bangladesh',
    originCountry: 'Bangladesh',
    unit: 'Pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    stockQuantity: 0,
    reservedStock: 0,
    minimumStock: 0,
    minStockLevel: 0,
    warehouseLocation: 'Dhaka Warehouse',
    vatRate: 0,
    taxRate: 0,
    weight: 0,
    cbm: 0,
    status: 'Active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  }
];

export const initialCustomers: Customer[] = [];
export const initialSuppliers: Supplier[] = [];
export const initialInvoices: SalesInvoice[] = [];
export const initialDeliverySlips: DeliverySlip[] = [];
export const initialPurchaseInvoices: PurchaseInvoice[] = [];
export const initialQuotations: Quotation[] = [];
export const initialSalesOrders: SalesOrder[] = [];
export const initialPurchaseOrders: PurchaseOrder[] = [];
export const initialProformaInvoices: ProformaInvoice[] = [];
export const initialCommercialInvoices: CommercialInvoice[] = [];
export const initialImportRecords: ImportRecord[] = [];
export const initialExportRecords: ExportRecord[] = [];
export const initialLcRecords: LcRecord[] = [];
export const initialShipments: ShipmentRecord[] = [];
export const initialPayments: PaymentRecord[] = [];
export const initialExpenses: ExpenseRecord[] = [];
export const initialStockMovements: StockMovement[] = [];
export const initialUsers: UserAccount[] = [
  {
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
    registeredAt: '2026-01-01',
    approvedAt: '2026-01-01',
    approvedBy: 'System',
    lastLoginAt: '2026-10-14 09:30 AM',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-mgr-rafiq',
    name: 'Md. Rafiqul Islam',
    fullName: 'Md. Rafiqul Islam',
    username: 'rafiqul',
    email: 'rafiqul@bismillah.com',
    phone: '+880 1711-456789',
    employeeId: 'EMP-002',
    department: 'Administration',
    designation: 'General Manager',
    role: 'Admin',
    status: 'Active',
    active: true,
    permissions: ['Manage Users', 'Approve Registrations', 'View Financial Reports', 'Manage Inventory', 'Manage Settings'],
    registeredAt: '2026-01-05',
    approvedAt: '2026-01-05',
    approvedBy: 'Zia Ahmed',
    lastLoginAt: '2026-10-14 08:45 AM',
    createdAt: '2026-01-05'
  },
  {
    id: 'usr-acc-tahmina',
    name: 'Tahmina Akhter',
    fullName: 'Tahmina Akhter',
    username: 'tahmina',
    email: 'accounts@bismillah.com',
    phone: '+880 1912-345678',
    employeeId: 'EMP-003',
    department: 'Accounts & Finance',
    designation: 'Senior Accountant',
    role: 'Accountant',
    status: 'Active',
    active: true,
    permissions: ['View Financial Reports', 'Manage Money Receipts', 'Manage Expenses', 'View Receivables', 'View Payables'],
    registeredAt: '2026-01-10',
    approvedAt: '2026-01-11',
    approvedBy: 'Zia Ahmed',
    lastLoginAt: '2026-10-14 09:15 AM',
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-sales-kamal',
    name: 'Kamal Hossain',
    fullName: 'Kamal Hossain',
    username: 'kamal',
    email: 'sales@bismillah.com',
    phone: '+880 1611-987654',
    employeeId: 'EMP-004',
    department: 'Sales',
    designation: 'Sales Executive',
    role: 'Sales Executive',
    status: 'Active',
    active: true,
    permissions: ['Create Invoices', 'Manage Customers', 'View Sales Records'],
    registeredAt: '2026-01-15',
    approvedAt: '2026-01-16',
    approvedBy: 'Md. Rafiqul Islam',
    lastLoginAt: '2026-10-13 04:30 PM',
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-inv-faruk',
    name: 'Faruk Ahmed',
    fullName: 'Faruk Ahmed',
    username: 'faruk',
    email: 'inventory@bismillah.com',
    phone: '+880 1515-334455',
    employeeId: 'EMP-005',
    department: 'Inventory',
    designation: 'Warehouse In-Charge',
    role: 'Inventory Manager',
    status: 'Active',
    active: true,
    permissions: ['Manage Products', 'Manage Stock', 'Track Stock Movement'],
    registeredAt: '2026-01-20',
    approvedAt: '2026-01-21',
    approvedBy: 'Zia Ahmed',
    lastLoginAt: '2026-10-14 08:00 AM',
    createdAt: '2026-01-20'
  },
  {
    id: 'usr-del-nasir',
    name: 'Nasir Uddin',
    fullName: 'Nasir Uddin',
    username: 'nasir',
    email: 'delivery@bismillah.com',
    phone: '+880 1822-667788',
    employeeId: 'EMP-006',
    department: 'Delivery & Logistics',
    designation: 'Logistics Supervisor',
    role: 'Delivery Executive',
    status: 'Active',
    active: true,
    permissions: ['View Delivery Slips', 'Update Delivery Status'],
    registeredAt: '2026-02-01',
    approvedAt: '2026-02-02',
    approvedBy: 'Md. Rafiqul Islam',
    lastLoginAt: '2026-10-14 07:45 AM',
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-pend-mustafiz',
    name: 'Mustafizur Rahman',
    fullName: 'Mustafizur Rahman',
    username: 'mustafiz',
    email: 'mustafizur@bismillah.com',
    phone: '+880 1733-445566',
    employeeId: 'EMP-007',
    department: 'Sales',
    designation: 'Field Sales Officer',
    role: 'Sales Executive',
    status: 'Pending',
    active: false,
    permissions: ['Create Invoices', 'Manage Customers'],
    registeredAt: '2026-10-13 11:20 AM',
    createdAt: '2026-10-13'
  },
  {
    id: 'usr-susp-anis',
    name: 'Anisul Haque',
    fullName: 'Anisul Haque',
    username: 'anisul',
    email: 'anisul@bismillah.com',
    phone: '+880 1844-556677',
    employeeId: 'EMP-008',
    department: 'Inventory',
    designation: 'Assistant Storekeeper',
    role: 'Inventory Manager',
    status: 'Suspended',
    active: false,
    permissions: ['Manage Stock'],
    registeredAt: '2026-02-15',
    approvedAt: '2026-02-16',
    approvedBy: 'Zia Ahmed',
    lastLoginAt: '2026-09-28 02:10 PM',
    createdAt: '2026-02-15'
  }
];

export const initialUserAccounts: UserAccount[] = initialUsers;
export const initialDeliveryChallans: DeliveryChallan[] = [];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-001',
    user: 'admin (Zia Ahmed)',
    action: 'Successful Login',
    date: '2026-10-14',
    time: '09:30 AM',
    details: 'Logged into ERP Management Console',
    ip: '192.168.1.10'
  },
  {
    id: 'log-002',
    user: 'mustafiz (Mustafizur Rahman)',
    action: 'Registration Submitted',
    date: '2026-10-13',
    time: '11:20 AM',
    details: 'New user registration for Sales Department (Status: Pending Approval)',
    ip: '103.220.204.15'
  },
  {
    id: 'log-003',
    user: 'admin (Zia Ahmed)',
    action: 'Role & Permission Assignment',
    date: '2026-10-12',
    time: '03:15 PM',
    details: 'Updated role permissions for Delivery Executive team',
    ip: '192.168.1.10'
  },
  {
    id: 'log-004',
    user: 'tahmina (Tahmina Akhter)',
    action: 'Payment Recorded',
    date: '2026-10-12',
    time: '02:00 PM',
    details: 'Recorded customer money receipt MR-2026-003 of BDT 14,000.40',
    ip: '192.168.1.15'
  },
  {
    id: 'log-005',
    user: 'kamal (Kamal Hossain)',
    action: 'Invoice Created',
    date: '2026-10-11',
    time: '10:45 AM',
    details: 'Generated Sales Invoice INV-2026-004 for Prime Pharmaceuticals Ltd',
    ip: '192.168.1.18'
  }
];
