import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../api/axiosInstance';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import './LoginPage.css';
import { useTheme } from '../../context/ThemeContext';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18c-.77 1.56-1.21 3.31-1.21 5.17s.44 3.61 1.21 5.17l3.66-2.83z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const logoSrc = theme === 'dark' ? "/logo-light.png" : "/logo-dark.png";

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setApiError('');
      try {
        const response = await api.post('/api/auth/google', {
          token: tokenResponse.access_token
        });
        if (response.data.success) {
          localStorage.setItem('token', response.data.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          navigate('/home', { replace: true });
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Google Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setApiError('Google Login failed. Please try again.');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fields.email.trim()) newErrors.email = 'Email is required';
    if (!fields.password) newErrors.password = 'Password is required';
    return newErrors;
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
      const response = await api.post('/api/auth/login', fields);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        navigate('/home', { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setApiError('Access denied. Admin accounts cannot log in here.');
      } else if (err.response?.status === 401) {
        setApiError('Invalid credentials. Please check your email and password.');
      } else {
        setApiError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container page-fade-in">
        <div className="login-left">
          <div className="hero-image-wrapper hero-fade-in">
            <img src="/register.png" alt="Login Hero" className="hero-img" />
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-card">
            <div className="login-form-topbar">
              <div className="logo-container">
                <img src={logoSrc} alt="GuestO" className="brand-logo" />
              </div>
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            <div className="form-header">
              <h1 className="form-title">Welcome Back</h1>
              <p className="form-subtitle">Please enter your details to sign in</p>
            </div>

            {apiError && <div className="api-error-message">{apiError}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <InputField
                id="email" name="email" type="email"
                label="EMAIL ADDRESS" placeholder="alex@editorial.com"
                value={fields.email} onChange={handleChange}
                icon={<MailIcon />} error={errors.email}
              />

              <InputField
                id="password" name="password" type="password"
                label="PASSWORD" placeholder="••••••••"
                value={fields.password} onChange={handleChange}
                icon={<LockIcon />} error={errors.password}
              />

              <div className="form-options">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <Button type="submit" loading={loading}>Sign In</Button>

              <div className="divider"><span>OR</span></div>

              <button 
                type="button" 
                className="google-btn"
                onClick={() => googleLogin()}
                disabled={loading}
              >
                <GoogleIcon />
                <span>{loading ? 'Processing...' : 'Sign in with Google'}</span>
              </button>

              <p className="auth-footer-text">
                Don't have an account? <Link to="/register">Register now</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


