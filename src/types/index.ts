export type CustomerType = 'Local' | 'International' | 'Corporate' | 'Individual' | 'Dealer' | 'Distributor' | 'Retail' | 'Wholesale';

export interface Customer {
  id: string;
  customerId: string;
  customerType: CustomerType;
  customerName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  alternativePhone?: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  district: string;
  country: string;
  postalCode: string;
  bin?: string;
  tin?: string;
  binNumber?: string;
  tinNumber?: string;
  taxId?: string;
  tradeLicense?: string;
  openingBalance: number;
  creditLimit: number;
  paymentTerms: string;
  notes?: string;
  currentBalance: number; // Positive = customer owes us (Receivable)
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  supplierId: string;
  supplierName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId?: string;
  vatNumber?: string;
  binNumber?: string;
  tinNumber?: string;
  supplierType?: string;
  bankName?: string;
  bankAccount?: string;
  swiftCode?: string;
  paymentTerms: string;
  openingBalance: number;
  currency: string;
  notes?: string;
  currentPayable: number; // Positive = we owe supplier (Payable)
  currentBalance?: number; // Alias for currentPayable
  totalDue?: number; // Total unpaid due amount
  orderedProductQty?: number; // Total ordered quantity
  deliveredProductQty?: number; // Total delivered quantity
  suppliedProductQty?: number; // Alias for product quantity
  createdAt: string;
  updatedAt: string;
}

export type UnitType =
  | 'PCS'
  | 'KG'
  | 'Gram'
  | 'Ton'
  | 'Liter'
  | 'ML'
  | 'Meter'
  | 'Feet'
  | 'Box'
  | 'Carton'
  | 'Bag'
  | 'Set'
  | 'Pair'
  | 'Dozen'
  | 'Bundle'
  | 'Roll'
  | 'Package'
  | 'Unit'
  | 'Service'
  | string;

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  description: string;
  hsCode: string;
  countryOfOrigin: string;
  originCountry?: string; // Alias
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  unit: UnitType;
  stockQuantity: number;
  reservedStock: number;
  minimumStock: number;
  minStockLevel?: number; // Alias
  productCode?: string; // Alias
  category?: string; // Alias
  warehouseLocation?: string; // Depot location
  taxRate: number; // percentage
  vatRate: number; // percentage
  weight: number; // kg
  cbm: number;
  barcode?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  hsCode: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  vatRate: number; // percentage
  taxRate: number; // percentage
  amount: number; // line total after discount, tax, vat
}

export type PaymentStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
export type DeliveryStatus =
  | 'Dispatched'
  | 'Delivered'
  | 'Scheduled'
  | 'Not Prepared'
  | 'Ready for Delivery'
  | 'Partially Delivered'
  | 'In Transit'
  | 'Returned'
  | 'Cancelled';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  companyName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerBin?: string;
  customerTin?: string;
  referenceNumber?: string;
  poNumber?: string;
  salesPerson?: string;
  currency: string;
  exchangeRate: number; // relative to BDT (1 if BDT)
  paymentTerms: string;
  remarks?: string;
  
  items: InvoiceItem[];
  
  subtotal: number;
  itemDiscount: number;
  overallDiscount: number;
  vatAmount: number;
  taxAmount: number;
  aitAmount: number;
  shippingCharge: number;
  transportCharge: number;
  loadingCharge: number;
  otherCharge: number;
  previousDue: number;
  roundAdjustment: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  amountInWords: string;
  
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  showPaymentDetails?: boolean; // When ticked, payment info & paid/due are shown on invoice
  
  deliverySlipIds: string[];
  paymentIds: string[];
  
  createdAt: string;
  updatedAt: string;
}

export type DeliveryMethod =
  | 'Courier'
  | 'Own Pickup van'
  | 'Transport'
  | 'Company Transport'
  | 'Customer Pickup'
  | 'Truck'
  | 'Pickup'
  | 'Van'
  | string;

export interface DeliverySlipItem {
  id: string;
  invoiceItemId: string;
  productId: string;
  productName: string;
  description: string;
  unit: UnitType;
  orderedQuantity: number;
  previouslyDelivered: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  boxCount?: number | string;
  boxes?: number | string;
  weight?: number | string;
  unitPrice?: number;
  amount?: number;
  remarks?: string;
}

export interface DeliverySlip {
  id: string;
  deliverySlipNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  deliveryDate: string;
  expectedDeliveryDate?: string;
  
  customerId: string;
  customerName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  deliveryAddress: string;
  shippingAddress?: string;
  
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  deliveryPerson?: string;
  deliveryMethod: DeliveryMethod;
  warehouse?: string;
  referenceNumber?: string;
  poNumber?: string;
  
