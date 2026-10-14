import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  Truck,
  Eye,
  Calendar,
  User,
  Phone,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { DeliverySlip, DeliveryStatus, DeliveryMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { PrintableDeliverySlip } from '../documents/PrintableDeliverySlip';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { printElement } from '../../utils/printHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import { WhatsAppSendModal } from '../common/WhatsAppSendModal';
import { generateDeliverySlipWhatsAppText } from '../../utils/whatsapp';

interface Props {
  slip: DeliverySlip | null;
  isOpen: boolean;
  initialMode?: 'view' | 'edit';
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: (updatedSlip: DeliverySlip) => void;
}

export const DeliverySlipModal: React.FC<Props> = ({
  slip,
  isOpen,
  initialMode = 'view',
  onClose,
  onDeleted,
  onUpdated
}) => {
  const { updateDeliverySlip, deleteDeliverySlip, settings } = useData();

  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Edit form state
  const [slipNumber, setSlipNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('Dispatched');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Truck');
  const [remarks, setRemarks] = useState('');
  const [instructions, setInstructions] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverDesignation, setReceiverDesignation] = useState('');
  const [itemsQuantities, setItemsQuantities] = useState<Record<string, number>>({});
  const [itemsBoxes, setItemsBoxes] = useState<Record<string, string>>({});
  const [itemsWeights, setItemsWeights] = useState<Record<string, string>>({});
  const [totalBoxes, setTotalBoxes] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    if (slip) {
      setMode(initialMode);
      setSlipNumber(slip.deliverySlipNumber || '');
      setDeliveryDate(slip.deliveryDate || '');
      setStatus(slip.deliveryStatus || 'Dispatched');
      setVehicleNumber(slip.vehicleNumber || '');
      setDriverName(slip.driverName || '');
      setDriverPhone(slip.driverPhone || '');
      setDeliveryAddress(slip.deliveryAddress || '');
      setDeliveryMethod(slip.deliveryMethod || 'Truck');
      setRemarks(slip.remarks || '');
      setInstructions(slip.deliveryInstructions || '');
      setReceiverName(slip.receiverName || '');
      setReceiverPhone(slip.receiverPhone || '');
      setReceiverDesignation(slip.receiverDesignation || '');
      setTotalBoxes(slip.totalBoxes || '');
      setTotalWeight(slip.totalWeight || '');

      const qtys: Record<string, number> = {};
      const boxes: Record<string, string> = {};
      const weights: Record<string, string> = {};
      slip.items.forEach(item => {
        const key = item.id || item.productId;
        qtys[key] = item.deliveredQuantity;
        boxes[key] = String(item.boxCount || item.boxes || '');
        weights[key] = String(item.weight || '');
      });
      setItemsQuantities(qtys);
      setItemsBoxes(boxes);
      setItemsWeights(weights);
    }
  }, [slip, initialMode, isOpen]);

  if (!isOpen || !slip) return null;

  const handlePrint = () => {
    if (mode !== 'view') {
      setMode('view');
    }
    setTimeout(() => {
      printElement(`printable-delivery-slip-${slip.id}`);
    }, 150);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const el = document.getElementById(`modal-printable-slip-${slip.id}`);
      await downloadElementAsPdf(el, `Delivery-Slip-${slip.deliverySlipNumber}`, setIsDownloadingPdf);
    } catch (err) {
      console.error('PDF error:', err);
      handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteDeliverySlip(slip.id);
    if (onDeleted) onDeleted();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedItems = slip.items.map(item => {
      const key = item.id || item.productId;
      const qty = itemsQuantities[key] !== undefined ? itemsQuantities[key] : item.deliveredQuantity;
      return {
        ...item,
        deliveredQuantity: Math.max(0, qty),
        boxCount: itemsBoxes[key] ?? item.boxCount,
        boxes: itemsBoxes[key] ?? item.boxes,
        weight: itemsWeights[key] ?? item.weight
      };
    });

    const updatedSlip: DeliverySlip = {
      ...slip,
      deliverySlipNumber: slipNumber.trim() || slip.deliverySlipNumber,
      deliveryDate,
      deliveryStatus: status,
      vehicleNumber: vehicleNumber.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      deliveryMethod,
      remarks: remarks.trim(),
      deliveryInstructions: instructions.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverDesignation: receiverDesignation.trim(),
      totalBoxes: totalBoxes.trim(),
      totalWeight: totalWeight.trim(),
      items: updatedItems
    };

    updateDeliverySlip(updatedSlip);
    if (onUpdated) onUpdated(updatedSlip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible print:w-full print:m-0 print:rounded-none">
        {/* Top Modal Bar - Strictly hidden when printing */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Truck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-amber-400">
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
              <p className="text-xs text-zinc-400">
                Invoice #{slip.invoiceNumber} • {slip.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View / Edit Mode Toggle */}
            {mode === 'view' ? (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                title="Edit Delivery Slip Details"
              >
                <Edit2 size={13} className="text-blue-400" />
                <span>Edit Slip</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                title="View Document Preview"
              >
                <Eye size={13} className="text-emerald-400" />
                <span>View Slip</span>
              </button>
            )}

            {/* WhatsApp Send Button */}
            {slip && (
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Send Delivery Slip to WhatsApp"
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Print Delivery Slip"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>

            {/* PDF Export */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>

            {/* Delete Slip */}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition-colors cursor-pointer"
              title="Delete Delivery Slip"
            >
              <Trash2 size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-1 cursor-pointer"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body: Either Document Preview or Edit Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar print:p-0 print:m-0 print:bg-white print:overflow-visible">
          {mode === 'view' ? (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-200 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none">
              <div id={`modal-printable-slip-${slip.id}`} className="print:m-0 print:p-0">
                <PrintableDeliverySlip deliverySlip={slip} settings={settings} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs print:hidden">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-zinc-200 uppercase tracking-tight text-xs flex items-center gap-2">
                  <Truck size={15} className="text-amber-500" />
                  Dispatch &amp; Transit Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold flex items-center justify-between">
                      <span>Challan / Slip No *</span>
                      <span className="text-[10px] text-amber-400 font-normal">Custom</span>
                    </label>
                    <input
                      type="text"
                      value={slipNumber}
                      onChange={(e) => setSlipNumber(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Delivery Date *</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Delivery Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Delivery Method</label>
                    <select
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Courier">Courier</option>
                      <option value="Own Pickup van">Own Pickup van</option>
                      <option value="Transport">Transport</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Vehicle / Reg Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Dhaka Metro-TA 11-4521"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Driver / Dispatcher Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Rafiqul Islam"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Driver Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +880 1711-000000"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Delivery Destination Address</label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Customer Representative & Receiver Info - Visible FIRST */}
              <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                  <h4 className="font-bold text-amber-400 uppercase tracking-tight text-xs flex items-center gap-2">
                    <User size={15} className="text-amber-500" />
                    Customer Representative &amp; Receiver Information
                  </h4>
                  <span className="text-[10px] text-zinc-400">Handover Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Customer Representative / Receiver *</label>
                    <input
                      type="text"
                      placeholder="Receiver person name"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Representative Phone</label>
                    <input
                      type="text"
                      placeholder="Contact number"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Store Manager / Representative"
                      value={receiverDesignation}
                      onChange={(e) => setReceiverDesignation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items Quantity To Deliver */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-200 uppercase tracking-tight text-xs flex items-center justify-between">
                  <span>Delivered Items &amp; Quantities</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Adjust units dispatched in this slip</span>
                </h4>

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5 w-20 text-right">Invoiced Qty</th>
                        <th className="p-2.5 w-28 text-right">Delivered Qty</th>
                        <th className="p-2.5 w-24 text-center">Box</th>
                        <th className="p-2.5 w-24 text-center">Weight</th>
                        <th className="p-2.5 w-16 text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {slip.items.map(item => {
                        const key = item.id || item.productId;
                        const currentVal = itemsQuantities[key] !== undefined ? itemsQuantities[key] : item.deliveredQuantity;
                        return (
                          <tr key={key} className="hover:bg-zinc-900/50">
                            <td className="p-2.5 font-medium text-zinc-200">
                              {item.productName}
                            </td>
                            <td className="p-2.5 text-right font-mono text-zinc-400">
                              {item.orderedQuantity}
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                max={item.orderedQuantity * 2}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setItemsQuantities(prev => ({ ...prev, [key]: val }));
                                }}
                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-right text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="text"
                                placeholder="e.g. 5 Box"
                                value={itemsBoxes[key] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemsBoxes(prev => ({ ...prev, [key]: val }));
                                }}
                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="text"
                                placeholder="e.g. 25 kg"
                                value={itemsWeights[key] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemsWeights(prev => ({ ...prev, [key]: val }));
                                }}
                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="p-2.5 text-center text-zinc-400">{item.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-900 border-t border-zinc-800 text-zinc-300 font-bold">
                        <td colSpan={3} className="p-2.5 text-right text-xs uppercase text-zinc-400">
                          Total (Manual Entry):
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            placeholder="e.g. 10 Box"
                            value={totalBoxes}
                            onChange={(e) => setTotalBoxes(e.target.value)}
                            className="w-24 bg-zinc-950 border border-amber-500/50 rounded px-2 py-1 text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            title="Total Box (Manual Entry)"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            placeholder="e.g. 150 kg"
                            value={totalWeight}
                            onChange={(e) => setTotalWeight(e.target.value)}
                            className="w-24 bg-zinc-950 border border-amber-500/50 rounded px-2 py-1 text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            title="Total Weight (Manual Entry)"
                          />
                        </td>
                        <td className="p-2 text-center text-xs text-zinc-400 font-semibold">Total</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Remarks & Handling Instructions */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-200 uppercase tracking-tight text-xs">
                  Delivery Remarks &amp; Handling Notes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Delivery Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Checked and received intact"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Special Handling Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Handle with care, keep dry"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow-md transition-colors"
                >
                  <Save size={15} />
                  <span>Save Delivery Slip</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Delivery Slip"
        message={`Are you sure you want to delete delivery slip ${slip.deliverySlipNumber}? Delivered quantities will be reverted.`}
        confirmText="Delete Slip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {slip && (
        <WhatsAppSendModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          title={`Send Delivery Challan #${slip.deliverySlipNumber} to WhatsApp`}
          defaultPhone={slip.receiverPhone || slip.phone || ''}
          initialMessage={generateDeliverySlipWhatsAppText(slip, settings?.companyName || 'Bismillah Multitrade Corporation')}
        />
      )}
    </div>
  );
};
