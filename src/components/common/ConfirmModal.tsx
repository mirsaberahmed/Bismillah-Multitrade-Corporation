import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            variant === 'danger' 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {variant === 'danger' ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{message}</p>
          </div>

          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-zinc-950/60 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
