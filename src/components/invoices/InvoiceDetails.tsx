import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  FileText,
  Truck,
  CreditCard,
  History,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit,
  Download,
  Share2,
  DollarSign,
  Package,
  Calendar,
  Clock,
  User,
  X,
  Trash2,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  SalesInvoice,
  DeliverySlip,
  DeliveryStatus,
  PaymentRecord,
  DeliveryReturn
} from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { PrintableInvoice } from '../documents/PrintableInvoice';
import { PrintableDeliverySlip } from '../documents/PrintableDeliverySlip';
import { PrintableMoneyReceipt } from '../documents/PrintableMoneyReceipt';
import { DeliverySlipModal } from '../delivery/DeliverySlipModal';
import { InvoicePrintModal } from './InvoicePrintModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { printElement } from '../../utils/printHelper';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateInvoiceWhatsAppText, generateDeliverySlipWhatsAppText } from '../../utils/whatsapp';

interface Props {
  invoiceId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

type TabType = 'overview' | 'delivery' | 'payments' | 'activity';

export const InvoiceDetails: React.FC<Props> = ({ invoiceId, onBack, onEdit }) => {
  const {
    settings,
    invoices,
    deliverySlips,
    deliveryReturns,
    payments,
    activityLogs,
    createDeliverySlipForInvoice,
    updateDeliverySlip,
    deleteDeliverySlip,
    deleteInvoice,
    updateDeliverySlipStatus,
    recordDeliveryReturn,
    recordPayment,
    getNextNumber
  } = useData();

  const invoice = invoices.find(i => i.id === invoiceId);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [printMode, setPrintMode] = useState<'none' | 'invoice' | 'slip' | 'combo' | 'receipt'>('none');
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<DeliverySlip | null>(null);
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<PaymentRecord | null>(null);
  const [showInvoicePrintModal, setShowInvoicePrintModal] = useState(false);
  const [activeSlipModal, setActiveSlipModal] = useState<{ slip: DeliverySlip; mode: 'view' | 'edit' } | null>(null);
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);
  const [slipToDelete, setSlipToDelete] = useState<DeliverySlip | null>(null);

