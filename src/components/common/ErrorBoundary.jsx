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
    console.error('Error caught by boundary:', error, errorInfo);
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
        <div className="min-h-screen flex items-center justify-center bg-dark-bg bg-starfield p-4">
          <div className="max-w-2xl w-full bg-dark-surface/80 backdrop-blur-sm border border-primary-red/30 rounded-lg p-8 text-center">
            <div className="text-primary-red text-6xl mb-4 flex justify-center">
              <FaExclamationTriangle />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4 font-display uppercase">
              SYSTEM ERROR DETECTED
            </h1>
            <p className="text-gray-400 mb-6 font-mono">
              An unexpected error has occurred. Our systems are working to resolve this issue.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-dark-bg border border-dark-border rounded text-left">
                <p className="text-primary-red font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                <details className="text-gray-500 font-mono text-xs">
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