  remarks?: string;
  deliveryInstructions?: string;
  
  items: DeliverySlipItem[];
  
  totalBoxes?: string;
  totalWeight?: string;
  
  deliveryStatus: DeliveryStatus;
  
  receivedBy?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverDesignation?: string;
  receivedDate?: string;
  receivedTime?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryReturn {
  id: string;
  deliverySlipId: string;
  deliverySlipNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  returnDate?: string;
  productId: string;
  productName: string;
  deliveredQty?: number;
  returnQty: number;
  reason: string;
  returnType: 'Full Return' | 'Partial Return' | 'Damaged Return';
  date?: string;
  receivedBy?: string;
  unit?: UnitType;
  inspectedBy?: string;
  actionTaken?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  hsCode: string;
  quantity: number;
  unit: UnitType;
  purchasePrice: number;
  tax: number;
  vat: number;
  amount: number;
}

export interface PurchaseInvoice {
  id: string;
  purchaseInvoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  companyName: string;
  date: string;
  dueDate: string;
  purchaseOrder?: string;
  currency: string;
  exchangeRate: number;
  importReference?: string;
  lcReference?: string;
  notes?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  vatAmount: number;
  otherCharge: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  quotationDate: string;
  validityDate: string;
  currency: string;
  exchangeRate: number;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  terms: string;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrder {
  id: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  orderDate: string;
  expectedDelivery: string;
  currency: string;
  items: InvoiceItem[];
  grandTotal: number;
  terms: string;
  notes?: string;
  status: 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled';
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  poDate: string;
  expectedDelivery: string;
  currency: string;
  items: PurchaseInvoiceItem[];
  grandTotal: number;
  terms: string;
  notes?: string;
  status: 'Draft' | 'Approved' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  convertedToPurchaseInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  invoiceReference: string;
  deliveryDate: string;
  vehicleNumber?: string;
  driver?: string;
  deliveryAddress: string;
  items: {
    productName: string;
    description: string;
    quantity: number;
    unit: UnitType;
    unitPrice?: number;
    amount?: number;
  }[];
  showPrice: boolean;
  receivedBy?: string;
  deliveredBy?: string;
  createdAt: string;
}

export type Incoterm =
  | 'EXW'
  | 'FCA'
  | 'FOB'
  | 'CFR'
  | 'CIF'
  | 'CPT'
  | 'CIP'
  | 'DAP'
  | 'DPU'
  | 'DDP';

export interface ProformaInvoice {
  id: string;
  piNumber: string;
  sellerInfo: string;
  buyerInfo: string;
  buyerName: string;
  piDate: string;
  validityDate: string;
  currency: string;
  exchangeRate: number;
  countryOfOrigin: string;
  countryOfDestination: string;
  portOfLoading: string;
  portOfDischarge: string;
  shipmentMethod: string;
  paymentTerms: string;
  incoterm: Incoterm;
  deliveryTime: string;
  lcInformation?: string;
  items: {
    sl: number;
    productName: string;
    description: string;
    hsCode: string;
    quantity: number;
    unit: UnitType;
    unitPrice: number;
    total: number;
  }[];
  fobValue: number;
  freight: number;
  insurance: number;
  cfr: number;
  cif: number;
  discount: number;
  otherCharges: number;
  grandTotal: number;
  createdAt: string;
}

export interface CommercialInvoice {
  id: string;
  commercialInvoiceNumber: string;
  invoiceDate: string;
  exporter: string;
  consignee: string;
  notifyParty: string;
  buyer: string;
  countryOfOrigin: string;
  countryOfDestination: string;
  lcNumber?: string;
  lcDate?: string;
  expNumber?: string;
  irc?: string;
  erc?: string;
  bankInformation: string;
  shipmentMethod: string;
  vesselFlightName: string;
  voyageNumber?: string;
  portOfLoading: string;
  portOfDischarge: string;
  blAwbNumber: string;
  containerNumber?: string;
  sealNumber?: string;
  incoterm: Incoterm;
  paymentTerms: string;
  items: {
    sl: number;
    description: string;
    hsCode: string;
    countryOfOrigin: string;
    quantity: number;
    unit: UnitType;
    unitPrice: number;
    totalPrice: number;
    netWeight: number;
    grossWeight: number;
  }[];
  totalQuantity: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  fob: number;
  freight: number;
  insurance: number;
  cifValue: number;
  grandTotal: number;
  createdAt: string;
}

export interface ImportRecord {
  id: string;
  importReference: string;
  supplierId: string;
  supplierName: string;
  supplierCountry?: string;
  piNumber?: string;
  lcNumber: string;
  lcOpeningDate?: string;
  lcValue?: number;
  currency: string;
  exchangeRate: number;
  bank?: string;
  branch?: string;
  shipmentDate?: string;
  arrivalDate?: string;
  etd?: string;
  eta?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  portOfEntry?: string;
  billOfEntryNumber?: string;
  shippingLine?: string;
  vessel?: string;
  containerNumber?: string;
  blNumber?: string;
  hsCode?: string;
  itemDescription?: string;
  items?: {
    productName: string;
    hsCode: string;
    quantity: number;
    unit: UnitType;
    fobUnitPrice: number;
    fobTotal: number;
    landedCostPerUnit?: number;
  }[];
  fob?: number;
  freight?: number;
  insurance?: number;
  cif?: number;
  cifValueForeign?: number;
  cifValueBDT?: number;
  customDuty?: number; // CD
  customsDuty?: number; // CD alias
  vat?: number;
  vatTax?: number; // VAT alias
  ait?: number;
  aitTax?: number; // AIT alias
  at?: number; // Advance Tax
  advanceTax?: number; // AT alias
  rd?: number; // Regulatory Duty
  regulatoryDuty?: number; // RD alias
  portCharge?: number;
  cnfCharge?: number;
  cnfCharges?: number;
  shippingCharges?: number;
  transportation?: number;
  otherExpenses?: number;
  otherCharges?: number;
  totalLandedCost: number;
  status: 'In Planning' | 'LC Opened' | 'Shipped' | 'Customs Clearance' | 'Warehoused' | 'Completed' | 'Arrived at Warehouse';
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  exportReference: string;
  buyerName: string;
  destinationCountry: string;
  piNumber: string;
  lcNumber: string;
  commercialInvoiceNumber: string;
  expNumber: string;
  shipmentDate: string;
  portOfLoading: string;
  portOfDestination: string;
  shippingLine: string;
  containerNumber: string;
  blAwbNumber: string;
  currency: string;
  exchangeRate: number;
  exportValue: number;
  freight: number;
  insurance: number;
  fob: number;
  cfr: number;
  cif: number;
  paymentReceived: number;
  balanceReceivable: number;
  status: 'Order Confirmed' | 'Production' | 'Shipped' | 'Documents Sent' | 'Payment Settled';
  createdAt: string;
}

export type LcStatus =
  | 'Draft'
  | 'Opened'
  | 'Open'
  | 'Active'
  | 'Under Process'
  | 'Partially Utilized'
  | 'Fully Utilized'
  | 'Expired'
  | 'Cancelled'
  | 'Closed';

export interface LcRecord {
  id: string;
  lcNumber: string;
  lcType: 'Sight' | 'Usance' | 'Deferred' | 'Transferable' | 'Back to Back';
  lcDate: string;
  expiryDate: string;
  applicant: string;
  beneficiary: string;
  issuingBank: string;
  advisingBank: string;
  lcCurrency: string;
  lcAmount: number;
  exchangeRate: number;
  piNumber: string;
  shipmentDeadline: string;
  documentsSubmissionDeadline: string;
  status: LcStatus;
  utilizedAmount: number;
  balanceAmount: number;
  notes?: string;
  createdAt: string;
}

export type ShipmentType = 'Sea' | 'Air' | 'Road' | 'Courier';
export type ShipmentStatus =
  | 'Booking'
  | 'In Transit'
  | 'Arrived'
  | 'Customs Clearance'
  | 'Released'
  | 'Delivered';

export interface ShipmentRecord {
  id: string;
  shipmentId: string;
  importExportReference: string;
  shipmentType: ShipmentType;
  shippingCompany: string;
  freightForwarder: string;
  vesselName?: string;
  flightNumber?: string;
  voyageNumber?: string;
  containerNumber?: string;
  containerType?: string; // 20ft, 40ft, 40ft HC, etc.
  sealNumber?: string;
  blNumber?: string;
  awbNumber?: string;
  etd: string;
  eta: string;
  actualArrival?: string;
  portOfLoading: string;
  portOfDischarge: string;
  shipmentStatus: ShipmentStatus;
  status?: string; // Alias
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Cheque'
  | 'Credit Card'
  | 'Debit Card'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Mobile Banking'
  | 'LC'
  | 'TT'
  | 'Pay Order'
  | 'Other';

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // MR-2026-0001
  type: 'Customer Collection' | 'Supplier Payment';
  entityId: string; // Customer or Supplier ID
  entityName: string;
  date: string;
  paymentDate?: string; // Alias
  amount: number;
  amountInWords: string;
  currency?: string;
  paymentMethod: PaymentMethod;
  bank?: string;
  account?: string;
  chequeNumber?: string;
  transactionId?: string;
  reference?: string;
  transactionReference?: string; // Alias
  invoiceId?: string;
  invoiceNumber?: string;
  totalAmount?: number; // Total invoice or bill grand total
  paidAmount?: number; // Cumulative paid amount including this receipt
  dueAmount?: number; // Remaining balance due after this receipt
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid'; // Clean payment status enum
  receivedBy: string;
  collectedBy?: string; // Alias
  authorizedSignature?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'Office Rent'
  | 'Rent & Office Premises'
  | 'Salary'
  | 'Staff Salaries & Wages'
  | 'Electricity'
  | 'Electricity & Utilities'
  | 'Internet'
  | 'Transport'
  | 'Transportation & Fuel'
  | 'Freight'
  | 'C&F'
  | 'C&F & Customs Port Demurrage'
  | 'Customs'
  | 'Port Charge'
  | 'Bank Charge'
  | 'LC Charge'
  | 'Trade License & Government Fees'
  | 'Entertainment & Tea'
  | 'Other Miscellaneous'
  | 'Courier'
  | 'Loading'
  | 'Unloading'
  | 'Marketing'
  | 'Maintenance'
  | 'Travel'
  | 'Other'
  | string;

export interface ExpenseItem {
  id: string;
  particulars: string;
  category?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  amount: number;
}

export interface ExpenseRecord {
  id: string;
  expenseNumber?: string; // EXPNS-2026-0001
  voucherNumber?: string; // Voucher Alias
  date?: string;
  expenseDate?: string; // Date Alias
  category: ExpenseCategory | string;
  description?: string;
  paidTo?: string;
  amount: number;
  items?: ExpenseItem[];
  subtotal?: number;
  currency?: string;
  paymentMethod: PaymentMethod | string;
  reference?: string;
  referenceNumber?: string;
  phone?: string;
  payeePhone?: string;
  approvedBy?: string;
  preparedBy?: string;
  checkedBy?: string;
  supplierId?: string;
  supplierName?: string;
  importReference?: string;
  exportReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StockMovementType =
  | 'Opening'
  | 'Purchase'
  | 'Sales'
  | 'Sales Return'
  | 'Purchase Return'
  | 'Adjustment In'
  | 'Adjustment Out'
  | 'Damage'
  | 'Transfer';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceNumber: string; // e.g. INV-..., DS-..., PINV-...
  notes?: string;
  createdBy: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Accountant'
  | 'Sales Executive'
  | 'Inventory Manager'
  | 'Delivery Executive'
  | 'Sales'
  | 'Purchase'
  | 'Store'
  | 'Cashier'
  | 'Viewer';

export type UserStatus = 'Pending' | 'Active' | 'Suspended' | 'Rejected' | 'Deactivated';

export type UserDepartment =
  | 'Administration'
  | 'Accounts & Finance'
  | 'Sales'
  | 'Purchase'
  | 'Inventory'
  | 'Delivery & Logistics'
  | 'Management';

export interface UserAccount {
  id: string;
  name: string;
  fullName?: string;
  username: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: UserDepartment | string;
  designation?: string;
  role: UserRole;
  status?: UserStatus;
  permissions: string[];
  active: boolean;
  avatarUrl?: string;
  emailVerified?: boolean;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  date: string;
  time: string;
  details: string;
  ip?: string;
}

export interface CompanySettings {
  companyName: string;
  businessType: string;
  address: string;
  phonePrimary: string;
  phoneSecondary: string;
  phone?: string; // Unified phone alias
  email: string;
  website: string;
  defaultCountry: string;
  country?: string; // Country alias
  defaultCurrency: string;
  logoUrl?: string;
  signatureUrl?: string;
  sealUrl?: string;
  
  // Tax / Registration
  binNumber: string;
  tinNumber: string;
  tradeLicenseNumber: string;
  ircNumber: string;
  ercNumber: string;
  membershipNumber: string;
  vatRegistrationNumber: string;
  
  // Banking
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  swiftCode: string;
  
  // Mobile Banking
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  
  // Authorization / Seals
  authorizedSignatureName: string;
  authorizedSignatureTitle: string;
  companySealText: string;
  termsAndConditions: string;
  deliverySlipNote: string;
  
  // Behavior Settings
  reduceStockAt: 'delivery_confirmation' | 'invoice_confirmation';
  showPriceOnDeliverySlip: boolean;
  deliverySlipNumbering: 'sequential' | 'linked_to_invoice';
  
  // Prefixes
  invoicePrefix: string;
  deliverySlipPrefix: string;
  quotationPrefix: string;
  piPrefix: string;
  commercialInvoicePrefix: string;
  moneyReceiptPrefix: string;
  purchaseOrderPrefix: string;
  salesOrderPrefix: string;
  challanPrefix: string;
  importPrefix: string;
  exportPrefix: string;
  expensePrefix: string;
  purchaseInvoicePrefix: string;
}