  // Delivery Slip Modal State
  const [showCreateSlipModal, setShowCreateSlipModal] = useState(false);
  const [customSlipNumber, setCustomSlipNumber] = useState('');
  const [slipDeliveryDate, setSlipDeliveryDate] = useState(getTodayDateString());
  const [slipStatus, setSlipStatus] = useState<DeliveryStatus>('Dispatched');
  const [slipReceiverName, setSlipReceiverName] = useState('');
  const [slipReceiverPhone, setSlipReceiverPhone] = useState('');
  const [slipVehicle, setSlipVehicle] = useState('');
  const [slipDriverName, setSlipDriverName] = useState('');
  const [slipDriverPhone, setSlipDriverPhone] = useState('');
  const [slipMethod, setSlipMethod] = useState('Courier');
  const [slipWarehouse, setSlipWarehouse] = useState('Mirpur Central Depot, Dhaka');
  const [slipRemarks, setSlipRemarks] = useState('');
  const [slipInstructions, setSlipInstructions] = useState('');
  const [slipAddress, setSlipAddress] = useState(invoice?.customerAddress || '');
  const [slipContactPerson, setSlipContactPerson] = useState(invoice?.customerName || '');
  const [slipPhone, setSlipPhone] = useState(invoice?.customerPhone || '');
  const [selectedSlipForPdf, setSelectedSlipForPdf] = useState<DeliverySlip | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Item quantities, boxes, weights to deliver in this slip
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});
  const [itemBoxCounts, setItemBoxCounts] = useState<Record<string, string>>({});
  const [itemWeights, setItemWeights] = useState<Record<string, string>>({});
  const [slipTotalBoxes, setSlipTotalBoxes] = useState('');
  const [slipTotalWeight, setSlipTotalWeight] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(invoice?.balanceDue || 0);
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'bKash' | 'Nagad'>('Bank Transfer');
  const [paymentTxnRef, setPaymentTxnRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Delivery Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSlip, setReturnSlip] = useState<DeliverySlip | null>(null);
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnType, setReturnType] = useState<'Damaged Return' | 'Full Return' | 'Partial Return'>('Partial Return');
  const [returnReason, setReturnReason] = useState('');

  // WhatsApp Modal State
  const [whatsAppModalProps, setWhatsAppModalProps] = useState<{
    isOpen: boolean;
    title: string;
    phone: string;
    message: string;
    pdfElementId?: string;
    pdfFilename?: string;
    documentType?: string;
  }>({
    isOpen: false,
    title: '',
    phone: '',
    message: '',
    pdfElementId: undefined,
    pdfFilename: undefined,
    documentType: undefined
  });

  if (!invoice) {
    return (
      <div className="p-8 text-center text-zinc-400 bg-zinc-900 rounded-xl">
        <p>Invoice not found or has been deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs"
        >
          Return to Invoice List
        </button>
      </div>
    );
  }

  // Related Delivery Slips & Payments
  const invoiceSlips = deliverySlips.filter(d => d.invoiceId === invoice.id);
  const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
  const invoiceLogs = activityLogs.filter(a => a.details.includes(invoice.invoiceNumber));

  // Initialize delivery quantities modal when opened
  const openCreateDeliverySlip = () => {
    const initialQtys: Record<string, number> = {};
    invoice.items.forEach(item => {
      const key = item.id || item.productId;
      // Calculate previously delivered for this item
      const prevDelivered = invoiceSlips
        .filter(ds => ds.deliveryStatus !== 'Cancelled')
        .reduce((sum, ds) => {
          const m = ds.items.find(
            di => (item.id && di.invoiceItemId === item.id) || (item.productId && di.productId === item.productId) || di.productName === item.productName
          );
          return sum + (m ? m.deliveredQuantity : 0);
        }, 0);
      const remaining = Math.max(0, item.quantity - prevDelivered);
      initialQtys[key] = remaining; // default to remaining
    });
    setDeliveryQuantities(initialQtys);
    setItemBoxCounts({});
    setItemWeights({});
    setSlipTotalBoxes('');
    setSlipTotalWeight('');
    setSlipAddress(invoice.customerAddress);
    setSlipContactPerson(invoice.customerName);
    setSlipPhone(invoice.customerPhone);
    setSlipReceiverName(invoice.customerName || '');
    setSlipReceiverPhone(invoice.customerPhone || '');

    const defaultSlipNumber = getNextNumber('delivery_slip');
    setCustomSlipNumber(defaultSlipNumber);

    setShowCreateSlipModal(true);
  };

  // Quick fill remaining
  const handleFillRemaining = () => {
    const newQtys: Record<string, number> = {};
    invoice.items.forEach(item => {
      const key = item.id || item.productId;
      const prevDelivered = invoiceSlips
        .filter(ds => ds.deliveryStatus !== 'Cancelled')
        .reduce((sum, ds) => {
          const m = ds.items.find(
            di => (item.id && di.invoiceItemId === item.id) || (item.productId && di.productId === item.productId) || di.productName === item.productName
          );
          return sum + (m ? m.deliveredQuantity : 0);
        }, 0);
      newQtys[key] = Math.max(0, item.quantity - prevDelivered);
    });
    setDeliveryQuantities(newQtys);
  };

  // Submit new Delivery Slip
  const handleConfirmDeliverySlip = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify at least one item has delivered qty > 0
    const hasAnyQty = Object.values(deliveryQuantities).some(q => q > 0);
    if (!hasAnyQty) {
      alert('Please enter a delivered quantity greater than 0 for at least one product.');
      return;
    }

    const slipItems = invoice.items
      .map(item => {
        const key = item.id || item.productId;
        const delQty = Number(deliveryQuantities[key] ?? deliveryQuantities[item.productId] ?? 0);
        const boxVal = (itemBoxCounts[key] ?? itemBoxCounts[item.productId] ?? '').trim();
        const weightVal = (itemWeights[key] ?? itemWeights[item.productId] ?? '').trim();
        return {
          invoiceItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          unit: item.unit,
          orderedQuantity: item.quantity,
          deliveredQuantity: delQty,
          boxCount: boxVal,
          boxes: boxVal,
          weight: weightVal,
          unitPrice: item.unitPrice,
          amount: delQty * item.unitPrice
        };
      })
      .filter(i => i.deliveredQuantity > 0);

    const createdSlip = createDeliverySlipForInvoice({
      deliverySlipNumber: customSlipNumber.trim() || undefined,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      deliveryDate: slipDeliveryDate,
      deliveryAddress: slipAddress,
      shippingAddress: slipAddress,
      contactPerson: slipContactPerson,
      phone: slipPhone,
      vehicleNumber: slipVehicle,
      driverName: slipDriverName,
      driverPhone: slipDriverPhone,
      deliveryMethod: (slipMethod as any) || 'Truck',
      warehouse: slipWarehouse,
      remarks: slipRemarks,
      deliveryInstructions: slipInstructions,
      totalBoxes: slipTotalBoxes.trim(),
      receivedBy: (slipReceiverName || slipContactPerson || invoice.customerName).trim(),
      receiverName: (slipReceiverName || slipContactPerson || invoice.customerName).trim(),
      receiverPhone: (slipReceiverPhone || slipPhone || invoice.customerPhone).trim(),
      receiverDesignation: 'Customer Representative',
      receivedDate: slipDeliveryDate,
      items: slipItems as any,
      deliveryStatus: slipStatus
    });

    setShowCreateSlipModal(false);
    setActiveTab('delivery');

    // Automatically prompt to send delivery slip to WhatsApp
    const text = generateDeliverySlipWhatsAppText(createdSlip, settings?.companyName || 'Bismillah Multitrade Corporation');
    setWhatsAppModalProps({
      isOpen: true,
      title: `Delivery Slip #${createdSlip.deliverySlipNumber} Created! Send to WhatsApp`,
      phone: createdSlip.receiverPhone || createdSlip.phone || invoice.customerPhone || '',
      message: text,
      pdfElementId: `modal-printable-slip-${createdSlip.id}`,
      pdfFilename: `Delivery-Slip-${createdSlip.deliverySlipNumber}`,
      documentType: 'Delivery Slip'
    });
  };

  // Submit Payment Record
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      receiptNumber: getNextNumber('payment'),
      date: paymentDate,
      paymentDate,
      type: 'Customer Collection',
      entityId: invoice.customerId,
      entityName: invoice.customerName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: paymentAmount,
      amountInWords: '',
      currency: invoice.currency,
      paymentMethod: paymentMethod as any,
      transactionReference: paymentTxnRef,
      bank: settings.bankName,
      notes: paymentNotes,
      receivedBy: 'Accounts Officer',
      collectedBy: 'Accounts Officer',
      createdAt: getTodayDateString()
    };

    recordPayment(newPayment);
    setShowPaymentModal(false);
    alert(`Payment of BDT ${paymentAmount.toLocaleString()} recorded successfully! Money Receipt: ${newPayment.receiptNumber}`);
  };

  // Submit Delivery Return
  const handleRecordReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSlip) return;

    const prod = invoice.items.find(i => i.productId === returnProductId);
    if (!prod) return;

    recordDeliveryReturn({
      deliverySlipId: returnSlip.id,
      deliverySlipNumber: returnSlip.deliverySlipNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      returnDate: getTodayDateString(),
      date: getTodayDateString(),
      returnType,
      productId: prod.productId,
      productName: prod.productName,
      deliveredQty: (prod as any).deliveredQuantity || prod.quantity,
      returnQty,
      unit: prod.unit,
      receivedBy: returnSlip.receivedBy || 'Warehouse Team',
      reason: returnReason,
      inspectedBy: 'Quality Assurance & Warehouse',
      actionTaken: returnType === 'Damaged Return' ? 'Moved to Damaged Goods Area' : 'Returned to Available Inventory'
    });

    setShowReturnModal(false);
    alert(`Recorded ${returnType} for ${prod.productName}`);
  };

  // Print triggers
  const triggerPrint = (mode: 'invoice' | 'slip' | 'combo' | 'receipt', slip?: DeliverySlip, payment?: PaymentRecord) => {
    setPrintMode(mode);
    if (slip) {
      setSelectedSlipForPrint(slip);
      setActiveSlipModal({ slip, mode: 'view' });
      setTimeout(() => {
        printElement(`printable-delivery-slip-${slip.id}`);
      }, 250);
      return;
    }
    if (mode === 'invoice') {
      setShowInvoicePrintModal(true);
      return;
    }
    if (payment) setSelectedPaymentForPrint(payment);
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      }
    }, 200);
  };

  // PDF Export for Delivery Slip
  const handleDownloadSlipPdf = async (slip: DeliverySlip) => {
    setSelectedSlipForPdf(slip);
    setIsDownloadingPdf(true);
    setTimeout(async () => {
      try {
        const el = document.getElementById(`pdf-render-slip-${slip.id}`);
        await downloadElementAsPdf(el, `Delivery-Slip-${slip.deliverySlipNumber}`, setIsDownloadingPdf);
      } catch (err) {
        console.error('PDF generation error:', err);
        triggerPrint('slip', slip);
      } finally {
        setIsDownloadingPdf(false);
      }
    }, 200);
  };

  // Overall delivery calculations for this invoice
  const totalOrderedItems = invoice.items.reduce((s, i) => s + i.quantity, 0);
  const totalDeliveredItems = invoice.items.reduce((s, item) => {
    const deliveredTotal = invoiceSlips
      .filter(ds => ds.deliveryStatus !== 'Cancelled')
      .reduce((sum, ds) => {
        const m = ds.items.find(di => di.productId === item.productId);
        return sum + (m ? m.deliveredQuantity : 0);
      }, 0);
    return s + Math.min(item.quantity, deliveredTotal);
  }, 0);
  const totalRemainingItems = Math.max(0, totalOrderedItems - totalDeliveredItems);
  const deliveryProgressPercent = totalOrderedItems > 0 ? Math.min(100, Math.round((totalDeliveredItems / totalOrderedItems) * 100)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden Print Container (activated by window.print via CSS @media print) */}
      <div className="hidden print:block">
        {printMode === 'invoice' && <PrintableInvoice invoice={invoice} settings={settings} />}
        {printMode === 'slip' && selectedSlipForPrint && (
          <PrintableDeliverySlip deliverySlip={selectedSlipForPrint} settings={settings} />
        )}
        {printMode === 'combo' && (
          <div className="combo-print-wrapper">
            {/* Page 1: Sales Invoice strictly on its own page */}
            <div
              className="print-page combo-invoice-page"
              style={{
                pageBreakAfter: 'always',
                breakAfter: 'page',
                marginBottom: '0'
              }}
            >
              <PrintableInvoice invoice={invoice} settings={settings} />
            </div>
            {/* Page 2: Delivery Slip strictly on second page, avoiding trailing blank page */}
            {(invoiceSlips[0] || true) && (
              <div
                className="print-page combo-slip-page"
                style={{
                  pageBreakAfter: 'avoid',
                  breakAfter: 'avoid'
                }}
              >
                <PrintableDeliverySlip
                  deliverySlip={
                    invoiceSlips[0] || {
                      id: 'ds-combo-' + invoice.id,
                      deliverySlipNumber: getNextNumber('delivery_slip'),
                      invoiceId: invoice.id,
                      invoiceNumber: invoice.invoiceNumber,
                      deliveryDate: invoice.invoiceDate,
                      customerId: invoice.customerId,
                      customerName: invoice.customerName,
                      companyName: invoice.companyName,
                      contactPerson: invoice.customerName,
                      phone: invoice.customerPhone,
                      deliveryAddress: invoice.customerAddress,
                      deliveryMethod: 'Truck',
                      items: invoice.items.map(it => ({
                        id: 'ds-item-' + it.id,
                        invoiceItemId: it.id,
                        productId: it.productId,
                        productName: it.productName,
                        description: it.description,
                        unit: it.unit,
                        orderedQuantity: it.quantity,
                        previouslyDelivered: 0,
                        deliveredQuantity: it.quantity,
                        remainingQuantity: 0,
                        unitPrice: it.unitPrice,
                        amount: it.amount
                      })),
                      deliveryStatus: 'Dispatched',
                      createdBy: 'Accounts',
                      createdAt: invoice.createdAt,
                      updatedAt: invoice.updatedAt
                    }
                  }
                  settings={settings}
                />
              </div>
            )}
          </div>
        )}
        {printMode === 'receipt' && selectedPaymentForPrint && (
          <PrintableMoneyReceipt payment={selectedPaymentForPrint} settings={settings} />
        )}
      </div>

      {/* Off-screen render container for high resolution Delivery Slip PDF export */}
      <div style={{ position: 'fixed', left: '0', top: 0, width: '800px', zIndex: -9999, background: '#ffffff', pointerEvents: 'none' }}>
        {selectedSlipForPdf && (
          <div id={`pdf-render-slip-${selectedSlipForPdf.id}`}>
            <PrintableDeliverySlip deliverySlip={selectedSlipForPdf} settings={settings} />
          </div>
        )}
      </div>

      {/* Main Top Header & Action Buttons (Hidden when printing) */}
      <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Back to Invoices"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-amber-400">
                  {invoice.invoiceNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  invoice.paymentStatus === 'Paid'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    : invoice.paymentStatus === 'Partially Paid'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                    : invoice.paymentStatus === 'Overdue'
                    ? 'bg-red-950 text-red-400 border border-red-800/60'
                    : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                }`}>
                  {invoice.paymentStatus}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  invoice.deliveryStatus === 'Delivered'
                    ? 'bg-emerald-950 text-emerald-300'
                    : invoice.deliveryStatus === 'Partially Delivered'
                    ? 'bg-purple-950 text-purple-300'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {invoice.deliveryStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Issued for <strong className="text-zinc-200">{invoice.customerName}</strong> • Date: {formatDate(invoice.invoiceDate)}
              </p>
            </div>
          </div>

          {/* Action Button Strip: Exact Suite of Actions Requested */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Print Invoice */}
            <button
              onClick={() => triggerPrint('invoice')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
              title="Print A4 Invoice"
            >
              <Printer size={15} className="text-amber-400" />
              <span>Print Invoice</span>
            </button>

            {/* 1b. Send Invoice via WhatsApp */}
            <button
              onClick={() => {
                const text = generateInvoiceWhatsAppText(invoice, settings?.companyName || 'Bismillah Multitrade Corporation');
                setWhatsAppModalProps({
                  isOpen: true,
                  title: `Send Invoice #${invoice.invoiceNumber} to WhatsApp`,
                  phone: invoice.customerPhone || '',
                  message: text,
                  pdfElementId: `printable-invoice-${invoice.id}`,
                  pdfFilename: `Invoice-${invoice.invoiceNumber}`,
                  documentType: 'Invoice'
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Directly send invoice to any WhatsApp number"
            >
              <MessageSquare size={15} />
              <span>Send WhatsApp</span>
            </button>

            {/* 2. Record Payment */}
            <button
              onClick={() => {
                setPaymentAmount(invoice.balanceDue);
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Record customer collection against invoice"
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>

            {/* 3. Create Delivery Slip (The star requested integration) */}
            <button
              onClick={openCreateDeliverySlip}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
              title="Generate linked Delivery Slip from this Invoice"
            >
              <Truck size={15} />
              <span>Create Delivery Slip</span>
            </button>

            {/* 4. Print Combo (Invoice + Delivery Slip) */}
            <button
              onClick={() => triggerPrint('combo')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
              title="Print Invoice & Delivery Slip on separate pages"
            >
              <Printer size={14} className="text-blue-400" />
              <span>Combo Print</span>
            </button>

            {/* 5. Edit Invoice */}
            <button
              onClick={() => onEdit(invoice.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
              title="Edit Invoice"
            >
              <Edit size={14} className="text-blue-400" />
              <span>Edit Invoice</span>
            </button>

            {/* 6. Delete Invoice */}
            <button
              onClick={() => setShowDeleteInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs font-semibold border border-red-900/40 transition-colors"
              title="Delete Invoice"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText size={15} />
            <span>Invoice &amp; A4 Layout</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'delivery'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Truck size={15} />
            <span>Delivery Slips &amp; Dispatch ({invoiceSlips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard size={15} />
            <span>Payments &amp; Receipts ({invoicePayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History size={15} />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & A4 DOCUMENT PREVIEW */}
      {activeTab === 'overview' && (
        <div className="print:hidden space-y-6">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-zinc-400 block mb-1">Invoice Grand Total</span>
              <span className="text-lg font-black font-mono text-zinc-100">
                {formatCurrency(invoice.grandTotal, invoice.currency)}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-zinc-400 block mb-1">Paid Amount</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {formatCurrency(invoice.paidAmount, invoice.currency)}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-zinc-400 block mb-1">Balance Due</span>
              <span className={`text-lg font-black font-mono ${invoice.balanceDue > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                {formatCurrency(invoice.balanceDue, invoice.currency)}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-zinc-400 block mb-1">Delivery Fulfillment</span>
              <span className="text-sm font-bold text-amber-400 block">
                {invoice.deliveryStatus}
              </span>
              <span className="text-[11px] text-zinc-500">
                {invoiceSlips.length} delivery slip{invoiceSlips.length !== 1 ? 's' : ''} generated
              </span>
            </div>
          </div>

          {/* Embedded Printable Invoice View */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-inner">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800 text-xs text-zinc-400">
              <span>A4 Document Preview (Formatted for standard office printing &amp; PDF)</span>
              <button
                onClick={() => setShowInvoicePrintModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-md text-xs font-bold shadow-xs transition-colors"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <PrintableInvoice invoice={invoice} settings={settings} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY SLIPS & DISPATCH (Direct Integration) */}
      {activeTab === 'delivery' && (
        <div className="print:hidden space-y-6">
          {/* Top Banner with Delivery Progress & Status KPI */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100 flex items-center gap-2">
                  <Truck size={17} className="text-blue-400" />
                  Delivery &amp; Fulfillment Tracker
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage shipments, vehicle dispatch, receiver sign-offs, and partial quantity fulfillment.
                </p>
              </div>

              <button
                onClick={openCreateDeliverySlip}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                <Plus size={15} />
                <span>Generate Delivery Slip</span>
              </button>
            </div>

            {/* Delivery KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400">Total Ordered</span>
                <div className="text-lg font-bold font-mono text-zinc-100">{totalOrderedItems} units</div>
                <span className="text-[10px] text-zinc-500">Across {invoice.items.length} items</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400">Total Delivered</span>
                <div className="text-lg font-bold font-mono text-emerald-400">{totalDeliveredItems} units</div>
                <span className="text-[10px] text-zinc-500">{deliveryProgressPercent}% fulfilled</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400">Remaining to Deliver</span>
                <div className="text-lg font-bold font-mono text-amber-400">{totalRemainingItems} units</div>
                <span className="text-[10px] text-zinc-500">{totalRemainingItems === 0 ? 'Fulfillment complete' : 'Awaiting dispatch'}</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400">Delivery Status</span>
                <div>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    invoice.deliveryStatus === 'Delivered'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : invoice.deliveryStatus === 'Partially Delivered'
                      ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                      : 'bg-blue-950 text-blue-400 border border-blue-800/50'
                  }`}>
                    {invoice.deliveryStatus || 'Ready for Delivery'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">{invoiceSlips.length} slip(s) generated</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Overall Delivery Fulfillment Progress</span>
                <span className="font-mono font-bold text-zinc-200">{deliveryProgressPercent}% Completed</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    deliveryProgressPercent >= 100
                      ? 'bg-emerald-500'
                      : deliveryProgressPercent > 0
                      ? 'bg-amber-500'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${deliveryProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Line Items Delivery Progress Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-zinc-950 text-xs font-bold text-zinc-300 border-b border-zinc-800 flex justify-between items-center">
                <span>Item Fulfillment Breakdown</span>
                <span className="text-[11px] text-zinc-400 font-normal">Track partial and completed lines</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5 w-24 text-right">Ordered Qty</th>
                    <th className="p-2.5 w-24 text-right text-emerald-400">Delivered Qty</th>
                    <th className="p-2.5 w-24 text-right text-amber-400">Remaining Qty</th>
                    <th className="p-2.5 w-20 text-center">Unit</th>
                    <th className="p-2.5 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {invoice.items.map(item => {
                    const deliveredTotal = invoiceSlips
                      .filter(ds => ds.deliveryStatus !== 'Cancelled')
                      .reduce((sum, ds) => {
                        const m = ds.items.find(di => di.productId === item.productId);
                        return sum + (m ? m.deliveredQuantity : 0);
                      }, 0);
                    const remaining = Math.max(0, item.quantity - deliveredTotal);
                    const isFullyDelivered = remaining === 0;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-800/30">
                        <td className="p-2.5 font-medium text-zinc-200">
                          {item.productName}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-zinc-300">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                          {deliveredTotal}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-400">
                          {remaining}
                        </td>
                        <td className="p-2.5 text-center text-zinc-400">{item.unit}</td>
                        <td className="p-2.5">
                          {isFullyDelivered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <CheckCircle2 size={13} /> Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <Clock size={13} /> {remaining} Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated Delivery Slips List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100">
                Generated Delivery Slips for this Invoice ({invoiceSlips.length})
              </h3>
              {invoiceSlips.length > 0 && (
                <button
                  onClick={openCreateDeliverySlip}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Plus size={13} />
                  <span>New Delivery Slip</span>
                </button>
              )}
            </div>

            {invoiceSlips.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                <Truck size={32} className="mx-auto mb-2 text-zinc-600" />
                <p>No delivery slips generated yet for this invoice.</p>
                <button
                  onClick={openCreateDeliverySlip}
                  className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  Create First Delivery Slip
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {invoiceSlips.map(slip => (
                  <div
                    key={slip.id}
                    className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {slip.deliverySlipNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            slip.deliveryStatus === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : slip.deliveryStatus === 'Dispatched'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                              : slip.deliveryStatus === 'Returned'
                              ? 'bg-red-950 text-red-400 border border-red-800/50'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                          }`}>
                            {slip.deliveryStatus}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Delivery Date: <strong className="text-zinc-300">{formatDate(slip.deliveryDate)}</strong>
                          {slip.vehicleNumber && ` • Vehicle: ${slip.vehicleNumber}`}
                          {slip.driverName && ` • Driver: ${slip.driverName}`}
                          {slip.deliveryAddress && ` • Destination: ${slip.deliveryAddress}`}
                        </p>
                      </div>

                      {/* Action buttons for this slip */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Delivery Slip */}
                        <button
                          onClick={() => setActiveSlipModal({ slip, mode: 'view' })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded text-xs font-semibold border border-zinc-700 transition-colors"
                          title="View Delivery Slip Preview"
                        >
                          <Eye size={13} />
                          <span>View Slip</span>
                        </button>

                        {/* Edit Delivery Slip */}
                        <button
                          onClick={() => setActiveSlipModal({ slip, mode: 'edit' })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded text-xs font-semibold border border-zinc-700 transition-colors"
                          title="Edit Delivery Slip Details"
                        >
                          <Edit size={13} />
                          <span>Edit</span>
                        </button>

                        {/* Print Delivery Slip */}
                        <button
                          onClick={() => setActiveSlipModal({ slip, mode: 'view' })}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium border border-zinc-700 transition-colors"
                          title="Print Delivery Slip"
                        >
                          <Printer size={13} />
                          <span>Print</span>
                        </button>

                        {/* Download PDF Delivery Slip */}
                        <button
                          onClick={() => handleDownloadSlipPdf(slip)}
                          disabled={isDownloadingPdf && selectedSlipForPdf?.id === slip.id}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-50"
                          title="Download Delivery Slip as PDF"
                        >
                          <Download size={13} />
                          <span>{isDownloadingPdf && selectedSlipForPdf?.id === slip.id ? 'Saving PDF...' : 'PDF'}</span>
                        </button>

                        {/* Send Delivery Slip via WhatsApp */}
                        <button
                          onClick={() => {
                            const text = generateDeliverySlipWhatsAppText(slip, settings?.companyName || 'Bismillah Multitrade Corporation');
                            setWhatsAppModalProps({
                              isOpen: true,
                              title: `Send Delivery Slip #${slip.deliverySlipNumber} to WhatsApp`,
                              phone: slip.receiverPhone || slip.phone || invoice.customerPhone || '',
                              message: text,
                              pdfElementId: `modal-printable-slip-${slip.id}`,
                              pdfFilename: `Delivery-Slip-${slip.deliverySlipNumber}`,
                              documentType: 'Delivery Slip'
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded text-xs font-semibold border border-emerald-700 transition-colors cursor-pointer"
                          title="Send Delivery Slip to WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </button>

                        {/* Delete Delivery Slip */}
                        <button
                          onClick={() => setSlipToDelete(slip)}
                          className="p-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded text-xs border border-red-900/40 transition-colors"
                          title="Delete Delivery Slip"
                        >
                          <Trash2 size={13} />
                        </button>

                        {slip.deliveryStatus !== 'Delivered' && (
                          <button
                            onClick={() => {
                              updateDeliverySlipStatus(slip.id, 'Delivered', {
                                name: slip.receiverName || slip.customerName || 'Customer Representative',
                                phone: slip.receiverPhone || slip.phone || '',
                                designation: slip.receiverDesignation || 'Received'
                              });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setReturnSlip(slip);
                            setReturnProductId(slip.items[0]?.productId || '');
                            setShowReturnModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded text-xs font-medium border border-zinc-700"
                          title="Record Delivery Return / Damage"
                        >
                          <RotateCcw size={13} />
                          <span>Return</span>
                        </button>
                      </div>
                    </div>

                    {/* Items inside this slip */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800/60">
                            <th className="pb-1.5">Product</th>
                            <th className="pb-1.5 w-24 text-right">Invoice Qty</th>
                            <th className="pb-1.5 w-24 text-right text-blue-400 font-bold">This Delivery</th>
                            <th className="pb-1.5 w-16 text-center">Unit</th>
                            <th className="pb-1.5">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {slip.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 font-medium text-zinc-300">{item.productName}</td>
                              <td className="py-1.5 text-right font-mono text-zinc-500">{item.orderedQuantity}</td>
                              <td className="py-1.5 text-right font-mono font-bold text-amber-400">{item.deliveredQuantity}</td>
                              <td className="py-1.5 text-center text-zinc-400">{item.unit}</td>
                              <td className="py-1.5 text-zinc-500 italic text-[11px]">{item.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Receiver info if delivered */}
                    {slip.receivedBy && (
                      <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>
                          Received by: <strong className="text-zinc-200">{slip.receivedBy}</strong>
                          {slip.receiverPhone && ` (${slip.receiverPhone})`}
                        </span>
                        <span>Date: {slip.receivedDate ? formatDate(slip.receivedDate) : ''}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery History Associated with this Invoice */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100 flex items-center gap-2">
              <History size={16} className="text-purple-400" />
              Delivery History &amp; Dispatch Log for {invoice.invoiceNumber}
            </h3>
            <p className="text-xs text-zinc-400">
              Audit trail of all shipment dispatches, partial deliveries, recipient acknowledgements, and returns.
            </p>

            <div className="space-y-3">
              {/* Event 1: Invoice Generation */}
              <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800/70 text-xs">
                <div className="p-1.5 rounded bg-blue-950 text-blue-400 mt-0.5">
                  <FileText size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">Invoice Created &amp; Queued for Delivery</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <p className="text-zinc-400 mt-0.5">
                    Order confirmed with {invoice.items.length} line items ({totalOrderedItems} units total). Initial status: Ready for Delivery.
                  </p>
                </div>
              </div>

              {/* Slips generated history */}
              {invoiceSlips.map(slip => (
                <div key={slip.id} className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800/70 text-xs">
                    <div className="p-1.5 rounded bg-amber-950 text-amber-400 mt-0.5">
                      <Truck size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200">
                          Delivery Slip Generated: <strong className="text-amber-400 font-mono">{slip.deliverySlipNumber}</strong>
                        </span>
                        <span className="text-zinc-500 font-mono text-[11px]">{formatDate(slip.deliveryDate)}</span>
                      </div>
                      <p className="text-zinc-400 mt-0.5">
                        Dispatched {slip.items.reduce((s, i) => s + i.deliveredQuantity, 0)} units
                        {slip.vehicleNumber ? ` via vehicle ${slip.vehicleNumber}` : ''}
                        {slip.driverName ? ` (Driver: ${slip.driverName})` : ''}. Status: <span className="font-semibold text-zinc-300">{slip.deliveryStatus}</span>.
                      </p>
                    </div>
                  </div>

                  {slip.receivedBy && (
                    <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-emerald-900/40 text-xs ml-4">
                      <div className="p-1.5 rounded bg-emerald-950 text-emerald-400 mt-0.5">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-400">
                            Shipment Handed Over &amp; Signed
                          </span>
                          <span className="text-zinc-500 font-mono text-[11px]">{slip.receivedDate ? formatDate(slip.receivedDate) : formatDate(slip.deliveryDate)}</span>
                        </div>
                        <p className="text-zinc-300 mt-0.5">
                          Received by <strong className="text-zinc-100">{slip.receivedBy}</strong>
                          {slip.receiverPhone ? ` (${slip.receiverPhone})` : ''}.
                          All goods verified on delivery slip {slip.deliverySlipNumber}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Any Returns associated */}
              {deliveryReturns.filter(r => r.invoiceId === invoice.id).map(ret => (
                <div key={ret.id} className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-red-900/40 text-xs">
                  <div className="p-1.5 rounded bg-red-950 text-red-400 mt-0.5">
                    <RotateCcw size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-400">
                        Delivery Return Recorded: <strong className="font-mono">{ret.deliverySlipNumber}</strong>
                      </span>
                      <span className="text-zinc-500 font-mono text-[11px]">{formatDate(ret.returnDate || ret.date || '')}</span>
                    </div>
                    <p className="text-zinc-400 mt-0.5">
                      Returned {ret.returnQty} units of {ret.productName}. Reason: {ret.reason || 'Not specified'}. Action: {ret.actionTaken}.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS & MONEY RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="print:hidden space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100 flex items-center gap-2">
                  <CreditCard size={17} className="text-emerald-400" />
                  Payments &amp; Collections
                </h3>
                <p className="text-xs text-zinc-400">
                  Track collections against invoice, money receipts, and payment method details.
                </p>
              </div>

              <button
                onClick={() => {
                  setPaymentAmount(invoice.balanceDue);
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                <Plus size={15} />
                <span>Record New Payment</span>
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-4 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-400 block">Grand Total:</span>
                <span className="text-base font-mono font-bold text-zinc-100">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Total Paid:</span>
                <span className="text-base font-mono font-bold text-emerald-400">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Balance Outstanding:</span>
                <span className={`text-base font-mono font-bold ${invoice.balanceDue > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>

            {/* Payment Receipts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2 font-medium">Receipt No</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Payment Method</th>
                    <th className="pb-2 font-medium">Txn / Cheque Ref</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {invoicePayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500">
                        No payments recorded yet against this invoice.
                      </td>
                    </tr>
                  ) : (
                    invoicePayments.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-800/40">
                        <td className="py-2.5 font-mono font-bold text-amber-400">{p.receiptNumber}</td>
                        <td className="py-2.5 text-zinc-300">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-medium">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-zinc-400">{p.transactionReference || '-'}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => triggerPrint('receipt', undefined, p)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-semibold ml-auto"
                          >
                            <Printer size={13} />
                            <span>Money Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'activity' && (
        <div className="print:hidden bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100 flex items-center gap-2">
            <History size={16} className="text-amber-400" />
            Audit Trail &amp; Activity Log
          </h3>
          <div className="divide-y divide-zinc-800">
            {invoiceLogs.length === 0 ? (
              <p className="py-4 text-zinc-500 text-xs text-center">No specific activity logs recorded for this invoice.</p>
            ) : (
              invoiceLogs.map(log => (
                <div key={log.id} className="py-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-200">{log.action}</span>
                    <p className="text-zinc-400 text-[11px]">{log.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-zinc-500 font-mono">
                    <p>{log.date} {log.time}</p>
                    <p className="text-zinc-400">{log.user}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE DELIVERY SLIP (Seamlessly Integrated)
      ========================================================================= */}
      {showCreateSlipModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                  <Truck size={18} className="text-blue-400" />
                  Generate Delivery Slip for {invoice.invoiceNumber}
                </h2>
                <p className="text-xs text-zinc-400">
                  Customer: <strong className="text-zinc-200">{invoice.customerName}</strong> ({invoice.companyName})
                </p>
              </div>
              <button
                onClick={() => setShowCreateSlipModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDeliverySlip} className="space-y-4 text-xs">
              {/* Delivery Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold flex items-center justify-between">
                    <span>Challan / Slip No *</span>
                    <span className="text-[10px] text-amber-400 font-normal">Custom</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customSlipNumber}
                    onChange={(e) => setCustomSlipNumber(e.target.value)}
                    placeholder="e.g. DS-2026-0001"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={slipDeliveryDate}
                    onChange={(e) => setSlipDeliveryDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Delivery Method</label>
                  <select
                    value={slipMethod}
                    onChange={(e) => setSlipMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Courier">Courier</option>
                    <option value="Own Pickup van">Own Pickup van</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Delivery Status</label>
                  <select
                    value={slipStatus}
                    onChange={(e) => setSlipStatus(e.target.value as DeliveryStatus)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Vehicle / Truck Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka Metro-TA-11-9482"
                    value={slipVehicle}
                    onChange={(e) => setSlipVehicle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Rafiqul Islam"
                    value={slipDriverName}
                    onChange={(e) => setSlipDriverName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Driver Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1819-293847"
                    value={slipDriverPhone}
                    onChange={(e) => setSlipDriverPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Dispatch Depot / Warehouse</label>
                  <input
                    type="text"
                    value={slipWarehouse}
                    onChange={(e) => setSlipWarehouse(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>
              </div>

              {/* Customer Representative & Receiver Info - Visible FIRST */}
              <div className="p-3.5 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    Customer Representative &amp; Receiver Information
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Contact &amp; Handover Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Customer Representative / Receiver *</label>
                    <input
                      type="text"
                      placeholder="Receiver person name"
                      value={slipReceiverName}
                      onChange={(e) => {
                        setSlipReceiverName(e.target.value);
                        setSlipContactPerson(e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Representative Phone Number</label>
                    <input
                      type="text"
                      placeholder="Receiver phone number"
                      value={slipReceiverPhone}
                      onChange={(e) => {
                        setSlipReceiverPhone(e.target.value);
                        setSlipPhone(e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Delivery Destination Address</label>
                    <input
                      type="text"
                      placeholder="Destination address"
                      value={slipAddress}
                      onChange={(e) => setSlipAddress(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quantities Table with Fill Remaining */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Delivery Quantities per Line Item</span>
                  <button
                    type="button"
                    onClick={handleFillRemaining}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Auto-Fill All Remaining Quantities
                  </button>
                </div>

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <th className="p-2">Product</th>
                        <th className="p-2 w-20 text-right">Invoice Qty</th>
                        <th className="p-2 w-20 text-right">Prev. Del.</th>
                        <th className="p-2 w-20 text-right">Remaining</th>
                        <th className="p-2 w-28 text-right bg-blue-950 text-blue-200">Delivery Qty</th>
                        <th className="p-2 w-24 text-center">Box</th>
                        <th className="p-2 w-24 text-center">Weight</th>
                        <th className="p-2 w-14 text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {invoice.items.map(item => {
                        const key = item.id || item.productId;
                        const prevDel = invoiceSlips
                          .filter(ds => ds.deliveryStatus !== 'Cancelled')
                          .reduce((sum, ds) => {
                            const m = ds.items.find(
                              di => (item.id && di.invoiceItemId === item.id) || (item.productId && di.productId === item.productId) || di.productName === item.productName
                            );
                            return sum + (m ? m.deliveredQuantity : 0);
                          }, 0);
                        const rem = Math.max(0, item.quantity - prevDel);

                        return (
                          <tr key={item.id} className="hover:bg-zinc-800/30">
                            <td className="p-2 font-medium text-zinc-200">{item.productName}</td>
                            <td className="p-2 text-right font-mono text-zinc-400">{item.quantity}</td>
                            <td className="p-2 text-right font-mono text-zinc-400">{prevDel}</td>
                            <td className="p-2 text-right font-mono font-semibold text-amber-400">{rem}</td>
                            <td className="p-2 text-right bg-blue-950/20">
                              <input
                                type="number"
                                min="0"
                                max={rem}
                                value={deliveryQuantities[key] ?? rem}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setDeliveryQuantities(prev => ({
                                    ...prev,
                                    [key]: val
                                  }));
                                }}
                                className="w-20 bg-zinc-950 border border-blue-500 rounded px-2 py-1 text-right font-mono font-bold text-zinc-100"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="text"
                                placeholder="e.g. 5 Box"
                                value={itemBoxCounts[key] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemBoxCounts(prev => ({ ...prev, [key]: val }));
                                }}
                                className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-100"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="text"
                                placeholder="e.g. 25 kg"
                                value={itemWeights[key] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemWeights(prev => ({ ...prev, [key]: val }));
                                }}
                                className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-100"
                              />
                            </td>
                            <td className="p-2 text-center text-zinc-400">{item.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-950 border-t border-zinc-800 text-zinc-300 font-bold">
                        <td colSpan={5} className="p-2 text-right text-xs uppercase text-zinc-400">
                          Total (Manual Entry):
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            placeholder="e.g. 10 Box"
                            value={slipTotalBoxes}
                            onChange={(e) => setSlipTotalBoxes(e.target.value)}
                            className="w-20 bg-zinc-900 border border-amber-500/50 rounded px-2 py-1 text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            title="Total Box (Manual Entry)"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            placeholder="e.g. 150 kg"
                            value={slipTotalWeight}
                            onChange={(e) => setSlipTotalWeight(e.target.value)}
                            className="w-20 bg-zinc-900 border border-amber-500/50 rounded px-2 py-1 text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            title="Total Weight (Manual Entry)"
                          />
                        </td>
                        <td className="p-2 text-center text-xs text-zinc-400 font-semibold">Total</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Order Fulfillment Status Strip */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>
                    Fulfillment Mode: <strong className="text-zinc-200">
                      {invoice.items.every(item => {
                        const prevDel = invoiceSlips
                          .filter(ds => ds.deliveryStatus !== 'Cancelled')
                          .reduce((s, ds) => {
                            const m = ds.items.find(di => di.productId === item.productId);
                            return s + (m ? m.deliveredQuantity : 0);
                          }, 0);
                        const rem = Math.max(0, item.quantity - prevDel);
                        const qty = deliveryQuantities[item.productId] ?? rem;
                        return (prevDel + qty) >= item.quantity;
                      }) ? 'Full Order Delivery (100%)' : 'Partial Delivery Shipment'}
                    </strong>
                  </span>
                  <span className="text-blue-400">
                    Stock will be deducted from warehouse automatically
                  </span>
                </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-zinc-400 mb-1">Special Delivery Instructions / Gate Pass Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Unload at Factory Gate 2. Call receiver prior to arrival."
                  value={slipInstructions}
                  onChange={(e) => setSlipInstructions(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateSlipModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  <Truck size={15} />
                  <span>Confirm &amp; Generate Slip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RECORD PAYMENT (Money Receipt)
      ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-400" />
                Record Collection / Money Receipt
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between">
                <span className="text-zinc-400">Total Invoice Balance Due:</span>
                <span className="font-mono font-bold text-red-400 text-sm">
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Amount to Receive (BDT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={invoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-emerald-500 rounded-lg px-3 py-2 text-base font-mono font-black text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Bank Transfer">Bank Transfer (NPSB / BEFTN / RTGS)</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Cheque">Account Payee Cheque</option>
                    <option value="bKash">bKash Merchant</option>
                    <option value="Nagad">Nagad Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Txn ID / Cheque No / Bank Branch</label>
                <input
                  type="text"
                  placeholder="e.g. CQ-928190 / Dutch Bangla Bank Ltd"
                  value={paymentTxnRef}
                  onChange={(e) => setPaymentTxnRef(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Particulars / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Partial settlement against INV-2026-0001"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  Record &amp; Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RECORD DELIVERY RETURN
      ========================================================================= */}
      {showReturnModal && returnSlip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <RotateCcw size={16} className="text-red-400" />
                Record Delivery Return
              </h2>
              <button onClick={() => setShowReturnModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordReturnSubmit} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Select Product to Return</label>
                <select
                  value={returnProductId}
                  onChange={(e) => setReturnProductId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                >
                  {returnSlip.items.map(i => (
                    <option key={i.productId} value={i.productId}>
                      {i.productName} (Delivered: {i.deliveredQuantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Return Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Return Classification</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Partial Return">Partial Return (Restock)</option>
                    <option value="Full Return">Full Return (Restock)</option>
                    <option value="Damaged Return">Damaged in Transit (Write-off)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason for Return *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Wrong specification delivered / packaging seal broken"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Document Modal */}
      <InvoicePrintModal
        invoice={invoice}
        settings={settings}
        isOpen={showInvoicePrintModal}
        onClose={() => setShowInvoicePrintModal(false)}
      />

      {/* Delivery Slip View / Edit / Delete Modal */}
      {activeSlipModal && (
        <DeliverySlipModal
          slip={activeSlipModal.slip}
          isOpen={true}
          initialMode={activeSlipModal.mode}
          onClose={() => setActiveSlipModal(null)}
          onDeleted={() => setActiveSlipModal(null)}
          onUpdated={() => setActiveSlipModal(null)}
        />
      )}

      {/* Delete Invoice Confirmation Modal */}
      {invoice && (
        <ConfirmModal
          isOpen={showDeleteInvoiceModal}
          title="Delete Sales Invoice"
          message={`Are you sure you want to permanently delete invoice ${invoice.invoiceNumber}? All associated delivery slips and inventory reserves will be reversed. This action cannot be undone.`}
          confirmText="Delete Invoice"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            setShowDeleteInvoiceModal(false);
            deleteInvoice(invoice.id);
            onBack();
          }}
          onCancel={() => setShowDeleteInvoiceModal(false)}
        />
      )}

      {/* Delete Delivery Slip Confirmation Modal */}
      <ConfirmModal
        isOpen={!!slipToDelete}
        title="Delete Delivery Slip"
        message={`Are you sure you want to delete delivery slip ${slipToDelete?.deliverySlipNumber}? Delivered quantities will be reverted.`}
        confirmText="Delete Slip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (slipToDelete) {
            deleteDeliverySlip(slipToDelete.id);
            setSlipToDelete(null);
          }
        }}
        onCancel={() => setSlipToDelete(null)}
      />

      {/* WhatsApp Direct Send Modal with PDF Support */}
      <WhatsAppSendModal
        isOpen={whatsAppModalProps.isOpen}
        onClose={() => setWhatsAppModalProps(prev => ({ ...prev, isOpen: false }))}
        title={whatsAppModalProps.title}
        defaultPhone={whatsAppModalProps.phone}
        initialMessage={whatsAppModalProps.message}
        pdfElementId={whatsAppModalProps.pdfElementId}
        pdfFilename={whatsAppModalProps.pdfFilename}
        documentType={whatsAppModalProps.documentType}
      />

      {/* Offscreen Printable Containers for High-Fidelity PDF Generation */}
      <div
        id={`printable-invoice-${invoice.id}`}
        style={{
          position: 'fixed',
          left: '0',
          top: '0',
          width: '800px',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none'
        }}
      >
        <PrintableInvoice invoice={invoice} settings={settings} />
      </div>

      {invoiceSlips.map(s => (
        <div
          key={`offscreen-slip-${s.id}`}
          id={`modal-printable-slip-${s.id}`}
          style={{
            position: 'fixed',
            left: '0',
            top: '0',
            width: '800px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none'
          }}
        >
          <PrintableDeliverySlip deliverySlip={s} settings={settings} />
        </div>
      ))}
    </div>
  );
};
