import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useTheme } from '../../context/ThemeContext';
import ForgotPasswordModal from '../../components/ForgotPasswordModal/ForgotPasswordModal';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18c-.77 1.56-1.21 3.31-1.21 5.17s.44 3.61 1.21 5.17l3.66-2.83z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? "/logo-golden.png" : "/logo-dark.png";

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) {
        setApiError('Failed to get access token from Google.');
        return;
      }
      setLoading(true);
      setApiError('');
      try {
        const response = await api.post('/api/auth/google', {
          token: tokenResponse.access_token
        });
        if (response.data.success) {
          const userData = response.data.data;
          localStorage.setItem('token', userData.token);
          localStorage.setItem('user', JSON.stringify(userData));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('cart-refresh'));

          // Role-based redirection
          if (userData.role === 'admin') {
            localStorage.setItem('admin_token', userData.token);
            localStorage.setItem('admin_user', JSON.stringify(userData));
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
        }
      } catch (err) {
        setApiError(err.response?.data?.message || err.message || 'Google Login failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setApiError('Google Login failed. Please try again.')
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const newErrors = {};
    if (!fields.email.trim()) newErrors.email = 'Email is required';
    if (!fields.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', fields);
      if (response.data.success) {
        const userData = response.data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);

        // Dispatch events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('cart-refresh'));

        // Role-based redirection
        if (userData.role === 'admin') {
          localStorage.setItem('admin_token', userData.token);
          localStorage.setItem('admin_user', JSON.stringify(userData));
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#D10000] flex flex-col relative overflow-hidden font-sans select-none text-white">

      {/* Background Image with Vibrant Red Studio Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/heroSection/hero.png"
          alt="Guesto Restaurant"
          className="w-full h-full object-cover object-center lg:object-[center_35%] opacity-40 md:opacity-50 animate-slow-zoom brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF0000]/95 via-[#D10000]/90 to-[#800000]/95 z-10 mix-blend-multiply"></div>
      </div>

      {/* Header / Logo */}
      <header className="absolute top-0 left-0 w-full px-6 md:px-12 py-4 z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo-light.png" alt="Guesto Restaurant" className="h-7 md:h-9 object-contain" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-20 w-full pt-8 pb-4">

        {/* Login Card */}
        <div className="w-full max-w-md page-fade-in scale-[0.95] md:scale-100">
          <div className="backdrop-blur-3xl bg-white/10 border border-white/20 p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">

            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-[70px]"></div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
                  Welcome <span className="opacity-90">Back</span>
                </h1>
                <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest">Log in to savor the extraordinary</p>
              </div>

              {apiError && (
                <div className="bg-red-500/20 border border-red-500/30 text-white px-4 py-3 rounded-2xl text-xs font-bold text-center animate-shake">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={18} />
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={fields.email}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-[#DA9133]/50 focus:bg-white/10 transition-all text-white autofill:bg-transparent"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-white font-bold ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-[#DA9133] transition-all duration-300" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={fields.password}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-[#DA9133]/50 focus:bg-white/10 transition-all text-white autofill:bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-white font-bold ml-1">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowResetModal(true)} className="text-[10px] font-black text-[#DA9133] hover:text-[#C27D29] transition-colors uppercase tracking-widest">
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#DA9133] hover:bg-[#C27D29] text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : (
                    <>
                      Sign In
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={() => googleLogin()}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <GoogleIcon />
                Google Account
              </button>

              <p className="text-center text-xs font-medium text-white/50">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#DA9133] hover:text-[#C27D29] font-black underline underline-offset-4 decoration-[#DA9133]/30">
                  Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="w-full px-6 py-4 relative z-30 text-center">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
          © 2024 Guesto Restaurant Group. Secure Authentication.
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
      `}} />
      <ForgotPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default LoginPage;
