import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  title = 'Failed to load details',
  message = 'An error occurred while fetching information from the server. Check your connection and try again.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="bg-white border border-neutral-200/85 rounded-3xl p-8 md:p-12 text-center max-w-md mx-auto shadow-xs my-8 font-sans">
      <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
        >
          <RefreshCw size={12} />
          Retry Request
        </button>
      )}
    </div>
  );
}
