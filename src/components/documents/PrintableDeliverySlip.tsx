import React from 'react';
import { DeliverySlip, CompanySettings } from '../../types';
import { formatDate } from '../../utils/formatters';
import { BISMILLAH_SIGNATURE_DATA_URI } from '../../data/signatureData';

interface Props {
  deliverySlip: DeliverySlip;
  settings: CompanySettings;
}

export const PrintableDeliverySlip: React.FC<Props> = ({ deliverySlip, settings }) => {
  const totalDeliveredQty = deliverySlip.items.reduce(
    (sum, item) => sum + (Number(item.deliveredQuantity) || 0),
    0
  );

  return (
    <div
      id={`printable-delivery-slip-${deliverySlip.id}`}
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-8 font-sans print:p-2 print:max-w-[195mm] print:mx-auto text-sm leading-normal print:text-xs print:leading-normal select-none"
    >
      {/* Header */}
      <div className="border-b border-black pb-4 mb-6 print:pb-3 print:mb-4">
        <div className="flex justify-between items-start gap-5 print:gap-3">
          {/* Company Details */}
          <div className="flex-1">
            <h1 className="text-2xl print:text-xl font-black tracking-tight text-black uppercase mb-1">
              {settings.companyName}
            </h1>
            <p className="text-black font-bold text-xs print:text-[11px] tracking-wider uppercase mb-2 print:mb-1.5">
              {settings.businessType}
            </p>
            <div className="text-black text-xs print:text-[11px] space-y-1 print:space-y-0.5 leading-snug">
              <p>{settings.address}</p>
              <p>
                <span className="font-semibold">Phone:</span> {settings.phonePrimary}
                {settings.phoneSecondary && ` | ${settings.phoneSecondary}`}
              </p>
              {settings.email && (
                <p>
                  <span className="font-semibold">Email:</span> {settings.email}
                  {settings.website && ` | ${settings.website}`}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Slip Label & Core Reference */}
          <div className="text-right">
            <div className="inline-block border border-black bg-white text-black px-5 py-2 print:px-4 print:py-1 font-black text-xl print:text-sm tracking-widest uppercase mb-3 print:mb-1.5">
              DELIVERY SLIP
            </div>
            <div className="space-y-1.5 print:space-y-0.5 text-xs print:text-[11px] text-black">
              <p>
                <span className="font-medium">Delivery Slip No:</span>{' '}
                <strong className="font-mono text-sm print:text-xs">{deliverySlip.deliverySlipNumber}</strong>
              </p>
              <p>
                <span className="font-medium">Invoice No:</span>{' '}
                <strong className="font-mono">{deliverySlip.invoiceNumber}</strong>
              </p>
              <p>
                <span className="font-medium">Delivery Date:</span>{' '}
                <strong>{formatDate(deliverySlip.deliveryDate)}</strong>
              </p>
              {deliverySlip.poNumber && (
                <p>
                  <span className="font-medium">PO No:</span>{' '}
                  <strong>{deliverySlip.poNumber}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Deliver To & Delivery Information (Bigger boxes, Upper & Lower space created) */}
      <div className="grid grid-cols-2 gap-5 mb-6 print:gap-4 print:mb-4">
        {/* Deliver To Box */}
        <div className="border border-black bg-white p-4 print:p-3 flex flex-col justify-between min-h-[120px] print:min-h-[100px]">
          <div>
            <div className="text-xs print:text-[11px] font-black tracking-wider text-black uppercase mb-1.5">
              DELIVER TO
            </div>
            <p className="font-black text-black text-base print:text-sm">{deliverySlip.customerName}</p>
            {deliverySlip.companyName && deliverySlip.companyName !== deliverySlip.customerName && (
              <p className="text-xs print:text-[11px] font-bold text-black mt-0.5">{deliverySlip.companyName}</p>
            )}
            <p className="text-xs print:text-[11px] text-black mt-1 whitespace-pre-line leading-relaxed print:leading-snug">
              {deliverySlip.deliveryAddress || 'Address on file'}
            </p>
          </div>
          <div className="mt-3 pt-2 print:mt-1.5 print:pt-1 border-t border-black text-xs print:text-[11px] space-y-1 text-black">
            {deliverySlip.contactPerson && (
              <p><span className="font-medium">Contact Person:</span> <strong>{deliverySlip.contactPerson}</strong></p>
            )}
            {deliverySlip.phone && (
              <p><span className="font-medium">Phone:</span> <strong>{deliverySlip.phone}</strong></p>
            )}
          </div>
        </div>

        {/* Delivery Information Box */}
        <div className="border border-black bg-white p-4 print:p-3 flex flex-col justify-between min-h-[120px] print:min-h-[100px]">
          <div>
            <div className="text-xs print:text-[11px] font-black tracking-wider text-black uppercase mb-2">
              DELIVERY INFORMATION
            </div>
            <div className="space-y-3 print:space-y-1.5 text-xs print:text-[11px] text-black">
              <div>
                <span className="font-medium block text-xs print:text-[10px] uppercase mb-0.5 text-neutral-700">Delivery Method:</span>
                <span className="text-base print:text-xs font-black">{deliverySlip.deliveryMethod || 'Courier'}</span>
              </div>

              <div>
                <span className="font-medium block text-xs print:text-[10px] uppercase mb-0.5 text-neutral-700">Delivery Status:</span>
                <span className="text-base print:text-xs font-black uppercase tracking-wide">
                  {deliverySlip.deliveryStatus === 'Delivered'
                    ? 'Delivered'
                    : deliverySlip.deliveryStatus === 'Scheduled'
                    ? 'Scheduled'
                    : 'Dispatched'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Items Table (Lower space from boxes, larger row heights & fonts) */}
      <div className="mb-6 print:mb-4">
        <table className="w-full border-collapse text-left text-xs print:text-[11px] border border-black">
          <thead>
            <tr className="bg-white text-black font-black border-b border-black">
              <th className="p-2.5 print:py-2 print:px-2 w-12 text-center border-r border-black">SL</th>
              <th className="p-2.5 print:py-2 print:px-2.5 border-r border-black">Description</th>
              <th className="p-2.5 print:py-2 print:px-2 w-20 text-center border-r border-black">Box</th>
              <th className="p-2.5 print:py-2 print:px-2 w-20 text-center border-r border-black">Weight</th>
              <th className="p-2.5 print:py-2 print:px-2.5 w-28 text-right border-r border-black">Delivered Qty</th>
              <th className="p-2.5 print:py-2 print:px-2 w-16 text-center">Unit</th>
            </tr>
          </thead>
          <tbody>
            {deliverySlip.items.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-black bg-white"
              >
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-semibold border-r border-black">{index + 1}</td>
                <td className="p-2.5 print:py-2 print:px-2.5 border-r border-black">
                  <p className="font-black text-black text-sm print:text-xs">{item.productName}</p>
                  {item.description && (
                    <p className="text-xs print:text-[10px] text-black leading-snug mt-0.5 font-normal">{item.description}</p>
                  )}
                </td>
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-bold text-xs print:text-[11px] border-r border-black">
                  {item.boxCount || item.boxes || '-'}
                </td>
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-bold text-xs print:text-[11px] border-r border-black">
                  {item.weight ? (typeof item.weight === 'number' ? `${item.weight} kg` : item.weight) : '-'}
                </td>
                <td className="p-2.5 print:py-2 print:px-2.5 text-right font-mono font-black text-black text-base print:text-xs border-r border-black">
                  {item.deliveredQuantity}
                </td>
                <td className="p-2.5 print:py-2 print:px-2 text-center text-black font-semibold text-xs print:text-[10px]">{item.unit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white font-black border-t border-black">
              <td colSpan={2} className="p-2.5 print:py-2 print:px-2.5 text-right text-xs print:text-[11px] uppercase tracking-wider text-black border-r border-black">
                Total Delivered:
              </td>
              <td className="p-2.5 print:py-2 print:px-2 text-center text-xs print:text-[11px] font-black text-black border-r border-black">
                {deliverySlip.totalBoxes || '-'}
              </td>
              <td className="p-2.5 print:py-2 print:px-2 text-center text-xs print:text-[11px] font-black text-black border-r border-black">
                {deliverySlip.totalWeight || '-'}
              </td>
              <td className="p-2.5 print:py-2 print:px-2.5 text-right font-mono text-base print:text-xs font-black text-black border-r border-black">
                {totalDeliveredQty}
              </td>
              <td className="p-2.5 print:py-2 print:px-2 text-center text-xs print:text-[11px] text-black font-semibold">Units</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Receiver Information Box (Bigger box, Upper & Lower space created) */}
      <div className="border border-black bg-white p-4 print:p-3 mb-8 print:mb-5 text-xs print:text-[11px]">
        <span className="text-xs print:text-[11px] font-black text-black uppercase tracking-wider block mb-2.5">
          DELIVERY RECEIVER ACKNOWLEDGEMENT
        </span>
        <div className="grid grid-cols-3 gap-4 text-black">
          <div>
            <span className="font-semibold block text-xs print:text-[10px] uppercase mb-1 text-neutral-700">Name:</span>
            <span className="font-black text-black text-sm print:text-xs">{deliverySlip.receiverName || '-'}</span>
          </div>
          <div>
            <span className="font-semibold block text-xs print:text-[10px] uppercase mb-1 text-neutral-700">Phone:</span>
            <span className="font-black text-black text-sm print:text-xs">{deliverySlip.receiverPhone || '-'}</span>
          </div>
          <div>
            <span className="font-semibold block text-xs print:text-[10px] uppercase mb-1 text-neutral-700">Designation:</span>
            <span className="font-black text-black text-sm print:text-xs">{deliverySlip.receiverDesignation || '-'}</span>
          </div>
        </div>
      </div>

      {/* Official Seal & Signature on Right Only (Seal size: 29mm) */}
      <div className="flex justify-end items-end pt-4 mt-8 print:mt-6 print:pt-2 px-4 print:px-2 text-center text-xs print:text-[11px] text-black">
        <div className="flex flex-col items-center">
          <img
            src={BISMILLAH_SIGNATURE_DATA_URI}
            alt="Bismillah Multitrade Official Seal & Signature"
            className="w-[29mm] h-[29mm] print:w-[29mm] print:h-[29mm] object-contain mb-1.5 select-none pointer-events-none"
          />
          <div className="w-64 print:w-56 border-b border-black mb-1.5"></div>
          <div className="font-black text-black uppercase tracking-wide leading-tight text-xs print:text-[11px]">
            BISMILLAH MULTITRADE<br />CORPORATION
          </div>
        </div>
      </div>
    </div>
  );
};
