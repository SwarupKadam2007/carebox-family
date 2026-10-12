import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[CareBox ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FCF6EE] flex flex-col items-center justify-center p-6 text-center text-[#1F4E4B]">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-heading font-bold text-[#1F4E4B] mb-2">
            Something went unexpectedly wrong
          </h2>

          <p className="text-sm text-[#5C716E] max-w-sm mb-6 leading-relaxed">
            CareBox encountered an issue while rendering this screen. Your medication records and settings remain safe.
          </p>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E7D79] hover:bg-[#246562] text-white font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 text-left max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 font-mono overflow-auto max-h-40">
              <div className="font-bold mb-1">Developer Error Trace:</div>
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
