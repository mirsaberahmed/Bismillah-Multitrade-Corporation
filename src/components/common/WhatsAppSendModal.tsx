import React, { useState } from 'react';
import { MessageSquare, X, Send, Copy, Check, Phone, FileText, Download, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { getWhatsAppUrl } from '../../utils/whatsapp';
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
  documentType?: 'Invoice' | 'Delivery Slip' | 'Expense Sheet' | string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultPhone,
  initialMessage,
  recipientLabel = 'WhatsApp Number',
  pdfElementId,
  pdfElement,
  pdfFilename = 'Document',
  documentType = 'Document'
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(initialMessage || '');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [readyWhatsAppUrl, setReadyWhatsAppUrl] = useState<string | null>(null);

  // Sync when opened
  React.useEffect(() => {
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

  const whatsappUrl = getWhatsAppUrl(phone, message);

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

  // Download PDF directly
  const handleDownloadOnly = async () => {
    const el = getTargetElement();
    if (!el) {
      setStatusNotice('Document preview element not found. Please print or open preview first.');
      return;
    }
    setIsExportingPdf(true);
    setStatusNotice(null);
    try {
      await downloadElementAsPdf(el, pdfFilename, setIsExportingPdf);
      setStatusNotice(`✅ ${documentType} PDF downloaded successfully!`);
    } catch (err) {
      console.error('PDF download error:', err);
      setStatusNotice('Failed to download PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Convert Blob to Base64 and upload to server for a direct PDF link
  const uploadPdfForSharing = async (blob: Blob, filename: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/pdf/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, pdfBase64: base64 })
          });
          const data = await res.json();
          if (data?.ok && data?.fullUrl) {
            resolve(data.fullUrl);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.warn('Could not upload PDF for public share link:', err);
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  };

  // Send PDF via WhatsApp
  const handleSendPdfToWhatsApp = async () => {
    const el = getTargetElement();
    setIsExportingPdf(true);
    setStatusNotice(null);

    try {
      let pdfFile: File | null = null;
      let pdfBlob: Blob | null = null;
      let directPdfUrl: string | null = null;

      if (el) {
        const result = await generateElementAsPdfBlob(el, pdfFilename);
        if (result) {
          pdfFile = result.file;
          pdfBlob = result.blob;
          // Upload to server for direct view & download link
          directPdfUrl = await uploadPdfForSharing(result.blob, pdfFilename);
        }
      }

      // Build message with direct PDF link
      let outgoingMessage = message;
      if (directPdfUrl) {
        outgoingMessage = `${message}\n\n📄 *Official PDF Document Link:*\n${directPdfUrl}\n_(Tap link to view or download full PDF document)_`;
      }

      const directWhatsAppUrl = getWhatsAppUrl(phone, outgoingMessage);

      // Check if Web Share API with file sharing is available (Mobile / Android / iOS)
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: pdfFilename,
            text: outgoingMessage,
            files: [pdfFile]
          });
          setStatusNotice(`✅ Shared ${documentType} PDF to WhatsApp!`);
          setTimeout(onClose, 1200);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsExportingPdf(false);
            return;
          }
          console.warn('Native share failed, falling back to download & WhatsApp Web:', shareErr);
        }
      }

      // Desktop WhatsApp Web / Browser Fallback:
      // 1. Download the generated PDF to the user's computer
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = pdfFilename.endsWith('.pdf') ? pdfFilename : `${pdfFilename}.pdf`;
        a.download = cleanName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (el) {
        await downloadElementAsPdf(el, pdfFilename);
      }

      // 2. Copy the final message with PDF link to clipboard
      try {
        await navigator.clipboard.writeText(outgoingMessage);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }

      setReadyWhatsAppUrl(directWhatsAppUrl);

      // 3. Open WhatsApp Web or wa.me chat directly via anchor click
      try {
        const link = document.createElement('a');
        link.href = directWhatsAppUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (openErr) {
        console.warn('Link click failed:', openErr);
      }

      setStatusNotice(
        `📄 ${documentType} PDF ready with shareable link! Click below to send on WhatsApp.`
      );
    } catch (err) {
      console.error('Send PDF error:', err);
      window.open(whatsappUrl, '_blank');
      setStatusNotice('Opened WhatsApp chat. Please attach the document.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const hasPdfSupport = !!(pdfElement || pdfElementId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-xs shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-[11px] text-zinc-400">
                {hasPdfSupport ? 'Send PDF document or message directly to WhatsApp' : 'Directly send to any WhatsApp number'}
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

        {/* PDF Document Attachment Badge */}
        {hasPdfSupport && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-zinc-300">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-semibold text-zinc-100 text-[11px] flex items-center gap-1.5">
                  <span>{pdfFilename}.pdf</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                    PDF Attached
                  </span>
                </p>
                <p className="text-[10px] text-zinc-400">
                  Exact print-layout {documentType} document will be delivered to WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadOnly}
              disabled={isExportingPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Download PDF copy"
            >
              <Download size={12} />
              <span>Save PDF</span>
            </button>
          </div>
        )}

        {/* Status Notice Banner */}
        {statusNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{statusNotice}</span>
          </div>
        )}

        {/* WhatsApp Phone Number Input */}
        <div className="space-y-1.5">
          <label className="block text-zinc-300 font-semibold flex items-center gap-1.5">
            <Phone size={13} className="text-emerald-400" />
            {recipientLabel} *
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
            Type any mobile or WhatsApp number. Format: 017... or +880...
          </p>
        </div>

        {/* Message Preview & Edit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-zinc-300 font-semibold">Message Preview</label>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <textarea
            rows={hasPdfSupport ? 5 : 7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-zinc-700 resize-none"
          />
        </div>

        {/* Ready WhatsApp Link Banner */}
        {readyWhatsAppUrl && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500 rounded-xl space-y-2 text-center animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{documentType} PDF Ready with Official Link!</span>
            </div>
            <a
              href={readyWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-lg shadow-lg cursor-pointer transition-all active:scale-[0.99]"
            >
              <MessageSquare size={16} />
              <span>Open WhatsApp Chat Now &amp; Send</span>
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
            {/* Primary Action 1: Send PDF via WhatsApp */}
            {hasPdfSupport && (
              <button
                type="button"
                onClick={handleSendPdfToWhatsApp}
                disabled={isExportingPdf}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-900/30 transition-all cursor-pointer text-xs disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Send PDF to WhatsApp</span>
                  </>
                )}
              </button>
            )}

            {/* Primary Action 2: Send Text Only Link */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setTimeout(onClose, 500);
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 ${
                hasPdfSupport
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              } font-bold rounded-lg transition-all cursor-pointer text-xs text-center`}
              title="Open WhatsApp with text summary"
            >
              <Send size={13} />
              <span>{hasPdfSupport ? 'Text Only' : 'Send via WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
