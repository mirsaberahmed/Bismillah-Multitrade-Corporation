import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Phone,
  FileText,
  Loader2,
  AlertTriangle,
  Send
} from 'lucide-react';
import {
  AllowedWhatsAppDocumentType,
  isAllowedWhatsAppDocument,
  isValidWhatsAppPhone,
  formatWhatsAppPhone
} from '../../utils/whatsapp';

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
  pdfFilename = 'Document',
  documentType,
  documentNumber
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(initialMessage || '');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [existingPdf, setExistingPdf] = useState<{
    exists: boolean;
    isAlreadyCreated?: boolean;
    filename?: string;
    url?: string;
    fileSizeBytes?: number;
  } | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    pdfUrl?: string;
    filename?: string;
  } | null>(null);

  // Sync state and check for already-created PDF when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(defaultPhone || '');
      setMessage(initialMessage || '');
      setCopied(false);
      setIsProcessing(false);
      setIsSendingText(false);
      setStatusNotice(null);

      // Check if official PDF is already created on server
      const cleanName = pdfFilename || `${documentType}-${documentNumber || 'doc'}`;
      fetch(`/api/pdf/check/${encodeURIComponent(cleanName)}?type=${encodeURIComponent(documentType)}&number=${encodeURIComponent(documentNumber || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.exists) {
            setExistingPdf(data);
          } else {
            setExistingPdf(null);
          }
        })
        .catch(err => {
          console.warn('Check existing PDF error:', err);
          setExistingPdf(null);
        });
    }
  }, [isOpen, defaultPhone, initialMessage, pdfFilename, documentType, documentNumber]);

  if (!isOpen) return null;

  const isDocumentAllowed = isAllowedWhatsAppDocument(documentType);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Send WhatsApp with Official PDF Document
  const handleSendWhatsApp = async () => {
    if (!isDocumentAllowed) {
      setStatusNotice({
        type: 'error',
        text: `Security Restriction: WhatsApp delivery only permitted for Invoice, Delivery Slip, Expense Sheet, and Money Receipt.`
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

    setIsProcessing(true);
    setStatusNotice(null);

    try {
      const targetFilename = existingPdf?.filename || (pdfFilename.endsWith('.pdf') ? pdfFilename : `${pdfFilename}.pdf`);

      // Call backend WhatsApp API using the ALREADY-CREATED PDF instance
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
          filename: targetFilename,
          clientOrigin: window.location.origin,
          messageText: message,
          useExistingPdf: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp document.');
      }

      const activeFilename = data.filename || targetFilename;
      const cleanPhone = formatWhatsAppPhone(phone);
      const publicPdfUrl = data.pdfUrl || `${window.location.origin}/api/pdf/${activeFilename}`;
      const messageWithPdfLink = message.trim()
        ? `${message.trim()}\n\n📄 *Official PDF Document:*\n${publicPdfUrl}`
        : `Official ${documentType} #${documentNumber || ''}\n\n📄 *Official PDF Document:*\n${publicPdfUrl}`;

      const directChatUrl = data.directWhatsAppUrl || `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageWithPdfLink)}`;

      // Fetch the exact already-created PDF blob for auto-download & mobile share
      let pdfFile: File | null = null;
      let pdfBlob: Blob | null = null;
      try {
        const blobRes = await fetch(`/api/pdf/${activeFilename}`);
        if (blobRes.ok) {
          pdfBlob = await blobRes.blob();
          pdfFile = new File([pdfBlob], activeFilename, { type: 'application/pdf' });
        }
      } catch (blobErr) {
        console.warn('Error fetching PDF blob for download:', blobErr);
      }

      // Automatically download the exact already-created PDF to the user's device
      if (pdfBlob) {
        try {
          const downloadUrl = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = activeFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        } catch (dlErr) {
          console.warn('Auto-download PDF error:', dlErr);
        }
      }

      // If native sharing is supported (Mobile/Android/iOS/PWA),
      // share the real binary .pdf file into WhatsApp as a direct document attachment
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `${documentType} #${documentNumber || ''}`,
            text: messageWithPdfLink,
            files: [pdfFile]
          });
          setTimeout(onClose, 800);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsProcessing(false);
            return;
          }
          console.warn('Web Share fallback to direct link:', shareErr);
        }
      }

      // Direct WhatsApp chat link
      try {
        const link = document.createElement('a');
        link.href = directChatUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.open(directChatUrl, '_blank');
      }

      setTimeout(onClose, 800);
    } catch (err: any) {
      console.error('Send WhatsApp error:', err);
      const cleanPhone = formatWhatsAppPhone(phone);
      const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      try {
        window.open(fallbackUrl, '_blank');
        setTimeout(onClose, 800);
      } catch {
        setStatusNotice({
          type: 'error',
          text: err.message || 'Error opening WhatsApp chat.'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Send Text Only (Direct text dispatch to WhatsApp)
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
        text: 'Send text box cannot be empty.'
      });
      return;
    }

    setIsSendingText(true);
    setStatusNotice(null);

    try {
      const cleanPhone = formatWhatsAppPhone(phone);
      const targetUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp chat directly with the text message
      try {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.open(targetUrl, '_blank');
      }

      setTimeout(onClose, 800);
    } catch (err: any) {
      console.error('Send Text error:', err);
      setStatusNotice({
        type: 'error',
        text: err.message || 'Error opening WhatsApp text chat.'
      });
    } finally {
      setIsSendingText(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        
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

        {/* Status Error Notice if present */}
        {statusNotice && statusNotice.type === 'error' && (
          <div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-red-950/70 border border-red-500/40 text-red-200">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug block font-medium">{statusNotice.text}</span>
          </div>
        )}

        {/* Target Document Info */}
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
          <FileText size={14} className="text-emerald-400 shrink-0" />
          <span>
            Target Document: <strong className="text-zinc-100 font-mono">{pdfFilename || documentNumber}</strong>
          </span>
        </div>

        {/* WhatsApp Phone Number Input */}
        <div className="space-y-1.5">
          <label className="text-zinc-300 font-semibold flex items-center justify-between text-xs">
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

        {/* SEND TEXT BOX (Explicitly Highlighted Message Input Area) */}
        <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 focus-within:border-emerald-500/60 transition-colors">
          <div className="flex items-center justify-between">
            <label className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
              <MessageSquare size={13} />
              <span>Send Text Box (Message Text)</span>
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-zinc-400 hover:text-emerald-400 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type or edit the message here..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-500 resize-none shadow-inner"
          />
          <p className="text-[10px] text-zinc-400">
            Write or edit your text message above to send directly via WhatsApp.
          </p>
        </div>

        {/* Action Buttons: Send WhatsApp and Send Text */}
        <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-3">
          {/* Button 1: Send WhatsApp (Sends document + message) */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={isProcessing || isSendingText}
            className="flex items-center justify-center gap-2 py-2.5 px-3 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-xs disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
            title="Send official PDF document & message directly through WhatsApp"
          >
            {isProcessing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FileText size={14} className="text-white" />
                <span>Send WhatsApp</span>
              </>
            )}
          </button>

          {/* Button 2: Send Text (Sends only the message from the Send Text Box) */}
          <button
            type="button"
            onClick={handleSendTextOnly}
            disabled={isProcessing || isSendingText}
            className="flex items-center justify-center gap-2 py-2.5 px-3 font-bold rounded-xl transition-all cursor-pointer text-xs disabled:opacity-50 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700"
            title="Send message from Send Text Box directly to WhatsApp"
          >
            {isSendingText ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending Text...</span>
              </>
            ) : (
              <>
                <Send size={14} className="text-emerald-400" />
                <span>Send Text</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
