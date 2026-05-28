import React, { useState, useEffect } from 'react';
import './OTPModal.css';

const maskEmail = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 3) {
    return `${name[0]}***@${domain}`;
  }
  return `${name.substring(0, 2)}***${name.substring(name.length - 2)}@${domain}`;
};

const OTPModal = ({ email, onVerify, onResend, onClose, loading }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    onResend();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length === 6) {
      onVerify(finalOtp);
    }
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-content">
        <button className="close-modal" onClick={onClose}>&times;</button>
        <h2>Verify Your Email</h2>
        <p>We've sent a 6-digit code to <strong>{maskEmail(email)}</strong></p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #777)', marginTop: '-10px', marginBottom: '20px', fontStyle: 'italic' }}>
          (Please check your spam/junk folder as well)
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="otp-input-container">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                disabled={loading}
              />
            ))}
          </div>

          <div className="otp-timer">
            {timer > 0 ? (
              <span>Resend code in <strong>{timer}s</strong></span>
            ) : (
              <button type="button" className="resend-btn" onClick={handleResend}>
                Resend OTP
              </button>
            )}
          </div>

          <button type="submit" className="verify-btn" disabled={loading || otp.join('').length < 6}>
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPModal;
