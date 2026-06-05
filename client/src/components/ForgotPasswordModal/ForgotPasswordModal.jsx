import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Eye, EyeOff, AlertCircle, Mail, Lock, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import api from '../../api/axiosInstance';
import { showToast } from '../../utils/sweetAlert';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setFormData({
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.substring(0, 2)}${'*'.repeat(name.length - 4)}${name.substring(name.length - 2)}@${domain}`;
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-reset-otp', { email: email.toLowerCase().trim() });
      if (response.data.success) {
        setStep(2);
        showToast('success', 'OTP Verification Code Sent');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not found')) {
        setError('Email is not registered');
      } else {
        setError(msg || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError('Password must be 8-64 characters and include uppercase, lowercase, number, and special character');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      
      const verifyRes = await api.post('/api/auth/verify-reset-otp', { 
        email: email.toLowerCase().trim(), 
        otp: otpCode 
      });

      if (verifyRes.data.success) {
        
        const resetRes = await api.post('/api/auth/reset-password', {
          email: email.toLowerCase().trim(),
          newPassword: formData.newPassword
        });

        if (resetRes.data.success) {
          setStep(3);
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP or update password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    data.forEach((char, i) => {
      if (!isNaN(char)) newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(data.length, 5);
    document.getElementById(`forgot-otp-${nextIndex}`)?.focus();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-border/40">
        
        {/* Header */}
        <div className="p-8 bg-primary text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight">Recover Account</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-700 ease-out" 
                  style={{ width: `${(step/3) * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                Step {step} of 3
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-6 animate-shake">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Registered Email ID</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm forgot-modal-input placeholder:text-text-muted/40"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : (
                  <>
                    Send Verification Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={onClose}
                className="w-full text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-primary transition-colors pt-2"
              >
                Back to login
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-background rounded-full text-[10px] font-black text-text-muted uppercase border border-border/40">
                  <Mail size={12} className="text-primary" />
                  Code sent to {maskEmail(email)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-14 pr-12 py-3.5 bg-background border border-border/40 rounded-2xl text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-14 pr-12 py-3.5 bg-background border border-border/40 rounded-2xl text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block text-center">Enter 6-Digit OTP</label>
                <div className="flex justify-between gap-2 px-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`forgot-otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-10 h-12 bg-background border border-border/40 rounded-xl text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center px-1 pt-1">
                  <p className="text-[9px] font-bold text-text-muted opacity-60 uppercase tracking-widest">Sent to {email}</p>
                  <button type="button" onClick={handleSendOTP} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Resend OTP</button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] uppercase tracking-widest text-xs disabled:opacity-50 mt-4"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="py-8 flex flex-col items-center text-center animate-in zoom-in duration-500">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-green-500 shadow-xl border-4 border-green-50 relative z-10">
                  <CheckCircle2 size={56} strokeWidth={2.5} className="animate-in zoom-in duration-500 delay-300" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-text-primary tracking-tight">All Secured!</h3>
                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] leading-relaxed opacity-60">
                  Your password has been <br /> successfully updated.
                </p>
              </div>

              <div className="mt-10 w-12 h-1 bg-background-muted rounded-full overflow-hidden">
                <div className="w-full h-full bg-primary origin-left animate-progress"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .forgot-modal-input:-webkit-autofill,
        .forgot-modal-input:-webkit-autofill:hover, 
        .forgot-modal-input:-webkit-autofill:focus, 
        .forgot-modal-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #0c0c0c inset !important;
          -webkit-text-fill-color: var(--color-text-primary) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
};

export default ForgotPasswordModal;
