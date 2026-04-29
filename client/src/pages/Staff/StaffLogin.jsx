import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, ArrowRight, Sun, Moon, ChefHat } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { showToast } from '../../utils/sweetAlert';

const API_BASE_URL = 'http://localhost:5000/api';

const StaffLogin = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Redirect if already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user.role === 'kitchen') navigate('/kitchen/dashboard', { replace: true });
    if (token && user.role === 'waiter') navigate('/waiter/dashboard', { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      showToast('warning', 'Please enter both Employee ID and Password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/staff/login`, { employeeId, password });
      
      if (response.data.success) {
        const staffData = response.data.data;
        localStorage.setItem('token', staffData.token);
        localStorage.setItem('user', JSON.stringify(staffData));
        showToast('success', `Welcome back, ${staffData.name}!`);
        
        if (staffData.role === 'kitchen') {
          navigate('/kitchen/dashboard', { replace: true });
        } else if (staffData.role === 'waiter') {
          navigate('/waiter/dashboard', { replace: true });
        } else {
          showToast('error', 'Unrecognized role. Please contact admin.');
        }
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3 bg-background-card rounded-full border border-border-light text-text-secondary hover:text-primary transition-all shadow-sm"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <img
          src={isDarkMode ? '/logo-light.png' : '/logo-dark.png'}
          alt="Restaurant Logo"
          className="h-16 w-auto mb-4"
        />
        <div className="flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
          <ChefHat size={14} className="text-amber-500" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Staff Portal</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-background-card w-full max-w-md rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-border-light transition-all duration-500 animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-medium text-text-primary text-center mb-8 italic opacity-70 border-b border-border-light pb-6">
          Kitchen &amp; Waiter Access
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
              Employee ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-background-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-background-card rounded-xl text-sm transition-all outline-none text-text-primary placeholder:text-text-muted font-bold"
                placeholder="e.g. KS001"
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-background-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-background-card rounded-xl text-sm transition-all outline-none text-text-primary placeholder:text-text-muted"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#B15D09] to-primary hover:from-primary hover:to-primary-light text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="uppercase tracking-widest text-sm">Login to Panel</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="pt-4 border-t border-border-light text-center">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="text-[10px] font-black text-text-muted hover:text-primary uppercase tracking-widest transition-colors"
            >
              Admin? Login here
            </button>
          </div>
        </form>
      </div>

      <p className="mt-10 text-[10px] text-text-secondary italic">
        GuestO Restaurant &copy; 2026
      </p>
    </div>
  );
};

export default StaffLogin;
