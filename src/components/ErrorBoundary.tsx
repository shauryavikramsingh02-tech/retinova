import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTabName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RetinaCare ErrorBoundary Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-headline">
              Component Display Recovered
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              A temporary rendering issue occurred in {this.props.fallbackTabName || 'this module'}. The platform prevented a blank screen.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left font-mono text-[11px] text-rose-700 max-h-28 overflow-y-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="pt-2 flex items-center justify-center space-x-3">
            <button
              onClick={this.handleReset}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Module</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
