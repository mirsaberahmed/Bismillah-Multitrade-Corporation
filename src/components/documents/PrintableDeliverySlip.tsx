import React from 'react';
import { DeliverySlip, CompanySettings } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  deliverySlip: DeliverySlip;
  settings: CompanySettings;
}

export const PrintableDeliverySlip: React.FC<Props> = ({ deliverySlip, settings }) => {
  return (
    <div className="bg-white text-zinc-900 w-full max-w-4xl mx-auto p-8 font-sans print:p-0 print:max-w-none text-sm leading-normal">
      {/* Header */}
      <div className="border-b-2 border-amber-500 pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          {/* Company Details */}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase mb-0.5">
              {settings.companyName}
            </h1>
            <p className="text-amber-700 font-semibold text-xs tracking-wider uppercase mb-2">
              {settings.businessType}
            </p>
            <div className="text-zinc-600 text-xs space-y-0.5 leading-relaxed">
              <p>{settings.address}</p>
              <p>
                <span className="font-medium text-zinc-800">Phone:</span> {settings.phonePrimary}
                {settings.phoneSecondary && ` | ${settings.phoneSecondary}`}
              </p>
              {settings.email && (
                <p>
                  <span className="font-medium text-zinc-800">Email:</span> {settings.email}
                  {settings.website && ` | ${settings.website}`}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Slip Label & Core Reference */}
          <div className="text-right">
            <div className="inline-block bg-amber-500 text-zinc-950 px-4 py-1.5 font-extrabold text-xl tracking-widest uppercase mb-3">
              DELIVERY SLIP
            </div>
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-zinc-500">Delivery Slip No:</span>{' '}
                <strong className="font-mono text-sm text-zinc-900">{deliverySlip.deliverySlipNumber}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Invoice No:</span>{' '}
                <strong className="font-mono text-zinc-900">{deliverySlip.invoiceNumber}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Delivery Date:</span>{' '}
                <strong className="text-zinc-900">{formatDate(deliverySlip.deliveryDate)}</strong>
              </p>
              {deliverySlip.poNumber && (
                <p>
                  <span className="text-zinc-500">PO No:</span>{' '}
                  <strong className="text-zinc-900">{deliverySlip.poNumber}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Deliver To & Delivery Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Deliver To */}
        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase mb-1">
            DELIVER TO
          </div>
          <p className="font-bold text-zinc-900 text-sm">{deliverySlip.customerName}</p>
          {deliverySlip.companyName && deliverySlip.companyName !== deliverySlip.customerName && (
            <p className="text-xs font-semibold text-zinc-700">{deliverySlip.companyName}</p>
          )}
          <p className="text-xs text-zinc-600 mt-1 whitespace-pre-line leading-relaxed">
            {deliverySlip.deliveryAddress || 'Address on file'}
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-200 text-xs space-y-0.5 text-zinc-600">
            {deliverySlip.contactPerson && (
              <p><span className="text-zinc-500">Contact Person:</span> {deliverySlip.contactPerson}</p>
            )}
            {deliverySlip.phone && (
              <p><span className="text-zinc-500">Phone:</span> {deliverySlip.phone}</p>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
          <div className="text-[11px] font-bold tracking-wider text-amber-700 uppercase mb-1">
            DELIVERY INFORMATION
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs text-zinc-700">
            <span className="text-zinc-500">Delivery Method:</span>
            <span className="font-medium text-zinc-900">{deliverySlip.deliveryMethod || 'Company Transport'}</span>

            {deliverySlip.vehicleNumber && (
              <>
                <span className="text-zinc-500">Vehicle No:</span>
                <span className="font-mono font-medium text-zinc-900">{deliverySlip.vehicleNumber}</span>
              </>
            )}

            {deliverySlip.driverName && (
              <>
                <span className="text-zinc-500">Driver Name:</span>
                <span className="font-medium text-zinc-900">
                  {deliverySlip.driverName}
                  {deliverySlip.driverPhone && ` (${deliverySlip.driverPhone})`}
                </span>
              </>
            )}

            {deliverySlip.deliveryPerson && (
              <>
                <span className="text-zinc-500">Dispatched By:</span>
                <span className="font-medium text-zinc-900">{deliverySlip.deliveryPerson}</span>
              </>
            )}

            {deliverySlip.warehouse && (
              <>
                <span className="text-zinc-500">Dispatch Depot:</span>
                <span className="text-zinc-800">{deliverySlip.warehouse}</span>
              </>
            )}

            <span className="text-zinc-500">Status:</span>
            <span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-900">
                {deliverySlip.deliveryStatus}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white font-semibold border border-zinc-900">
              <th className="p-2 w-10 text-center">SL</th>
              <th className="p-2">Product / Description</th>
              <th className="p-2 w-20 text-right">Invoice Qty</th>
              <th className="p-2 w-20 text-right">Prev. Del.</th>
              <th className="p-2 w-24 text-right bg-amber-500 text-zinc-950 font-bold">Delivered Qty</th>
              <th className="p-2 w-20 text-right">Pending</th>
              <th className="p-2 w-14 text-center">Unit</th>
              {settings.showPriceOnDeliverySlip && (
                <>
                  <th className="p-2 w-24 text-right">Unit Price</th>
                  <th className="p-2 w-28 text-right">Amount</th>
                </>
              )}
              <th className="p-2">Remarks / Batch / Serial</th>
            </tr>
          </thead>
          <tbody>
            {deliverySlip.items.map((item, index) => (
              <tr
                key={item.id || index}
                className={`border border-zinc-200 ${index % 2 === 1 ? 'bg-zinc-50/60' : 'bg-white'}`}
              >
                <td className="p-2 text-center text-zinc-500 font-medium">{index + 1}</td>
                <td className="p-2">
                  <p className="font-bold text-zinc-900 text-xs">{item.productName}</p>
                  {item.description && (
                    <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="p-2 text-right font-medium text-zinc-600">{item.orderedQuantity}</td>
                <td className="p-2 text-right font-medium text-zinc-500">{item.previouslyDelivered}</td>
                <td className="p-2 text-right font-bold text-sm bg-amber-50 text-amber-900">
                  {item.deliveredQuantity}
                </td>
                <td className="p-2 text-right font-medium text-zinc-500">
                  {item.remainingQuantity > 0 ? (
                    <span className="text-amber-700 font-semibold">{item.remainingQuantity}</span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </td>
                <td className="p-2 text-center text-zinc-600 text-[11px]">{item.unit}</td>
                {settings.showPriceOnDeliverySlip && (
                  <>
                    <td className="p-2 text-right font-mono text-zinc-700">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-zinc-900">
                      {formatCurrency(item.amount || 0)}
                    </td>
                  </>
                )}
                <td className="p-2 text-[11px] text-zinc-600 italic">
                  {item.remarks || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions & Declarations */}
      <div className="bg-amber-50/60 border border-amber-200 p-3 rounded mb-6 text-xs text-zinc-700 space-y-1">
        <p className="font-semibold text-amber-900">
          Declaration: {settings.deliverySlipNote || 'Goods received in good condition unless otherwise stated.'}
        </p>
        {deliverySlip.deliveryInstructions && (
          <p className="text-zinc-600">
            <strong className="text-zinc-800">Special Instructions:</strong> {deliverySlip.deliveryInstructions}
          </p>
        )}
        {deliverySlip.remarks && (
          <p className="text-zinc-600">
            <strong className="text-zinc-800">Delivery Remarks:</strong> {deliverySlip.remarks}
          </p>
        )}
      </div>

      {/* Receiver Information & Signatures */}
      <div className="border border-zinc-200 rounded p-4 bg-zinc-50 mb-6 text-xs">
        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-2">
          DELIVERY RECEIVER ACKNOWLEDGEMENT
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-zinc-700">
          <div>
            <span className="text-zinc-500 block text-[11px]">Receiver Name:</span>
            <span className="font-bold text-zinc-900">{deliverySlip.receiverName || '____________________'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Receiver Phone:</span>
            <span className="font-medium text-zinc-900">{deliverySlip.receiverPhone || '____________________'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Designation:</span>
            <span className="font-medium text-zinc-900">{deliverySlip.receiverDesignation || '____________________'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">Received Date &amp; Time:</span>
            <span className="font-medium text-zinc-900">
              {deliverySlip.receivedDate ? `${formatDate(deliverySlip.receivedDate)} ${deliverySlip.receivedTime || ''}` : '____ / ____ / 2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Block - Positioned at bottom */}
      <div className="grid grid-cols-3 gap-6 pt-8 items-end text-center text-xs text-zinc-700 border-t border-zinc-200 mt-6">
        <div>
          <div className="h-16 flex items-end justify-center pb-1">
            <div className="w-40 border-b border-zinc-400"></div>
          </div>
          <div className="pt-2 font-bold text-zinc-900 uppercase tracking-wide">CUSTOMER SIGNATURE</div>
        </div>

        <div>
          <div className="h-16 flex items-end justify-center pb-1">
            <div className="w-40 border-b border-zinc-400"></div>
          </div>
          <div className="pt-2 font-bold text-zinc-800">Delivery Person</div>
          <p className="text-[10px] text-zinc-400">{deliverySlip.driverName || 'Driver / Dispatcher'}</p>
        </div>

        <div>
          <div className="h-16 flex flex-col items-center justify-end pb-1">
            <div className="w-48 border-b border-zinc-500 mt-1"></div>
          </div>
          <div className="pt-2 font-bold text-zinc-900 uppercase tracking-wide">
            BISMILLAH MULTITRADE CORPORATION
          </div>
        </div>
      </div>
    </div>
  );
};
