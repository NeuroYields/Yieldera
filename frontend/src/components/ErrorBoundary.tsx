import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Only log to console, don't show toast to avoid conflicts
    // with specific error handling in components
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cyber-black text-cyber-green p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-retro mb-4 text-glow">
              Something went wrong
            </h1>
            <p className="text-green-400 mb-6">
              An error occurred while loading the application. Please refresh
              the page and try again.
            </p>
            <button
              className="cyber-button px-6 py-3"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
