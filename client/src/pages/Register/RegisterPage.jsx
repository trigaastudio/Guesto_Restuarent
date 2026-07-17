import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { showToast, showAlert } from '../../utils/sweetAlert';
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import OTPModal from '../../components/OTPModal/OTPModal';
import FunnyDumpling from '../../components/FunnyDumpling/FunnyDumpling';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18c-.77 1.56-1.21 3.31-1.21 5.17s.44 3.61 1.21 5.17l3.66-2.83z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { settings } = useCart();
  const logoSrc = settings?.branding?.logoGold || '/logo-golden.png';
  const containerRef = useRef(null);

  const [fields, setFields] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) { setApiError('Failed to get access token from Google.'); return; }
      setLoading(true); setApiError('');
      try {
        const res = await api.post('/api/auth/google', { token: tokenResponse.access_token });
        if (res.data.success) {
          const u = res.data.data;
          localStorage.setItem('token', u.token);
          localStorage.setItem('user', JSON.stringify(u));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('cart-refresh'));
          showToast('success', 'Welcome to the Guesto family!');
          navigate('/home', { replace: true });
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Google signup failed.');
      } finally { setLoading(false); }
    },
    onError: () => setApiError('Google signup failed. Please try again.')
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const originalTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');

    return () => {
      document.documentElement.setAttribute('data-theme', originalTheme);
      if (originalTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/;
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const phoneRegex = /^[6-9][0-9]{9}$/;
  const isInvalidPhone = (phone) => /^(\d)\1{9}$/.test(phone); // all same digit like 0000000000

  const validateField = (name, value) => {
    switch (name) {
      case 'name': return !value.trim() ? 'REQUIRED' : !nameRegex.test(value) ? 'Must be 2-50 characters, letters only' : '';
      case 'email': return !value.trim() ? 'REQUIRED' : !/\S+@\S+\.\S+/.test(value) ? 'Invalid email format' : '';
      case 'phone': return !value.trim() ? 'REQUIRED' : !phoneRegex.test(value) ? 'Must be 10 digits starting with 6, 7, 8, or 9' : isInvalidPhone(value) ? 'Please enter a valid phone number' : '';
      case 'password': return !value ? 'REQUIRED' : !passwordRegex.test(value) ? 'Must be 8-64 chars with A-Z, a-z, 0-9 & symbol' : '';
      case 'confirmPassword': return !value ? 'REQUIRED' : value !== fields.password ? 'Passwords do not match' : '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'password' && errors.confirmPassword) {
        setErrors(errs => ({ ...errs, confirmPassword: updated.confirmPassword !== value ? 'Passwords do not match' : '' }));
      }
      return updated;
    });
    if (errors[name] && !validateField(name, value))
      setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) setErrors(p => ({ ...p, [name]: err }));
  };

  const validate = () => {
    const errs = {};
    Object.keys(fields).forEach(k => { const e = validateField(k, fields[k]); if (e) errs[k] = e; });
    return errs;
  };

  const isFormValid = () =>
    nameRegex.test(fields.name) && /\S+@\S+\.\S+/.test(fields.email) &&
    phoneRegex.test(fields.phone) && !isInvalidPhone(fields.phone) && passwordRegex.test(fields.password) && fields.password === fields.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const valErrors = validate();
    if (Object.keys(valErrors).length > 0) { setErrors(valErrors); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/send-otp', { email: fields.email, phone: fields.phone });
      if (res.data.success) setShowOTP(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true); setApiError('');
    try {
      const res = await api.post('/api/auth/verify-otp', {
        email: fields.email, otp,
        userData: { name: fields.name, email: fields.email, phone: fields.phone, password: fields.password }
      });
      if (res.data.success) {
        setShowOTP(false);
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        window.dispatchEvent(new Event('cart-refresh'));
        showToast('success', 'Verified! Welcome to the Guesto family.');
        navigate('/home', { replace: true });
      }
    } catch (err) {
      showAlert({
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Incorrect code.',
        icon: 'error'
      });
    } finally { setOtpLoading(false); }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/api/auth/send-otp', { email: fields.email });
      showToast('success', 'OTP Resent Successfully');
    } catch { setApiError('Failed to resend OTP'); }
  };


  const inputCls = (field) =>
    `w-full bg-background-muted border rounded-2xl py-2 sm:py-3 pl-9 sm:pl-11 pr-4 text-xs sm:text-sm font-semibold
     placeholder:text-text-muted/50 focus:outline-none transition-all text-text-primary ${errors[field]
      ? 'border-primary/60 bg-primary/5 focus:ring-1 focus:ring-primary'
      : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/40'
    }`;

  return (
    <div className="min-h-screen w-full bg-background font-sans select-none flex relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[100] p-2 sm:p-2.5 bg-background-card/80 backdrop-blur-md rounded-full border border-border text-text-primary hover:bg-primary hover:text-white transition-all shadow-lg group flex items-center justify-center"
        title="Go Back"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      { }
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <img
          src="/heroSection/hero.png"
          alt="Guesto Restaurant"
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-black/80 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center text-center px-14 w-full page-fade-in">
          <div className="mb-10 cursor-pointer hover:scale-105 transition-transform duration-500" onClick={() => navigate('/')}>
            <img
              src={settings?.branding?.logoGold || '/logo-golden.png'}
              alt="Guesto"
              className="h-16 mx-auto drop-shadow-2xl"
            />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
            Begin Your<br />
            <span className="text-primary-light">Journey</span>
          </h2>
          <p className="text-base text-white/75 font-medium leading-relaxed max-w-xs">
            Create an account to unlock exclusive dining experiences, priority reservations & personalized menus.
          </p>
          <div className="mt-12 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-light opacity-80"></span>
            <span className="w-2 h-2 rounded-full bg-white/40"></span>
            <span className="w-2 h-2 rounded-full bg-white/20"></span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full lg:w-1/2 flex flex-col justify-start sm:justify-center items-center px-3 xs:px-4 sm:px-12 pt-3 pb-12 sm:py-6 relative min-h-screen lg:h-screen lg:overflow-y-auto no-scrollbar">

        { }
        <div className="lg:hidden fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-background" />
          <img src="/heroSection/hero.png" alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/80 to-background/95" />
        </div>

        { }
        <div className="lg:hidden flex justify-center mb-3 sm:mb-8 mt-2 sm:mt-4 cursor-pointer z-20" onClick={() => navigate('/')}>
          <img src={logoSrc} alt="Logo" className="h-9 xs:h-11 sm:h-14 object-contain" />
        </div>

        <div className="w-full max-w-[330px] xs:max-w-[360px] md:max-w-[580px] lg:max-w-[500px] relative z-10 page-fade-in mt-1 sm:my-auto py-4">

          { }
          <div className="relative h-16 sm:h-20 w-full overflow-visible z-20">
            <FunnyDumpling
              isHiding={activeField === 'password' || activeField === 'confirmPassword'}
              activeField={activeField}
            />
          </div>

          { }
          <div className="bg-background-card border border-border rounded-[1.5rem] sm:rounded-[2rem] px-4 py-6 xs:px-5 xs:py-7 sm:p-10 shadow-xl relative overflow-hidden">

            { }
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/15 rounded-full blur-[50px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary-light/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative z-10 space-y-5">

              { }
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-text-primary">Join Guesto</h1>
                <p className="text-[11px] text-text-muted font-semibold uppercase tracking-widest">Create your account</p>
              </div>

              { }
              {apiError && (
                <div className="bg-primary/10 border border-primary/25 text-primary px-4 py-3 rounded-xl text-xs font-bold text-center animate-shake flex items-center justify-center gap-2">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                { }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group/i">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/i:text-primary transition-colors duration-300" size={15} />
                      <input
                        type="text" name="name" placeholder="John Doe"
                        value={fields.name} onChange={handleChange} onBlur={handleBlur}
                        className={inputCls('name')}
                      />
                    </div>
                    {errors.name && errors.name !== 'REQUIRED' && <p className="text-[10px] text-primary font-bold ml-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group/i">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/i:text-primary transition-colors duration-300" size={15} />
                      <input
                        type="tel" name="phone" placeholder="+91 98765 43210"
                        value={fields.phone} onChange={handleChange} onBlur={handleBlur}
                        className={inputCls('phone')}
                      />
                    </div>
                    {errors.phone && errors.phone !== 'REQUIRED' && <p className="text-[10px] text-primary font-bold ml-1">{errors.phone}</p>}
                  </div>
                </div>

                { }
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                    Email Address <span className="text-primary-light">*</span>
                  </label>
                  <div className="relative group/i">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/i:text-primary transition-colors duration-300" size={15} />
                    <input
                      type="email" name="email" placeholder="alex@example.com"
                      value={fields.email} onChange={handleChange}
                      onFocus={() => setActiveField('email')}
                      onBlur={(e) => { handleBlur(e); setActiveField(''); }}
                      className={inputCls('email')}
                    />
                  </div>
                  {errors.email && errors.email !== 'REQUIRED' && <p className="text-[10px] text-primary font-bold ml-1">{errors.email}</p>}
                </div>

                { }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                      Password <span className="text-primary-light">*</span>
                    </label>
                    <div className="relative group/i">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/i:text-primary transition-colors duration-300" size={15} />
                      <input
                        type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••"
                        value={fields.password} onChange={handleChange}
                        onFocus={() => setActiveField('password')}
                        onBlur={(e) => { handleBlur(e); setActiveField(''); }}
                        className={`${inputCls('password')} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && errors.password !== 'REQUIRED' && <p className="text-[10px] text-primary font-bold ml-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                      Confirm Password <span className="text-primary-light">*</span>
                    </label>
                    <div className="relative group/i">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/i:text-primary transition-colors duration-300" size={15} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="••••••••"
                        value={fields.confirmPassword} onChange={handleChange}
                        onFocus={() => setActiveField('confirmPassword')}
                        onBlur={(e) => { handleBlur(e); setActiveField(''); }}
                        className={`${inputCls('confirmPassword')} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirmPassword && errors.confirmPassword !== 'REQUIRED' && <p className="text-[10px] text-primary font-bold ml-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                { }
                <p className="text-center text-[9px] text-text-muted font-semibold tracking-wide">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-primary-light hover:underline font-bold">Terms</Link>
                  {' '}&amp;{' '}
                  <Link to="/privacy" className="text-primary-light hover:underline font-bold">Privacy Policy</Link>.
                </p>

                { }
                <button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className={`w-full py-2.5 sm:py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] group/btn flex items-center justify-center gap-2 ${isFormValid()
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25'
                    : 'bg-background-muted text-text-muted cursor-not-allowed border border-border'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={17} className={`${isFormValid() ? 'group-hover/btn:translate-x-1' : ''} transition-transform`} />
                    </>
                  )}
                </button>

                {!isFormValid() && (
                  <p className="text-center text-[10px] font-bold text-text-muted/60 uppercase tracking-widest animate-pulse">
                    Complete all fields to continue
                  </p>
                )}
              </form>

              { }
              <div className="flex items-center gap-3">
                <div className="flex-grow h-px bg-border" />
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Or</span>
                <div className="flex-grow h-px bg-border" />
              </div>

              { }
              <button
                type="button"
                onClick={() => googleLogin()}
                className="w-full bg-background-muted hover:bg-border/60 border border-border text-text-primary py-2.5 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              { }
              <p className="text-center text-[11px] sm:text-xs font-semibold text-text-muted pt-1">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary font-black underline underline-offset-4 decoration-primary/30 hover:text-primary-dark transition-colors"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>



      {showOTP && (
        <OTPModal
          email={fields.email}
          loading={otpLoading}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onClose={() => setShowOTP(false)}
        />
      )}
    </div>
  );
};

export default RegisterPage;
