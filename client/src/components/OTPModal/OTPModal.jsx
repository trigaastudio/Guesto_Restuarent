import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';

const OTPModal = ({ email, loading, onVerify, onResend, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

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

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  const handleResendClick = () => {
    if (canResend) {
      onResend();
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-background-card w-full max-w-md rounded-3xl border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 flex items-center justify-between border-b border-border-light bg-background-muted/30">
          <div className="flex items-center space-x-2 text-primary">
            <ShieldCheck size={24} />
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Verify Email</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-muted rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-text-secondary">We've sent a 6-digit verification code to</p>
            <p className="font-bold text-text-primary text-lg">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-background-muted/50 border-2 border-border-main rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-text-primary"
                  maxLength={1}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Create Account</span>
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <div className="flex flex-col items-center space-y-1">
              <p className="text-sm text-text-secondary">Didn't receive the code?</p>
              {canResend ? (
                <button
                  onClick={handleResendClick}
                  className="flex items-center space-x-2 text-primary font-bold hover:underline"
                >
                  <RefreshCw size={16} />
                  <span>Resend Code</span>
                </button>
              ) : (
                <p className="text-sm font-medium text-text-muted">
                  Resend available in <span className="text-primary font-bold">{timer}s</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-background-muted/30 border-t border-border-light text-center">
          <p className="text-xs text-text-muted">
            By verifying, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
