import React, { useState } from 'react';
import {
  Settings,
  Save,
  Building,
  CreditCard,
  Truck,
  FileText,
  Upload,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CompanySettings } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsManager: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData } = useData();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('logoUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('signatureUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle seal upload
  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('sealUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-amber-500" />
            Company Profile &amp; Business Configuration
          </h1>
          <p className="text-xs text-zinc-400">
            Official trade registration numbers, banking credentials, inventory deduction rules, and print layout options.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: COMPANY IDENTITY & ADDRESS */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 text-xs">
        <h2 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Building size={16} />
          Company Identity &amp; Contact Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-zinc-400 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-bold"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Business Type</label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Default Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-400 mb-1">Official Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Phone Numbers</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Official Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Official Website</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Default Base Currency</label>
            <input
              type="text"
              value={formData.defaultCurrency}
              onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: STATUTORY & TRADE REGISTRATION NUMBERS */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 text-xs">
        <h2 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <FileText size={16} />
          Statutory &amp; Trade Registration Numbers
        </h2>
        <p className="text-zinc-400 text-[11px]">
          Only non-empty registration numbers will appear on printed invoices and trade documents.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-zinc-400 mb-1">BIN Number (VAT Reg)</label>
            <input
              type="text"
              value={formData.binNumber}
              onChange={(e) => handleChange('binNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">TIN Number (Taxpayer ID)</label>
            <input
              type="text"
              value={formData.tinNumber}
              onChange={(e) => handleChange('tinNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Trade License Number</label>
            <input
              type="text"
              value={formData.tradeLicenseNumber}
              onChange={(e) => handleChange('tradeLicenseNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">IRC Number (Import Reg)</label>
            <input
              type="text"
              value={formData.ircNumber}
              onChange={(e) => handleChange('ircNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">ERC Number (Export Reg)</label>
            <input
              type="text"
              value={formData.ercNumber}
              onChange={(e) => handleChange('ercNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Chamber Membership Number</label>
            <input
              type="text"
              value={formData.membershipNumber}
              onChange={(e) => handleChange('membershipNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">VAT Registration Number</label>
            <input
              type="text"
              value={formData.vatRegistrationNumber}
              onChange={(e) => handleChange('vatRegistrationNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: BANKING & MOBILE FINANCIAL SERVICES */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 text-xs">
        <h2 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <CreditCard size={16} />
          Bank Accounts &amp; Mobile Banking (bKash &amp; Nagad)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-zinc-400 mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-semibold"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Bank Account Number</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Branch Name</label>
            <input
              type="text"
              value={formData.branchName}
              onChange={(e) => handleChange('branchName', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">SWIFT Code</label>
            <input
              type="text"
              value={formData.swiftCode}
              onChange={(e) => handleChange('swiftCode', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-pink-400 mb-1 font-semibold">bKash Merchant / Agent Number</label>
            <input
              type="text"
              value={formData.bkashNumber}
              onChange={(e) => handleChange('bkashNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-pink-900/60 rounded-lg px-3 py-1.5 text-pink-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-orange-400 mb-1 font-semibold">Nagad Enterprise Number</label>
            <input
              type="text"
              value={formData.nagadNumber}
              onChange={(e) => handleChange('nagadNumber', e.target.value)}
              className="w-full bg-zinc-950 border border-orange-900/60 rounded-lg px-3 py-1.5 text-orange-300 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: OPERATIONAL WORKFLOW RULES (CRITICAL INVENTORIES & DELIVERY NOTE CONFIG) */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 text-xs">
        <h2 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Truck size={16} />
          Workflow Rules: Stock Reduction &amp; Delivery Slip Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Reduction Timing Rule */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div>
              <span className="font-bold text-zinc-100 block">Inventory Stock Deduction Timing:</span>
              <span className="text-[11px] text-zinc-400">
                Choose when physical warehouse inventory should be decreased.
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors">
                <input
                  type="radio"
                  name="reduceStockAt"
                  checked={formData.reduceStockAt === 'delivery_confirmation'}
                  onChange={() => handleChange('reduceStockAt', 'delivery_confirmation')}
                  className="mt-0.5 text-amber-500 focus:ring-0"
                />
                <div>
                  <strong className="text-zinc-200 block">At Delivery Slip Confirmation (Recommended)</strong>
                  <span className="text-[11px] text-zinc-400">
                    Stock is deducted only when goods actually leave the depot with a generated Delivery Slip.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors">
                <input
                  type="radio"
                  name="reduceStockAt"
                  checked={formData.reduceStockAt === 'invoice_confirmation'}
                  onChange={() => handleChange('reduceStockAt', 'invoice_confirmation')}
                  className="mt-0.5 text-amber-500 focus:ring-0"
                />
                <div>
                  <strong className="text-zinc-200 block">At Sales Invoice Creation</strong>
                  <span className="text-[11px] text-zinc-400">
                    Stock is immediately reserved and deducted as soon as the invoice is saved.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Show Price on Delivery Slip Toggle */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div>
              <span className="font-bold text-zinc-100 block">Pricing on Delivery Slips:</span>
              <span className="text-[11px] text-zinc-400">
                Configure whether item prices and invoice values appear on the printed delivery slip / chalan.
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showPriceOnDeliverySlip}
                  onChange={(e) => handleChange('showPriceOnDeliverySlip', e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                />
                <span className="text-zinc-200 font-semibold">
                  Display Unit Prices and Values on Printed Delivery Slips
                </span>
              </label>
              <p className="text-[11px] text-zinc-500 mt-2">
                Note: Standard trade practice in Bangladesh omits pricing from driver/gate-pass chalans.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: SIGNATURES, SEALS & LOGOS */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 text-xs">
        <h2 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Upload size={16} />
          Digital Assets, Signatures &amp; Seals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-zinc-800 rounded-xl p-4 text-center space-y-2 bg-zinc-950">
            <span className="font-bold text-zinc-300 block">Company Logo</span>
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" className="h-14 mx-auto object-contain" />
            ) : (
              <div className="h-14 flex items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded">
                No Logo Uploaded
              </div>
            )}
            <label className="inline-block px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer text-[11px]">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="border border-zinc-800 rounded-xl p-4 text-center space-y-2 bg-zinc-950">
            <span className="font-bold text-zinc-300 block">Authorized Signature</span>
            {formData.signatureUrl ? (
              <img src={formData.signatureUrl} alt="Signature" className="h-14 mx-auto object-contain" />
            ) : (
              <div className="h-14 flex items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded">
                No Signature Uploaded
              </div>
            )}
            <label className="inline-block px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer text-[11px]">
              Upload Signature
              <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
            </label>
          </div>

          <div className="border border-zinc-800 rounded-xl p-4 text-center space-y-2 bg-zinc-950">
            <span className="font-bold text-zinc-300 block">Official Seal / Stamp</span>
            {formData.sealUrl ? (
              <img src={formData.sealUrl} alt="Seal" className="h-14 mx-auto object-contain" />
            ) : (
              <div className="h-14 flex items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded">
                No Seal Uploaded
              </div>
            )}
            <label className="inline-block px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer text-[11px]">
              Upload Seal
              <input type="file" accept="image/*" className="hidden" onChange={handleSealUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* Fresh Start / Reset to 0 Section */}
      <div className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Fresh Start / Reset Financials to 0
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Reset all sales turnover, customer receivables, supplier payables, and transactions to 0 for a brand new operational period.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-800/60 rounded-lg text-xs font-medium transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Reset All Values to 0 (Fresh Start)
          </button>
        </div>
        {resetSuccess && (
          <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} />
            All financial values, receivables, turnover, and payables have been cleanly reset to 0!
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Financials to 0"
        message="Are you sure you want to reset all turnover, receivables, payables, and transactions to 0? This will prepare a fresh start for a new financial period."
        confirmText="Reset All Data"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          resetToDefaultData();
          setShowResetConfirm(false);
          setResetSuccess(true);
          setTimeout(() => setResetSuccess(false), 4000);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </form>
  );
};
