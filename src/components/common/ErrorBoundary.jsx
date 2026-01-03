import { Component } from 'react';
import { Button } from '../ui/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Safely log error to avoid "Cannot convert object to primitive value" error
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error caught by boundary:', errorMessage, errorInfo?.componentStack || '');
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full tech-panel-strong rounded-lg p-8 text-center border-glow-red">
            <div className="text-primary text-6xl mb-4 flex justify-center">
              <FaExclamationTriangle />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4 font-display uppercase">
              SYSTEM ERROR DETECTED
            </h1>
            <p className="text-muted-foreground mb-6 font-mono">
              An unexpected error has occurred. Our systems are working to resolve this issue.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 tech-panel border border-border rounded text-left">
                <p className="text-primary font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                <details className="text-muted-foreground font-mono text-xs">
                  <summary className="cursor-pointer mb-2">Stack Trace</summary>
                  <pre className="overflow-auto max-h-48">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button variant="primary" onClick={this.handleReset}>
                RETURN TO BASE
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                RELOAD SYSTEM
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

