import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { AlertTriangle, CheckCircle, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-sm text-gray-500">An unexpected error occurred</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <p className="text-sm font-mono text-gray-700">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global toast context
const ToastContext = React.createContext<{
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}>({ showToast: () => {}, hideToast: () => {} });

export const useToast = () => React.useContext(ToastContext);

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
            getColors(toast.type)
          )}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-hide after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      hideToast(id);
    }, duration);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleError = (error: Error) => {
    showToast({
      type: 'error',
      title: 'Application Error',
      message: 'An unexpected error occurred. Please try refreshing the page.',
      duration: 10000
    });
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      <ErrorBoundary onError={handleError}>
        <div className="min-h-screen bg-gray-50 transition-colors duration-200">
          <Navigation currentTab={currentTab} onTabChange={onTabChange} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
          <ToastContainer toasts={toasts} onClose={hideToast} />
        </div>
      </ErrorBoundary>
    </ToastContext.Provider>
  );
}