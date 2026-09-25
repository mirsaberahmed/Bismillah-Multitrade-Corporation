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
  
  invoicePrefix: 'INV-2026-',
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
export const initialUsers: UserAccount[] = [];
export const initialUserAccounts: UserAccount[] = [];
export const initialDeliveryChallans: DeliveryChallan[] = [];
export const initialActivityLogs: ActivityLog[] = [];
