import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Search,
  Anchor,
  FileText,
  Calculator,
  Ship,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ImportRecord, ExportRecord } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

export const ImportExportManager: React.FC = () => {
  const {
    settings,
    importRecords,
    exportRecords,
    saveImportRecord,
    saveExportRecord,
    suppliers,
    customers,
    getNextNumber
  } = useData();

  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'landed_calc'>('import');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Import Form State
  const [importLcNumber, setImportLcNumber] = useState('');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierName, setSupplierName] = useState(suppliers[0]?.supplierName || '');
  const [portOfEntry, setPortOfEntry] = useState('Chittagong Seaport (CTG)');
  const [billOfEntry, setBillOfEntry] = useState('');
  const [itemDescription, setItemDescription] = useState('Industrial High-Precision Equipment & Spares');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(122.5);
  const [cifValueForeign, setCifValueForeign] = useState(25000);
  const [customsDuty, setCustomsDuty] = useState(150000);
  const [regulatoryDuty, setRegulatoryDuty] = useState(35000);
  const [vatTax, setVatTax] = useState(450000);
  const [aitTax, setAitTax] = useState(150000);
  const [cnfCharges, setCnfCharges] = useState(45000);
  const [shippingCharges, setShippingCharges] = useState(65000);
  const [status, setStatus] = useState<any>('LC Opened');

  // Interactive Landed Cost Calculator State
  const [calcQty, setCalcQty] = useState(100);
  const [calcUnitCifUSD, setCalcUnitCifUSD] = useState(250);
  const [calcRate, setCalcRate] = useState(122.5);
  const [calcCdRate, setCalcCdRate] = useState(25); // 25% Customs Duty
  const [calcRdRate, setCalcRdRate] = useState(3);  // 3% RD
  const [calcVatRate, setCalcVatRate] = useState(15); // 15% VAT
  const [calcAitRate, setCalcAitRate] = useState(5); // 5% AIT
  const [calcAtRate, setCalcAtRate] = useState(5);  // 5% Advance Tax
  const [calcCnfFixed, setCalcCnfFixed] = useState(40000);

  // Landed cost calculations
  const totalCifBDT = calcQty * calcUnitCifUSD * calcRate;
  const dutyCD = totalCifBDT * (calcCdRate / 100);
  const dutyRD = totalCifBDT * (calcRdRate / 100);
  const baseVAT = totalCifBDT + dutyCD + dutyRD;
  const dutyVAT = baseVAT * (calcVatRate / 100);
  const dutyAIT = totalCifBDT * (calcAitRate / 100);
  const dutyAT = baseVAT * (calcAtRate / 100);
  const totalCustomsTaxBDT = dutyCD + dutyRD + dutyVAT + dutyAIT + dutyAT;
  const grandLandedCostBDT = totalCifBDT + totalCustomsTaxBDT + calcCnfFixed;
  const landedCostPerUnitBDT = grandLandedCostBDT / (calcQty || 1);

  const handleSaveImport = (e: React.FormEvent) => {
    e.preventDefault();
    const cifBDT = cifValueForeign * exchangeRate;
    const totalCustoms = customsDuty + regulatoryDuty + vatTax + aitTax;
    const totalLandedCost = cifBDT + totalCustoms + cnfCharges + shippingCharges;

    const newImp: ImportRecord = {
      id: 'imp-' + Date.now(),
      importReference: getNextNumber('import'),
      lcNumber: importLcNumber,
      supplierId,
      supplierName,
      portOfEntry,
      billOfEntryNumber: billOfEntry,
      hsCode: '8479.89.00',
      itemDescription,
      currency,
      exchangeRate,
      cifValueForeign,
      cifValueBDT: cifBDT,
      customsDuty,
      regulatoryDuty,
      vatTax,
      aitTax,
      advanceTax: 0,
      cnfCharges,
      shippingCharges,
      otherCharges: 0,
      totalLandedCost,
      status,
      arrivalDate: getTodayDateString(),
      createdAt: getTodayDateString()
    };

    saveImportRecord(newImp);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Globe size={22} className="text-amber-500" />
            Import-Export &amp; International Trade
          </h1>
          <p className="text-xs text-zinc-400">
            IRC: <strong className="text-zinc-200">{settings.ircNumber}</strong> • ERC: <strong className="text-zinc-200">{settings.ercNumber}</strong> • Landed cost calculation &amp; customs clearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <ArrowDownLeft size={16} />
            <span>New Import (LC)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Ship size={15} />
          <span>Import Shipments &amp; Customs ({importRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('landed_calc')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'landed_calc'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calculator size={15} />
          <span>Landed Cost &amp; Customs Tariff Calculator</span>
        </button>
      </div>

      {/* TAB 1: IMPORT SHIPMENTS LIST */}
      {activeTab === 'import' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                  <th className="p-3">Import Ref</th>
                  <th className="p-3">LC / Contract No</th>
                  <th className="p-3">Supplier &amp; Goods</th>
                  <th className="p-3">Port &amp; Bill of Entry</th>
                  <th className="p-3 text-right">CIF Foreign</th>
                  <th className="p-3 text-right">Duties &amp; Taxes</th>
                  <th className="p-3 text-right">Total Landed Cost</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {importRecords.map(imp => {
                  const totalTaxes = (imp.customsDuty || imp.customDuty || 0) + (imp.regulatoryDuty || imp.rd || 0) + (imp.vatTax || imp.vat || 0) + (imp.aitTax || imp.ait || 0);
                  return (
                    <tr key={imp.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {imp.importReference}
                      </td>
                      <td className="p-3 font-mono text-zinc-300">
                        <p className="font-semibold">{imp.lcNumber}</p>
                        <span className="text-[10px] text-zinc-500">{formatDate(imp.createdAt)}</span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-zinc-200">{imp.supplierName}</p>
                        <p className="text-[11px] text-zinc-400 truncate max-w-xs">{imp.itemDescription}</p>
                      </td>
                      <td className="p-3 text-zinc-300">
                        <p className="text-[11px]">{imp.portOfEntry}</p>
                        <p className="font-mono text-[10px] text-zinc-500">B/E: {imp.billOfEntryNumber || 'Pending'}</p>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-zinc-200">
                        {imp.currency} {(imp.cifValueForeign || imp.cif || 0).toLocaleString()}
                        <span className="block text-[10px] text-zinc-500 font-sans">
                          @ {imp.exchangeRate} BDT
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-400">
                        {formatCurrency(totalTaxes)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(imp.totalLandedCost)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          imp.status === 'Arrived at Warehouse'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : imp.status === 'Customs Clearance'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : 'bg-blue-950 text-blue-400 border border-blue-800/50'
                        }`}>
                          {imp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE LANDED COST CALCULATOR */}
      {activeTab === 'landed_calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-xl text-xs">
          {/* Inputs Column */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-tight text-amber-400 flex items-center gap-2">
              <Calculator size={17} />
              Bangladesh Customs Landed Cost Engine
            </h2>
            <p className="text-zinc-400 text-xs">
              Simulates exact National Board of Revenue (NBR) customs assessment calculation for import consignment landed cost.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-zinc-400 mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">CIF Unit Price (USD $)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcUnitCifUSD}
                  onChange={(e) => setCalcUnitCifUSD(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">USD to BDT Exchange Rate</label>
                <input
                  type="number"
                  step="any"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Customs Duty (CD %)</label>
                <input
                  type="number"
                  value={calcCdRate}
                  onChange={(e) => setCalcCdRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Regulatory Duty (RD %)</label>
                <input
                  type="number"
                  value={calcRdRate}
                  onChange={(e) => setCalcRdRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  value={calcVatRate}
                  onChange={(e) => setCalcVatRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">AIT Rate (Advance Income Tax %)</label>
                <input
                  type="number"
                  value={calcAitRate}
                  onChange={(e) => setCalcAitRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Advance Tax (AT %)</label>
                <input
                  type="number"
                  value={calcAtRate}
                  onChange={(e) => setCalcAtRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-zinc-400 mb-1">C&amp;F Agency &amp; Port Demurrage (BDT fixed)</label>
                <input
                  type="number"
                  value={calcCnfFixed}
                  onChange={(e) => setCalcCnfFixed(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-3">
            <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-xs border-b border-zinc-800 pb-2">
              Consignment Landed Cost Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Assessable CIF Value (USD):</span>
                <span className="font-mono text-zinc-200">${(calcQty * calcUnitCifUSD).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Assessable CIF Value (BDT):</span>
                <span className="font-mono font-bold text-zinc-100">{formatCurrency(totalCifBDT)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Customs Duty ({calcCdRate}%):</span>
                <span className="font-mono text-zinc-300">{formatCurrency(dutyCD)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Regulatory Duty ({calcRdRate}%):</span>
                <span className="font-mono text-zinc-300">{formatCurrency(dutyRD)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>VAT ({calcVatRate}% on assessable base):</span>
                <span className="font-mono text-zinc-300">{formatCurrency(dutyVAT)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Advance Income Tax ({calcAitRate}%):</span>
                <span className="font-mono text-zinc-300">{formatCurrency(dutyAIT)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Advance Tax ({calcAtRate}%):</span>
                <span className="font-mono text-zinc-300">{formatCurrency(dutyAT)}</span>
              </div>

              <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-1">
                <span>Total Customs Taxes &amp; Duties:</span>
                <span className="font-mono font-bold text-amber-400">{formatCurrency(totalCustomsTaxBDT)}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>C&amp;F &amp; Handling:</span>
                <span className="font-mono text-zinc-300">{formatCurrency(calcCnfFixed)}</span>
              </div>
            </div>

            {/* Total Landed Cost Banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-1 mt-4">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Total Landed Cost (Consignment):
              </span>
              <p className="text-xl font-black font-mono text-amber-400">
                {formatCurrency(grandLandedCostBDT)}
              </p>

              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-semibold">Landed Cost Per Unit:</span>
                <span className="font-mono font-black text-white text-base">
                  {formatCurrency(landedCostPerUnitBDT)} / unit
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Ship size={18} className="text-blue-400" />
                Record New Import Consignment
              </h2>
              <button onClick={() => setShowImportModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveImport} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Letter of Credit (LC) Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1928-26-01-0928"
                    value={importLcNumber}
                    onChange={(e) => setImportLcNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Supplier / Exporter *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value);
                      const s = suppliers.find(sup => sup.id === e.target.value);
                      if (s) setSupplierName(s.supplierName);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplierName} ({s.country})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">Import Goods Description</label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Port of Discharge / Customs Station</label>
                  <input
                    type="text"
                    value={portOfEntry}
                    onChange={(e) => setPortOfEntry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Bill of Entry Number (if cleared)</label>
                  <input
                    type="text"
                    value={billOfEntry}
                    onChange={(e) => setBillOfEntry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CIF Consignment Value (Foreign)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 font-mono"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="CNY">CNY (¥)</option>
                    </select>
                    <input
                      type="number"
                      value={cifValueForeign}
                      onChange={(e) => setCifValueForeign(Number(e.target.value))}
                      className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Exchange Rate to BDT</label>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Customs Duties (CD + RD) BDT</label>
                  <input
                    type="number"
                    value={customsDuty + regulatoryDuty}
                    onChange={(e) => setCustomsDuty(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">VAT + AIT Taxes BDT</label>
                  <input
                    type="number"
                    value={vatTax + aitTax}
                    onChange={(e) => setVatTax(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">C&amp;F Agency Charges BDT</label>
                  <input
                    type="number"
                    value={cnfCharges}
                    onChange={(e) => setCnfCharges(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Consignment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="LC Opened">LC Opened</option>
                    <option value="In-Transit">In-Transit (Vessel)</option>
                    <option value="Customs Clearance">Customs Clearance (Port)</option>
                    <option value="Arrived at Warehouse">Arrived at Mirpur Warehouse</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  Save Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
