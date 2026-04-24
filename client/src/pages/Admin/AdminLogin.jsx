import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const isDarkMode = theme === 'dark';

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-default flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3 bg-bg-card rounded-full border border-border-light text-text-sub hover:text-primary transition-all shadow-sm"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Logo Section - Just the theme responsive logo */}
      <div className="mb-12 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <img src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} alt="GuestO Logo" className="h-16 w-auto mb-2" />
      </div>

      {/* Login Card */}
      <div className="bg-bg-card w-full max-w-md rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-border-light transition-all duration-500">
        <h2 className="text-xl font-medium text-text-main text-center mb-8 italic opacity-70 border-b border-border-light pb-6">
          Admin Entrance
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider ml-1">
              Admin ID
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-text-dim group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-11 pr-4 py-4 bg-bg-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-bg-card rounded-xl text-sm transition-all outline-none text-text-main placeholder:text-text-dim"
                placeholder="Enter Admin ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-sub uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-text-dim group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full pl-11 pr-12 py-4 bg-bg-muted border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-bg-card rounded-xl text-sm transition-all outline-none text-text-main placeholder:text-text-dim"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-dim hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#B15D09] to-primary hover:from-primary hover:to-primary-light text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] mt-4"
          >
            <span className="uppercase tracking-widest text-sm">Enter Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="flex space-x-6 text-[10px] text-text-sub font-medium mb-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">Concierge Support</a>
        </div>
        <p className="text-[10px] text-text-sub italic">
          GuestO Restaurant &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
