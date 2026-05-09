import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Eye, EyeOff, AlertCircle, Mail, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
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
      const response = await api.post('/api/auth/send-reset-otp', { email });
      if (response.data.success) {
        setStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('does not exist')) {
        setError('email is not registered');
      } else {
        setError(msg || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-reset-otp', { email, otp: otpValue });
      if (response.data.success) {
        Swal.fire({
          title: 'Identity Verified',
          text: 'The code is correct. You can now set your new password.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true
        });
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
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
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
      document.getElementById(`forgot-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`forgot-otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-10 bg-[#D10000] text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter lowercase">recover account</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-700 ease-out" 
                  style={{ width: `${(step/4) * 100}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-black text-white/60 lowercase tracking-widest">
                step {step} of 4
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 relative z-10 backdrop-blur-md border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 mb-6 animate-shake">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-red-600 leading-none">{error}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 lowercase ml-1">enter you registered email id</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#DA9133] transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#DA9133]/10 focus:border-[#DA9133]/30 transition-all shadow-sm forgot-modal-input placeholder:text-gray-300"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#DA9133] hover:bg-[#C27D29] text-white font-black py-5 rounded-3xl transition-all shadow-[0_15px_40px_rgba(218,145,51,0.3)] active:scale-[0.98] lowercase text-xs flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                {loading ? 'sending code...' : (
                  <>
                    send verification code
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={onClose}
                className="w-full text-[10px] font-black text-gray-400 lowercase hover:text-gray-900 transition-colors pt-2"
              >
                back to login
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 lowercase">
                  <Mail size={12} />
                  code sent to {maskEmail(email)}
                </div>
              </div>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`forgot-otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-10 h-14 sm:w-12 sm:h-16 bg-white border border-gray-100 rounded-2xl text-xl sm:text-2xl font-black text-black text-center focus:outline-none focus:ring-4 focus:ring-[#DA9133]/10 focus:border-[#DA9133]/30 transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="space-y-6 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#DA9133] hover:bg-[#C27D29] text-white font-black py-5 rounded-3xl transition-all shadow-[0_15px_40px_rgba(218,145,51,0.3)] active:scale-[0.98] lowercase text-xs disabled:opacity-50"
                >
                  {loading ? 'verifying...' : 'verify & continue'}
                </button>
                <button type="button" onClick={handleSendOTP} className="w-full text-[10px] font-bold text-gray-500 lowercase hover:text-[#DA9133] transition-colors">
                  didn't get the code? resend
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 lowercase ml-1">new password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#DA9133] transition-colors" size={20} />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full pl-14 pr-12 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#DA9133]/10 focus:border-[#DA9133]/30 transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 lowercase ml-1">confirm password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#DA9133] transition-colors" size={20} />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-14 pr-12 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-[#DA9133]/10 focus:border-[#DA9133]/30 transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#DA9133] hover:bg-[#C27D29] text-white font-black py-5 rounded-3xl transition-all shadow-[0_15px_40px_rgba(218,145,51,0.3)] active:scale-[0.98] lowercase text-xs disabled:opacity-50"
              >
                {loading ? 'updating password...' : 'update password'}
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
                <h3 className="text-3xl font-black text-black tracking-tight lowercase">all secured!</h3>
                <p className="text-[11px] font-bold text-gray-400 lowercase leading-relaxed opacity-60">
                  your password has been <br /> successfully updated
                </p>
              </div>

              <div className="mt-12 w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-full h-full bg-[#DA9133] origin-left animate-progress"></div>
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
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: black !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}} />
      <style dangerouslySetInnerHTML={{ __html: `
        .forgot-modal-input:-webkit-autofill,
        .forgot-modal-input:-webkit-autofill:hover, 
        .forgot-modal-input:-webkit-autofill:focus, 
        .forgot-modal-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: black !important;
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
