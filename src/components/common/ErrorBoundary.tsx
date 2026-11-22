import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Top-level UI ErrorBoundary so uncaught render exceptions show a clean recovery screen
 * instead of blanking out the entire storefront.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected UI error',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Uncaught UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {this.props.fallbackTitle || 'Something went wrong / कृपया पेज रीलोड करें'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload ताज़ाMandi</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
