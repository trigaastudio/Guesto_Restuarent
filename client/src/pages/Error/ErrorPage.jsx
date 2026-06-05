import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Footer from '../../components/Footer/Footer';

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type');
  const customMessage = searchParams.get('message');

  const { title, message, actionPath, actionLabel } = useMemo(() => {
    let t = "Oops! Something went wrong";
    let m = customMessage || "We encountered an unexpected error. Our team has been notified.";
    let path = "/";
    let label = "Return Home";

    
    const adminToken = localStorage.getItem('admin_token');
    const staffToken = localStorage.getItem('staff_token');
    const staffUser = JSON.parse(localStorage.getItem('staff_user') || 'null');
    
    if (adminToken) {
      path = "/admin/dashboard";
      label = "Return to Dashboard";
    } else if (staffToken && staffUser) {
      if (staffUser.role === 'kitchen') path = "/kitchen/dashboard";
      else if (staffUser.role === 'waiter') path = "/waiter/dashboard";
      else path = "/staff/login";
      label = "Return to Dashboard";
    }

    if (type === 'server') {
      t = "Server Connection Error";
      m = customMessage || "We are having trouble connecting to the server. Please check your internet connection or try again later.";
    } else if (type === 'client') {
      t = "Application Error";
      m = customMessage || "The application encountered an unexpected error while rendering this page.";
    }

    return { title: t, message: m, actionPath: path, actionLabel: label };
  }, [type, customMessage]);

  return (
    <div className={`min-h-screen bg-background font-sans flex flex-col ${theme}`}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50"></div>
            <AlertTriangle size={48} className="text-primary relative z-10" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-text-primary tracking-tighter">
              {title}
            </h1>
            <p className="text-sm font-medium text-text-muted">
              {message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border-main text-text-primary font-bold hover:bg-background-muted transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            <button
              onClick={() => {
                
                window.location.href = actionPath;
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Home size={18} />
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ErrorPage;
