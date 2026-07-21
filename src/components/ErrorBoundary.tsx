import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Technical stack trace logged only for admins/developers in dev mode
    console.error('Unhandled dashboard render error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-neutral-100 shadow-xs max-w-lg mx-auto my-12 font-sans">
          <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-normal text-neutral-900 mb-2.5">Something went wrong</h2>
          <p className="text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
            The dashboard page encountered an unexpected issue while rendering. Try reloading the page or returning to the dashboard home.
          </p>

          <div className="flex items-center justify-center gap-3.5 w-full">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw size={14} />
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold transition-colors"
            >
              <Home size={14} />
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
