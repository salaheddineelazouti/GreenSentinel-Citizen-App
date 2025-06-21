import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { 
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-red-100 border border-red-300 rounded-md m-4">
          <h2 className="text-xl font-bold text-red-700 mb-2">Une erreur est survenue</h2>
          <p className="mb-4 text-red-600">L'application a rencontré une erreur inattendue.</p>
          <details className="border border-red-200 p-2 rounded bg-white">
            <summary className="font-semibold cursor-pointer">Détails de l'erreur</summary>
            <pre className="mt-2 text-sm overflow-auto p-2 bg-gray-50">
              {this.state.error?.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
