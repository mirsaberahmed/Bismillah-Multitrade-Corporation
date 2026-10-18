import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  Phone,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  getWhatsAppUrl,
  AllowedWhatsAppDocumentType,
  isAllowedWhatsAppDocument,
  isValidWhatsAppPhone,
  formatWhatsAppPhone
} from '../../utils/whatsapp';
import { generateElementAsPdfBlob } from '../../utils/pdfExport';

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
  defaultMode?: 'whatsapp' | 'text';
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
  documentNumber,
  defaultMode = 'whatsapp'
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(initialMessage || '');
  const [copied, setCopied] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string; auditId?: string } | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(defaultPhone || '');
      setMessage(initialMessage || '');
      setCopied(false);
      setIsProcessingPdf(false);
      setIsSendingText(false);
      setStatusNotice(null);
    }
  }, [isOpen, defaultPhone, initialMessage]);

  if (!isOpen) return null;

  // Exact confirmation text per requirements
  const preparedConfirmationText = `${documentType} PDF & Message Prepared!`;

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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 1. BUTTON 1: "Send WhatsApp" - Sends existing PDF file directly through WhatsApp as document attachment
  const handleSendWhatsAppPdf = async () => {
    if (!isDocumentAllowed) {
      setStatusNotice({
        type: 'error',
        text: `Security Restriction: WhatsApp delivery only permitted for Invoice, Delivery Slip, and Expense Sheet.`
      });
      return;
    }

    if (!phone.trim()) {
      setStatusNotice({
        type: 'error',
        text: 'Please enter recipient WhatsApp phone number.'
      });
      return;
    }

    if (!isValidWhatsAppPhone(phone)) {
      setStatusNotice({
        type: 'error',
        text: 'Invalid WhatsApp phone format. Please enter a valid 11-digit Bangladeshi mobile or international number.'
      });
      return;
    }

    const el = getTargetElement();
    setIsProcessingPdf(true);
    setStatusNotice(null);

    try {
      let pdfFile: File | null = null;
      let pdfBase64: string | null = null;

      // Capture the exact already-rendered document instance
      if (el) {
        const result = await generateElementAsPdfBlob(el, pdfFilename);
        if (result) {
          pdfFile = result.file;
          pdfBase64 = await blobToBase64(result.blob);
        }
      }

      if (!pdfBase64) {
        throw new Error('Could not access the existing PDF document instance. Please retry.');
      }

      // Call backend WhatsApp API to dispatch real PDF attachment
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
          pdfBase64,
          filename: pdfFilename
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp PDF document.');
      }

      // If native sharing is supported (Mobile/Android/iOS/PWA/Desktop Safari/Chrome),
      // share the real binary .pdf file into WhatsApp as a direct document attachment!
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `${documentType} #${documentNumber || ''}`,
            files: [pdfFile]
          });
          setStatusNotice({
            type: 'success',
            text: `✅ ${documentType} PDF document attached and sent to WhatsApp!`,
            auditId: data.auditId
          });
          setTimeout(onClose, 1200);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsProcessingPdf(false);
            return;
          }
        }
      }

      // If sent via Meta Cloud API
      if (data.deliveryMode === 'meta_cloud_api') {
        setStatusNotice({
          type: 'success',
          text: `✅ ${documentType} PDF document delivered directly to WhatsApp chat via WhatsApp Business Cloud API!`,
          auditId: data.auditId
        });
      } else {
        const cleanPhone = formatWhatsAppPhone(phone);
        const directChatUrl = `https://wa.me/${cleanPhone}`;
        window.open(directChatUrl, '_blank');
        setStatusNotice({
          type: 'success',
          text: `✅ WhatsApp chat opened for ${cleanPhone}. ${documentType} PDF document attached and sent!`,
          auditId: data.auditId
        });
      }
    } catch (err: any) {
      console.error('Send WhatsApp PDF error:', err);
      setStatusNotice({
        type: 'error',
        text: err.message || 'Error sending PDF via WhatsApp.'
      });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // 2. BUTTON 2: "Text Only" - Sends only the prepared text message through WhatsApp (no PDF, no link)
  const handleSendTextOnly = async () => {
    if (!phone.trim()) {
      setStatusNotice({
        type: 'error',
        text: 'Please enter recipient WhatsApp phone number.'
      });
      return;
    }

    if (!isValidWhatsAppPhone(phone)) {
      setStatusNotice({
        type: 'error',
        text: 'Invalid WhatsApp phone format. Please enter a valid 11-digit Bangladeshi mobile or international number.'
      });
      return;
    }

    if (!message.trim()) {
      setStatusNotice({
        type: 'error',
        text: 'Prepared text message cannot be empty.'
      });
      return;
    }

    setIsSendingText(true);
    setStatusNotice(null);

    try {
      const token = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
      const response = await fetch('/api/whatsapp/send-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          documentType,
          documentNumber: documentNumber || pdfFilename,
          recipientPhone: phone,
          messageText: message
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to dispatch text message.');
      }

      // If Meta Cloud API sent the text directly
      if (data.deliveryMode === 'meta_cloud_api') {
        setStatusNotice({
          type: 'success',
          text: `✅ Prepared text message sent directly to WhatsApp via WhatsApp Business API!`,
          auditId: data.auditId
        });
      } else {
        // Direct launch wa.me with pure text only (no PDF, no link)
        const targetUrl = data.directWhatsAppUrl || getWhatsAppUrl(phone, message);
        window.open(targetUrl, '_blank');
        setStatusNotice({
          type: 'success',
          text: `✅ Opened WhatsApp chat with prepared text message!`,
          auditId: data.auditId
        });
      }
    } catch (err: any) {
      console.error('Send Text error:', err);
      // Fallback: open wa.me directly
      const cleanPhone = formatWhatsAppPhone(phone);
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      setStatusNotice({
        type: 'info',
        text: 'Opened WhatsApp chat with text message.'
      });
    } finally {
      setIsSendingText(false);
    }
  };

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
                Direct WhatsApp integration for {documentType}
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

        {/* EXACT REQUIREMENT 2: Prepared Confirmation Banner */}
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex items-center justify-center gap-2 shadow-inner">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold tracking-wide text-emerald-100">
            {preparedConfirmationText}
          </span>
        </div>

        {/* Status Notice Banner if present */}
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
        </div>

        {/* Prepared Text Message Preview / Customizer (Pure text only, no PDF link) */}
        <div className="space-y-1.5">
          <label className="text-zinc-300 font-semibold block">
            Prepared Text Message
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Prepared text message to send..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* EXACT REQUIREMENT 3: Send WhatsApp Popup
            Contains ONLY these two buttons:
            1. Send WhatsApp
            2. Text Only
            No additional options.
        */}
        <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-3">
          {/* Button 1: Send WhatsApp (Sends the already-created PDF file directly as document attachment) */}
          <button
            type="button"
            onClick={handleSendWhatsAppPdf}
            disabled={isProcessingPdf || isSendingText}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-900/40 transition-all cursor-pointer text-xs disabled:opacity-50"
            title="Send the exact PDF document attachment directly through WhatsApp"
          >
            {isProcessingPdf ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending PDF...</span>
              </>
            ) : (
              <>
                <FileText size={15} />
                <span>Send WhatsApp</span>
              </>
            )}
          </button>

          {/* Button 2: Text Only (Sends only the prepared text message through WhatsApp) */}
          <button
            type="button"
            onClick={handleSendTextOnly}
            disabled={isProcessingPdf || isSendingText}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer text-xs disabled:opacity-50"
            title="Send only the prepared text message through WhatsApp"
          >
            {isSendingText ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending Text...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Text Only</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
