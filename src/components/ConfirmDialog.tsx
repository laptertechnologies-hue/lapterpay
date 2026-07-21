import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-neutral-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-[#011478] hover:bg-[#1e3a8a] active:bg-[#1d4ed8]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
