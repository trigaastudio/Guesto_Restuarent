import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import Swal from 'sweetalert2';
import { User, Mail, Phone, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import OTPModal from '../../components/OTPModal/OTPModal';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { settings } = useCart();
  const logoSrc = theme === 'dark' ? (settings?.branding?.logoGold || "/logo-golden.png") : (settings?.branding?.logoDark || "/logo-dark.png");

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,64}$/;

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'REQUIRED';
        break;
      case 'email':
        if (!value.trim()) error = 'REQUIRED';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
        break;
      case 'phone':
        if (!value.trim()) error = 'REQUIRED';
        break;
      case 'password':
        if (!value) error = 'REQUIRED';
        else if (!passwordRegex.test(value)) error = 'Must be 8-64 chars with A-Z, a-z, 0-9 & symbol';
        break;
      case 'confirmPassword':
        if (!value) error = 'REQUIRED';
        else if (value !== fields.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFields((prev) => {
      const newFields = { ...prev, [name]: val };

      // If we're updating password, we also need to re-validate confirmPassword live if there's already an error
      if (name === 'password' && errors.confirmPassword) {
        const confirmErr = newFields.confirmPassword !== val ? 'Passwords do not match' : '';
        setErrors(errs => ({ ...errs, confirmPassword: confirmErr }));
      }

      return newFields;
    });

    // Live CLEARING of errors: If the field already has an error, check if it's now fixed
    if (errors[name]) {
      const fieldError = validateField(name, val);
      if (!fieldError) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const validate = () => {
    const newErrors = {};
    Object.keys(fields).forEach(key => {
      const err = validateField(key, fields[key]);
      if (err) newErrors[key] = err;
    });
    return newErrors;
  };

  const isFormValid = () => {
    return (
      fields.name.trim() !== '' &&
      fields.email.trim() !== '' &&
      /\S+@\S+\.\S+/.test(fields.email) &&
      fields.phone.trim() !== '' &&
      passwordRegex.test(fields.password) &&
      fields.password === fields.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const valErrors = validate();
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-otp', {
        email: fields.email,
        phone: fields.phone
      });
      if (response.data.success) {
        setShowOTP(true);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true);
    setApiError('');
    try {
      const response = await api.post('/api/auth/verify-otp', {
        email: fields.email,
        otp,
        userData: {
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          password: fields.password
        }
      });

      if (response.data.success) {
        setShowOTP(false);
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('cart-refresh'));

        Swal.fire({
          title: 'Verified!',
          text: 'Welcome to the Guesto family.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          background: '#800000',
          color: '#FFFFFF'
        }).then(() => {
          navigate('/home', { replace: true });
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Incorrect code.',
        icon: 'error',
        confirmButtonColor: '#DA9133',
        background: '#800000',
        color: '#FFFFFF'
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/api/auth/send-otp', { email: fields.email });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'OTP Resent',
        showConfirmButton: false,
        timer: 3000,
        background: '#800000',
        color: '#FFFFFF'
      });
    } catch (err) {
      setApiError('Failed to resend OTP');
    }
  };

  return (
    <div className="h-screen w-full bg-[#D10000] flex flex-col relative overflow-hidden font-sans select-none text-white">

      {/* Background Image with Vibrant Red Studio Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="/heroSection/hero.png"
          alt="Guesto Restaurant"
          className="w-full h-full object-cover object-center lg:object-[center_35%] opacity-30 md:opacity-40 animate-slow-zoom brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000]/95 via-[#D10000]/90 to-[#800000]/95 z-10 mix-blend-multiply"></div>
      </div>

      {/* Header / Logo */}
      <header className="relative w-full px-6 md:px-12 py-3 z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={settings?.branding?.logoGold || "/logo-golden.png"} alt={settings?.restaurantDetails?.name || "Guesto Restaurant"} className="h-6 md:h-8 object-contain" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full pt-2 pb-2">

        {/* Register Card */}
        <div className="w-full max-w-xl page-fade-in scale-[0.85] md:scale-95 lg:scale-100 origin-center">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 md:p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">

            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-[70px]"></div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
                  Join <span className="opacity-90">Guesto</span>
                </h1>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest">Create an account to begin your journey</p>
              </div>

              {apiError && (
                <div className="bg-red-500/20 border border-red-500/30 text-white px-4 py-3 rounded-2xl text-xs font-bold text-center animate-shake">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={16} />
                      <input
                        type="text" name="name" placeholder="John Doe"
                        value={fields.name} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none transition-all text-white placeholder:text-white/30 autofill:bg-transparent ${errors.name ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-white/10 focus:border-[#DA9133]/50 focus:bg-white/10'
                          }`}
                      />
                    </div>
                    {errors.name && errors.name !== 'REQUIRED' && <p className="text-[10px] text-white font-bold ml-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={16} />
                      <input
                        type="tel" name="phone" placeholder="+123 456 7890"
                        value={fields.phone} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none transition-all text-white placeholder:text-white/30 autofill:bg-transparent ${errors.phone ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-white/10 focus:border-[#DA9133]/50 focus:bg-white/10'
                          }`}
                      />
                    </div>
                    {errors.phone && errors.phone !== 'REQUIRED' && <p className="text-[10px] text-white font-bold ml-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Email Address <span className="text-[#DA9133]">*</span></label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={16} />
                    <input
                      type="email" name="email" placeholder="alex@example.com"
                      value={fields.email} onChange={handleChange} onBlur={handleBlur}
                      className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none transition-all text-white placeholder:text-white/30 autofill:bg-transparent ${errors.email ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-white/10 focus:border-[#DA9133]/50 focus:bg-white/10'
                        }`}
                    />
                  </div>
                  {errors.email && errors.email !== 'REQUIRED' && <p className="text-[10px] text-white font-bold ml-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Password <span className="text-[#DA9133]">*</span></label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={16} />
                      <input
                        type={showPassword ? "text" : "password"} name="password" placeholder="••••••••"
                        value={fields.password} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-10 text-xs font-medium focus:outline-none transition-all text-white placeholder:text-white/30 autofill:bg-transparent ${errors.password ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-white/10 focus:border-[#DA9133]/50 focus:bg-white/10'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && errors.password !== 'REQUIRED' && <p className="text-[10px] text-white font-bold ml-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Confirm Password <span className="text-[#DA9133]">*</span></label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={16} />
                      <input
                        type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••"
                        value={fields.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-10 text-xs font-medium focus:outline-none transition-all text-white placeholder:text-white/30 autofill:bg-transparent ${errors.confirmPassword ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-white/10 focus:border-[#DA9133]/50 focus:bg-white/10'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && errors.confirmPassword !== 'REQUIRED' && <p className="text-[10px] text-white font-bold ml-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                  <p className="text-center text-[10px] md:text-xs text-white/50 font-medium py-2">
                    By continuing, you agree to our <Link to="/terms" className="text-[#DA9133] hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#DA9133] hover:underline">Privacy Policy</Link>.
                  </p>

                <button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/20 group flex items-center justify-center gap-2 ${isFormValid()
                      ? "bg-[#DA9133] hover:bg-[#C27D29] text-white animate-bounce-in"
                      : "bg-white/10 text-white/30 cursor-not-allowed border border-white/10"
                    }`}
                >
                  {loading ? 'Creating Account...' : (
                    <>
                      Create Account
                      <ArrowRight size={18} className={`${isFormValid() ? "group-hover:translate-x-1" : ""} transition-transform`} />
                    </>
                  )}
                </button>

                {!isFormValid() && (
                  <div className="pt-2 text-center">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                      Please complete all fields correctly to continue
                    </p>
                  </div>
                )}
              </form>

              <p className="text-center text-xs font-medium text-white/50">
                Already have an account?{' '}
                <Link to="/login" className="text-[#DA9133] hover:text-[#C27D29] font-black underline underline-offset-4 decoration-[#DA9133]/30">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full px-6 py-4 relative z-30 text-center">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
          © 2024 Guesto Restaurant Group. Join the Culinary Revolution.
        </p>
      </footer>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-out infinite alternate;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-fade-in {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #8B0000 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
      `}} />

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
