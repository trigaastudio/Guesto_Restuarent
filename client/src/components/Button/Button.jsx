import React from 'react';
import './Button.css';

const Button = ({ children, onClick, type = 'button', disabled = false, loading = false, className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`custom-button ${className} ${loading ? 'loading' : ''}`}
    >
      {loading ? <div className="btn-spinner"></div> : children}
    </button>
  );
};

export default Button;
