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
      className="printable-sheet bg-white text-black w-full max-w-4xl mx-auto p-6 font-sans print:p-0 print:max-w-[190mm] print:mx-auto text-xs leading-normal print:text-[10px] print:leading-tight select-none"
    >
      {/* Header */}
      <div className="border-b border-black pb-3 mb-4 print:pb-2 print:mb-2">
        <div className="flex justify-between items-start gap-4 print:gap-2">
          {/* Company Details */}
          <div className="flex-1">
            <h1 className="text-xl print:text-lg font-black tracking-tight text-black uppercase mb-0.5">
              {settings.companyName}
            </h1>
            <p className="text-black font-bold text-[11px] print:text-[10px] tracking-wider uppercase mb-1.5 print:mb-1">
              {settings.businessType}
            </p>
            <div className="text-black text-[11px] print:text-[9.5px] space-y-0.5 leading-tight">
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
            <div className="inline-block border border-black bg-white text-black px-4 py-1.5 print:px-3 print:py-0.5 font-bold text-lg print:text-sm tracking-widest uppercase mb-3 print:mb-1">
              DELIVERY SLIP
            </div>
            <div className="space-y-1 print:space-y-0.5 text-xs print:text-[10px] text-black">
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

      {/* Two-Column Deliver To & Delivery Information (Normal 1px border) */}
      <div className="grid grid-cols-2 gap-4 mb-4 print:gap-3 print:mb-2">
        {/* Deliver To */}
        <div className="border border-black bg-white p-3 print:p-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] print:text-[9.5px] font-bold tracking-wider text-black uppercase mb-1">
              DELIVER TO
            </div>
            <p className="font-bold text-black text-sm print:text-xs">{deliverySlip.customerName}</p>
            {deliverySlip.companyName && deliverySlip.companyName !== deliverySlip.customerName && (
              <p className="text-xs print:text-[10px] font-semibold text-black">{deliverySlip.companyName}</p>
            )}
            <p className="text-xs print:text-[10px] text-black mt-0.5 whitespace-pre-line leading-relaxed print:leading-tight">
              {deliverySlip.deliveryAddress || 'Address on file'}
            </p>
          </div>
          <div className="mt-2.5 pt-1.5 print:mt-1 print:pt-1 border-t border-black text-xs print:text-[10px] space-y-0.5 text-black">
            {deliverySlip.contactPerson && (
              <p><span className="font-medium">Contact Person:</span> {deliverySlip.contactPerson}</p>
            )}
            {deliverySlip.phone && (
              <p><span className="font-medium">Phone:</span> {deliverySlip.phone}</p>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="border border-black bg-white p-3 print:p-2 flex flex-col justify-between">
          <div>
            <div className="text-[11px] print:text-[9.5px] font-bold tracking-wider text-black uppercase mb-1.5 print:mb-1">
              DELIVERY INFORMATION
            </div>
            <div className="space-y-2 print:space-y-1 text-xs print:text-[10px] text-black">
              <div>
                <span className="font-medium block text-[11px] print:text-[9.5px] uppercase mb-0.5">Delivery Method:</span>
                <span className="text-sm print:text-xs font-bold">{deliverySlip.deliveryMethod || 'Courier'}</span>
              </div>

              <div>
                <span className="font-medium block text-[11px] print:text-[9.5px] uppercase mb-0.5">Delivery Status:</span>
                <span className="text-sm print:text-xs font-bold uppercase tracking-wide">
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

      {/* Delivery Items Table - Description, Box, Weight, Delivered Qty, Unit in separate columns/boxes */}
      <div className="mb-4 print:mb-2">
        <table className="w-full border-collapse text-left text-xs print:text-[10px] border border-black">
          <thead>
            <tr className="bg-white text-black font-bold border-b border-black">
              <th className="p-2 print:py-1 print:px-1.5 w-10 text-center border-r border-black">SL</th>
              <th className="p-2 print:py-1 print:px-2 border-r border-black">Description</th>
              <th className="p-2 print:py-1 print:px-1.5 w-16 text-center border-r border-black">Box</th>
              <th className="p-2 print:py-1 print:px-1.5 w-16 text-center border-r border-black">Weight</th>
              <th className="p-2 print:py-1 print:px-2 w-24 text-right border-r border-black">Delivered Qty</th>
              <th className="p-2 print:py-1 print:px-1.5 w-14 text-center">Unit</th>
            </tr>
          </thead>
          <tbody>
            {deliverySlip.items.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-black bg-white"
              >
                <td className="p-2 print:py-1 print:px-1.5 text-center text-black font-medium border-r border-black">{index + 1}</td>
                <td className="p-2 print:py-1 print:px-2 border-r border-black">
                  <p className="font-bold text-black text-xs print:text-[10px]">{item.productName}</p>
                  {item.description && (
                    <p className="text-[11px] print:text-[9.5px] text-black leading-snug mt-0.5 font-normal">{item.description}</p>
                  )}
                </td>
                <td className="p-2 print:py-1 print:px-1.5 text-center text-black font-semibold text-xs print:text-[10px] border-r border-black">
                  {item.boxCount || item.boxes || '-'}
                </td>
                <td className="p-2 print:py-1 print:px-1.5 text-center text-black font-semibold text-xs print:text-[10px] border-r border-black">
                  {item.weight ? (typeof item.weight === 'number' ? `${item.weight} kg` : item.weight) : '-'}
                </td>
                <td className="p-2 print:py-1 print:px-2 text-right font-mono font-bold text-black text-sm print:text-xs border-r border-black">
                  {item.deliveredQuantity}
                </td>
                <td className="p-2 print:py-1 print:px-1.5 text-center text-black font-medium text-xs print:text-[9.5px]">{item.unit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white font-bold border-t border-black">
              <td colSpan={2} className="p-2 print:py-1 print:px-2 text-right text-xs print:text-[10px] uppercase tracking-wider text-black border-r border-black">
                Total Delivered:
              </td>
              <td className="p-2 print:py-1 print:px-1.5 text-center text-xs print:text-[10px] font-bold text-black border-r border-black">
                {deliverySlip.totalBoxes || '-'}
              </td>
              <td className="p-2 print:py-1 print:px-1.5 text-center text-xs print:text-[10px] font-bold text-black border-r border-black">
                {deliverySlip.totalWeight || '-'}
              </td>
              <td className="p-2 print:py-1 print:px-2 text-right font-mono text-sm print:text-xs font-bold text-black border-r border-black">
                {totalDeliveredQty}
              </td>
              <td className="p-2 print:py-1 print:px-1.5 text-center text-xs print:text-[10px] text-black font-medium">Units</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Receiver Information (Only Name, Phone, Designation - No line underneath) */}
      <div className="border border-black bg-white p-3 print:p-2 mb-4 print:mb-2 text-xs print:text-[10px]">
        <span className="text-[11px] print:text-[9.5px] font-bold text-black uppercase tracking-wider block mb-1">
          DELIVERY RECEIVER ACKNOWLEDGEMENT
        </span>
        <div className="grid grid-cols-3 gap-3 text-black">
          <div>
            <span className="font-medium block text-[10px] uppercase mb-0.5">Name:</span>
            <span className="font-bold text-black text-xs print:text-[10px]">{deliverySlip.receiverName || '-'}</span>
          </div>
          <div>
            <span className="font-medium block text-[10px] uppercase mb-0.5">Phone:</span>
            <span className="font-bold text-black text-xs print:text-[10px]">{deliverySlip.receiverPhone || '-'}</span>
          </div>
          <div>
            <span className="font-medium block text-[10px] uppercase mb-0.5">Designation:</span>
            <span className="font-bold text-black text-xs print:text-[10px]">{deliverySlip.receiverDesignation || '-'}</span>
          </div>
        </div>
      </div>

      {/* Signatures Footer - Receiver on Left, Official Seal & Signature on Right */}
      <div className="flex justify-between items-end pt-3 mt-4 print:mt-1 print:pt-1 px-4 print:px-2 text-center text-xs print:text-[10px] text-black">
        <div>
          <div className="h-[24mm] print:h-[15mm] flex items-end justify-center pb-1">
            <div className="w-48 print:w-40 border-b border-black"></div>
          </div>
          <div className="pt-1 font-bold text-black uppercase tracking-wide">
            RECEIVER / CUSTOMER SIGNATURE
          </div>
        </div>

        <div>
          <div className="h-[24mm] print:h-[15mm] flex flex-col items-center justify-end pb-1">
            <img
              src={BISMILLAH_SIGNATURE_DATA_URI}
              alt="Bismillah Multitrade Official Seal & Signature"
              className="w-[24mm] h-[24mm] print:w-[15mm] print:h-[15mm] object-contain mb-0.5 select-none pointer-events-none"
            />
            <div className="w-56 print:w-48 border-b border-black"></div>
          </div>
          <div className="pt-1 font-bold text-black uppercase tracking-wide">
            BISMILLAH MULTITRADE CORPORATION
          </div>
        </div>
      </div>
    </div>
  );
};
