import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // We will redirect to the error page, or we could render a fallback directly.
      // Redirecting ensures URL matches.
      window.location.href = `/error?type=client&message=${encodeURIComponent(this.state.error?.message || 'An unexpected error occurred in the application.')}`;
      return null; // Return null while redirecting
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
