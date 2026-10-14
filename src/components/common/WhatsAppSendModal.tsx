import React, { useState } from 'react';
import { MessageSquare, X, Send, Copy, Check, Phone } from 'lucide-react';
import { getWhatsAppUrl } from '../../utils/whatsapp';

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultPhone: string;
  initialMessage: string;
  recipientLabel?: string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultPhone,
  initialMessage,
  recipientLabel = 'WhatsApp Number'
}) => {
  const [phone, setPhone] = useState(defaultPhone || '');
  const [message, setMessage] = useState(initialMessage || '');
  const [copied, setCopied] = useState(false);

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setPhone(defaultPhone || '');
      setMessage(initialMessage || '');
      setCopied(false);
    }
  }, [isOpen, defaultPhone, initialMessage]);

  if (!isOpen) return null;

  const whatsappUrl = getWhatsAppUrl(phone, message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 text-xs shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-[11px] text-zinc-400">Directly send to any WhatsApp number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

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
            You can type any mobile or WhatsApp number. Format: 017... or +880...
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
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-zinc-700 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Keep modal open or close after brief delay
                setTimeout(onClose, 500);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-900/30 transition-all cursor-pointer text-xs"
            >
              <Send size={14} />
              <span>Send via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
