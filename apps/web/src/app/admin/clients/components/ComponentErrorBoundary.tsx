'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error(`[ErrorBoundary] Error caught in component "${this.props.componentName}":`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development' || true; // Force-enable details for user testing/grilling if requested

      return (
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 my-4 shadow-sm backdrop-blur-sm relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500/80"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Component Error: <span className="text-red-500 font-mono">{this.props.componentName}</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  An unexpected crash occurred inside this section. Other parts of the page remain active.
                </p>
              </div>
            </div>
            
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer active-press"
            >
              <RefreshCw size={12} className="animate-spin-slow" />
              Reset Component
            </button>
          </div>

          {isDev && this.state.error && (
            <div className="mt-5 border border-red-500/10 bg-black/40 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-red-400 overflow-x-auto max-h-60 space-y-2">
              <div className="font-bold flex items-center gap-1.5 border-b border-red-500/10 pb-1.5 mb-1.5">
                <XCircle size={14} className="shrink-0" />
                <span>{this.state.error.toString()}</span>
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="whitespace-pre-wrap opacity-80 pl-2 border-l border-red-500/10">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
