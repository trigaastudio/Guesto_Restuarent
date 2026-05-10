import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

const ChangePasswordModal = ({ isOpen, onClose, userEmail }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState(userEmail || '');
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
      setEmail(userEmail || '');
      setOtp(['', '', '', '', '', '']);
      setFormData({
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
    }
  }, [isOpen, userEmail]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-reset-otp', { email });
      if (response.data.success) {
        setStep(2);
        Swal.fire({
          title: 'OTP Sent',
          text: 'A 6-digit verification code has been sent to your email.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-reset-otp', { email, otp: otp.join('') });
      if (response.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
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

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setStep(4);
        
        // Terminate session and redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.replace('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
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
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-background-card w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 bg-primary text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight">Change Password</h3>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
              {step === 1 ? 'Verify your identity' : step === 2 ? 'Enter verification code' : 'Set your new password'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 mb-6 animate-shake">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${step >= s ? 'bg-primary-light text-white shadow-lg' : 'bg-background-muted text-text-muted'}`}>
                  {step > s || step === 4 ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-500 ${step > s || step === 4 ? 'bg-primary-light' : 'bg-background-muted'}`}></div>
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-light transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-light/10 focus:border-primary-light/20 transition-all shadow-sm text-text-primary"
                    placeholder="Enter your email"
                  />
                </div>
                <p className="text-[9px] font-bold text-text-muted opacity-60 ml-1">We'll send a 6-digit code to this email</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-light hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary-light/20 active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block text-center">Verification Code</label>
                <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-background border border-border/40 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary-light/10 focus:border-primary-light/20 transition-all shadow-sm text-text-primary"
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center px-1 pt-2">
                  <p className="text-[9px] font-bold text-text-muted opacity-60 uppercase tracking-widest">Check your email</p>
                  <button type="button" onClick={handleSendOTP} className="text-[9px] font-black text-primary-light uppercase tracking-widest hover:underline">Resend Code</button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-light hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary-light/20 active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-light transition-colors" size={18} />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full pl-14 pr-12 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-light/10 focus:border-primary-light/20 transition-all shadow-sm text-text-primary"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => togglePassword('new')} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-light transition-colors" size={18} />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-14 pr-12 py-4 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-light/10 focus:border-primary-light/20 transition-all shadow-sm text-text-primary"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => togglePassword('confirm')} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-light hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-[0_15px_40px_rgba(218,145,51,0.2)] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
          {step === 4 && (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in slide-in-from-bottom-10 duration-700">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-green-500 shadow-xl border-4 border-green-50 relative z-10">
                  <CheckCircle2 size={56} strokeWidth={2.5} className="animate-in zoom-in duration-500 delay-300" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-text-primary tracking-tight">All Secured!</h3>
                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] leading-relaxed opacity-60">
                  Your password has been <br /> successfully updated
                </p>
              </div>

              <div className="mt-12 w-12 h-1 bg-background-muted rounded-full overflow-hidden">
                <div className="w-full h-full bg-primary-light origin-left animate-progress"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
