import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  Phone,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Share2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  getWhatsAppUrl,
  ALLOWED_WHATSAPP_DOCS,
  AllowedWhatsAppDocumentType,
  isAllowedWhatsAppDocument,
  isValidWhatsAppPhone,
  formatWhatsAppPhone
} from '../../utils/whatsapp';
import { generateElementAsPdfBlob, downloadElementAsPdf } from '../../utils/pdfExport';

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultPhone: string;
  initialMessage: string;
  recipientLabel?: string;
  pdfElementId?: string;
  pdfElement?: HTMLElement | null;
  pdfFilename?: string;
  documentType: AllowedWhatsAppDocumentType;
  documentNumber?: string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultPhone,
  initialMessage,
  recipientLabel = 'Customer WhatsApp Number',
  pdfElementId,
  pdfElement,
  pdfFilename = 'Document',
  documentType,
  documentNumber
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(initialMessage || '');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string; auditId?: string } | null>(null);
  const [readyWhatsAppUrl, setReadyWhatsAppUrl] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(defaultPhone || '');
      setMessage(initialMessage || '');
      setCopied(false);
      setIsExportingPdf(false);
      setStatusNotice(null);
      setReadyWhatsAppUrl(null);
    }
  }, [isOpen, defaultPhone, initialMessage]);

  if (!isOpen) return null;

  // Strict Business Validation: Target Documents Only
  const isDocumentAllowed = isAllowedWhatsAppDocument(documentType);

  const getTargetElement = (): HTMLElement | null => {
    if (pdfElement) return pdfElement;
    if (pdfElementId) {
      return document.getElementById(pdfElementId);
    }
    return null;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetMessage = () => {
    setMessage(initialMessage || '');
  };

  const handleClearMessage = () => {
    setMessage('');
  };

  // Direct PDF Download of the exact transaction document
  const handleDownloadOnly = async () => {
    const el = getTargetElement();
    if (!el) {
      setStatusNotice({
        type: 'error',
        text: 'Document preview element not found. Please verify document view.'
      });
      return;
    }
    setIsExportingPdf(true);
    setStatusNotice(null);
    try {
      await downloadElementAsPdf(el, pdfFilename, setIsExportingPdf);
      setStatusNotice({
        type: 'success',
        text: `Exact ${documentType} PDF downloaded successfully!`
      });
    } catch (err) {
      console.error('PDF download error:', err);
      setStatusNotice({
        type: 'error',
        text: 'Failed to download PDF. Please try again.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Convert exact blob to base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Primary Action: Dispatch via WhatsApp Business API module with exact PDF instance
  const handleSendToWhatsApp = async () => {
    if (!isDocumentAllowed) {
      setStatusNotice({
        type: 'error',
        text: `Security Restriction: WhatsApp sending is only permitted for Invoice, Delivery Slip, and Money Receipt.`
      });
      return;
    }

    if (!phone.trim()) {
      setStatusNotice({
        type: 'error',
        text: 'Please enter customer WhatsApp phone number.'
      });
      return;
    }

    if (!isValidWhatsAppPhone(phone)) {
      setStatusNotice({
        type: 'error',
        text: 'Invalid WhatsApp phone format. Please enter a valid 11-digit Bangladeshi mobile (e.g. 01712345678) or international number (+880...).'
      });
      return;
    }

    const el = getTargetElement();
    setIsExportingPdf(true);
    setStatusNotice(null);

    try {
      let pdfFile: File | null = null;
      let pdfBlob: Blob | null = null;
      let pdfBase64: string | null = null;

      // 1. Generate exact PDF instance from transaction view
      if (el) {
        const result = await generateElementAsPdfBlob(el, pdfFilename);
        if (result) {
          pdfFile = result.file;
          pdfBlob = result.blob;
          pdfBase64 = await blobToBase64(result.blob);
        }
      }

      if (!pdfBase64) {
        throw new Error('Could not generate the exact PDF document instance. Please retry.');
      }

      // 2. Call backend WhatsApp integration endpoint
      const token = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
      const response = await fetch('/api/whatsapp/send-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          documentType,
          documentNumber: documentNumber || pdfFilename,
          recipientPhone: phone,
          companionText: message,
          pdfBase64,
          filename: pdfFilename
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp document.');
      }

      const targetWaUrl = data.directWhatsAppUrl || getWhatsAppUrl(phone, message);
      setReadyWhatsAppUrl(targetWaUrl);

      // Check if native mobile sharing is available with file attachment
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `${documentType} #${documentNumber || ''}`,
            text: message,
            files: [pdfFile]
          });
          setStatusNotice({
            type: 'success',
            text: `✅ ${documentType} PDF shared directly to WhatsApp!`,
            auditId: data.auditId
          });
          setTimeout(onClose, 1400);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsExportingPdf(false);
            return;
          }
        }
      }

      // Automatically launch WhatsApp chat with document link & companion text
      try {
        const link = document.createElement('a');
        link.href = targetWaUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Auto open failed:', err);
      }

      const deliveryLabel = data.deliveryMode === 'meta_cloud_api'
        ? `Delivered via Meta WhatsApp Cloud API (Msg ID: ${data.messageId || 'Active'})`
        : `Verified document link generated & WhatsApp chat initiated!`;

      setStatusNotice({
        type: 'success',
        text: `✅ ${deliveryLabel}`,
        auditId: data.auditId
      });
    } catch (err: any) {
      console.error('WhatsApp send error:', err);
      setStatusNotice({
        type: 'error',
        text: err.message || 'Error preparing WhatsApp document.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const hasPdfSupport = !!(pdfElement || pdfElementId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-xs shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                  {documentType}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Official WhatsApp Business delivery for generated transaction documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Warning if document is not in whitelist */}
        {!isDocumentAllowed && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>
              Restricted: WhatsApp delivery is exclusively allowed for <strong>Invoice</strong>, <strong>Delivery Slip</strong>, and <strong>Money Receipt</strong> only.
            </span>
          </div>
        )}

        {/* PDF Document Attachment Badge */}
        {hasPdfSupport && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-zinc-300">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 text-[11px] flex items-center gap-1.5 truncate">
                  <span className="truncate">{pdfFilename}.pdf</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider shrink-0">
                    Exact Instance
                  </span>
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  Exact print-layout {documentType} PDF instance will be delivered
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadOnly}
              disabled={isExportingPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50 ml-2"
              title="Save a local copy of this exact PDF"
            >
              <Download size={12} />
              <span>Save PDF</span>
            </button>
          </div>
        )}

        {/* Status Notice Banner */}
        {statusNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              statusNotice.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-200'
                : statusNotice.type === 'error'
                ? 'bg-red-950/70 border border-red-500/40 text-red-200'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="leading-snug block font-medium">{statusNotice.text}</span>
              {statusNotice.auditId && (
                <span className="text-[10px] text-emerald-400 font-mono block">
                  Audit Ref: {statusNotice.auditId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Phone Number Input */}
        <div className="space-y-1.5">
          <label className="text-zinc-300 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-400" />
              {recipientLabel} *
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Formatted: {formatWhatsAppPhone(phone) ? `+${formatWhatsAppPhone(phone)}` : 'None'}
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. 01711234567 or +8801711234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none"
            autoFocus
          />
          <p className="text-[10px] text-zinc-500">
            Accepts Bangladeshi 11-digit mobile numbers (01...) or international numbers with country code.
          </p>
        </div>

        {/* Optional & Customizable Companion Text Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <span>Companion Text Message</span>
              <span className="text-[10px] font-normal text-zinc-500">(Optional / Editable)</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleResetMessage}
                className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset to default template"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleClearMessage}
                className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Send PDF without companion text"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ml-1"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter custom companion message to accompany the PDF, or leave blank..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Ready WhatsApp Link Banner */}
        {readyWhatsAppUrl && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500 rounded-xl space-y-2 text-center animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{documentType} PDF &amp; Message Prepared!</span>
            </div>
            <a
              href={readyWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-lg shadow-lg cursor-pointer transition-all active:scale-[0.99]"
            >
              <MessageSquare size={16} />
              <span>Open WhatsApp Chat &amp; Send Now</span>
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-zinc-800 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer text-center"
          >
            Close
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSendToWhatsApp}
              disabled={isExportingPdf || !isDocumentAllowed}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-900/30 transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing Exact PDF...</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Send {documentType} to WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
