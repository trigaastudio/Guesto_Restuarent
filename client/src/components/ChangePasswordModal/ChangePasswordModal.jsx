import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { showToast } from '../../utils/sweetAlert';

const ChangePasswordModal = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setOtp(['', '', '', '', '', '']);
      setFormData({
        currentPassword: '',
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

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/users/send-change-password-otp');
      if (response.data.success) {
        setStep(2);
        showToast('success', 'OTP Verification Code Sent');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
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
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        newPassword: formData.newPassword,
        otp: otpCode
      };
      if (user.hasPassword) {
        payload.currentPassword = formData.currentPassword;
      }

      const response = await api.put('/api/users/change-password', payload);

      if (response.data.success) {
        setStep(3);
        
        
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
      <div className="bg-background-card w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-border/40">
        {/* Header */}
        <div className="p-6 bg-primary text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight">{user.hasPassword ? 'Change Password' : 'Setup Password'}</h3>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
              {step === 1 ? 'Verify your identity' : step === 2 ? 'Set your new password' : 'All secured!'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10">
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

          {}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${step >= s ? 'bg-primary text-white shadow-lg' : 'bg-background-muted text-text-muted'}`}>
                  {step > s || step === 3 ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 2 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-500 ${step > s || step === 3 ? 'bg-primary' : 'bg-background-muted'}`}></div>
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-xs font-bold text-text-muted leading-relaxed text-center">
                To configure or update your password, we need to send a 6-digit verification code to your registered email:
                <br />
                <span className="text-text-primary font-black block mt-2">{user.email}</span>
              </p>
              
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              
              {user.hasPassword && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full pl-14 pr-12 py-3.5 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
                      placeholder="Current password"
                    />
                    <button type="button" onClick={() => togglePassword('current')} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-14 pr-12 py-3.5 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
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
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-14 pr-12 py-3.5 bg-background border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all shadow-sm text-text-primary"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => togglePassword('confirm')} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
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
                      id={`otp-${index}`}
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
                  <p className="text-[9px] font-bold text-text-muted opacity-60 uppercase tracking-widest">Sent to {user.email}</p>
                  <button type="button" onClick={handleSendOTP} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Resend OTP</button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-green-500 shadow-xl border-4 border-green-50 relative z-10">
                  <CheckCircle2 size={56} strokeWidth={2.5} className="animate-in zoom-in duration-500 delay-300" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-text-primary tracking-tight">All Secured!</h3>
                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] leading-relaxed opacity-60">
                  Password updated. <br /> Redirecting to login page...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
