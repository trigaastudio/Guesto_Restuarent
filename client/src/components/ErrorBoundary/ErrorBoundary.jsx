import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      
      
      window.location.href = `/error?type=client&message=${encodeURIComponent(this.state.error?.message || 'An unexpected error occurred in the application.')}`;
      return null; 
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
