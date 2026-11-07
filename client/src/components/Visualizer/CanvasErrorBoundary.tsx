/**
 * @file CanvasErrorBoundary.tsx
 * @description Graceful error boundary for WebGL Canvas rendering failures.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Canvas Error Boundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-[#020308] p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            WebGL Acceleration Error
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            The 3D graphics context was interrupted or hardware acceleration is unavailable.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Visualizer</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;

