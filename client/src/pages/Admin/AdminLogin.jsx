import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axiosInstance';
import Loader from '../../components/Loader/Loader';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const isDarkMode = theme === 'dark';

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setSettings(response.data.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Prevent accessing login if already logged in as admin
  React.useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    if (token && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/admin-login', { email, password });

      if (response.data.success) {
        const userData = response.data.data;
        localStorage.setItem('admin_token', userData.token);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        // Also set general keys for consistency across the app
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3 bg-background-card rounded-full border border-border-light text-text-secondary hover:text-primary transition-all shadow-sm"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Logo Section */}
      <div className="mb-12 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <img 
          src={isDarkMode 
            ? (settings?.branding?.logoGold || "/logo-golden.png") 
            : (settings?.branding?.logoDark || "/logo-dark.png")} 
          alt="Restaurant Logo" 
          className="h-16 w-auto mb-2" 
        />
      </div>

      <div className="bg-background-card w-full max-w-md rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-border-light transition-all duration-500">
        <h2 className="text-xl font-medium text-text-primary text-center mb-8 italic opacity-70 border-b border-border-light pb-6">
          Admin Entrance
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
              Admin Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-background-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-background-card rounded-xl text-sm transition-all outline-none text-text-primary placeholder:text-text-muted"
                placeholder="Enter Admin Email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-4 bg-background-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-background-card rounded-xl text-sm transition-all outline-none text-text-primary placeholder:text-text-muted"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#991b1b] to-primary hover:from-primary hover:to-primary-light text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader size="small" />
            ) : (
              <>
                <span className="uppercase tracking-widest text-sm">Enter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="pt-4 border-t border-border-light text-center">
            <button 
              type="button"
              onClick={() => navigate('/staff/login')}
              className="text-[10px] font-black text-text-muted hover:text-primary uppercase tracking-widest transition-colors"
            >
              Are you Kitchen or Waiter? Staff Login
            </button>
          </div>
        </form>
      </div>

      <div className="mt-12 text-center">
        <div className="flex space-x-6 text-[10px] text-text-secondary font-medium mb-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">Concierge Support</a>
        </div>
        <p className="text-[10px] text-text-secondary italic">
          GuestO Restaurant &copy; 2026
        </p>
      </div>
    </div >
  );
};

export default AdminLogin;
