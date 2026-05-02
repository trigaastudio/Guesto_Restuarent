import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import './RegisterPage.css';
import { useTheme } from '../../context/ThemeContext';
import OTPModal from '../../components/OTPModal/OTPModal';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11.9 19.79 19.79 0 0 1 1.07 3.27 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const logoSrc = theme === 'dark' ? "/logo-golden.png" : "/logo-dark.png";

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');


  const [showOTP, setShowOTP] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fields.name.trim()) newErrors.name = 'Full name is required';
    if (!fields.email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) newErrors.email = 'Invalid email format';
    if (!fields.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!fields.password) newErrors.password = 'Password is required';
    else if (fields.password.length < 6) newErrors.password = 'Min 6 characters';
    if (fields.password !== fields.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!fields.agreed) newErrors.agreed = 'Required';
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
      // Step 1: Send OTP
      const response = await api.post('/api/auth/send-otp', {
        email: fields.email
      });

      if (response.data.success) {
        setShowOTP(true);
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      setApiError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true);
    setApiError('');
    try {
      // Step 2: Verify OTP and Register
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
        // Save token and user data to log them in immediately
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));

        Swal.fire({
          title: 'Welcome!',
          text: 'Your account has been verified and created successfully.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          navigate('/home', { replace: true });
        });

      }
    } catch (err) {
      console.error('Verification Error:', err);
      Swal.fire({
        title: 'Verification Failed',
        text: 'The code you entered is incorrect or has expired. Please check your email and try again.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
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
        timer: 3000
      });
    } catch (err) {
      setApiError('Failed to resend OTP');
    }
  };


  return (
    <div className="register-page-wrapper">
      <div className="register-container page-fade-in">
        <div className="register-left">
          <div className="hero-image-wrapper hero-fade-in">
            <img src="/register.png" alt="Register Hero" className="hero-img" />
          </div>
        </div>
        <div className="register-right">
          <div className="register-form-card">
            <div className="register-form-topbar">
              <div className="logo-container">
                <img src={logoSrc} alt="GuestO Logo" className="brand-logo" />
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
              <h1 className="form-title">Create Account</h1>
              <p className="form-subtitle">Begin your journey with GuestO</p>
            </div>

            {apiError && <div className="api-error-message">{apiError}</div>}

            <form onSubmit={handleSubmit} className="register-form">
              <InputField
                id="name"
                name="name"
                label="FULL NAME"
                placeholder="Alexander Dupont"
                value={fields.name}
                onChange={handleChange}
                icon={<UserIcon />}
                error={errors.name}
              />

              <InputField
                id="email"
                name="email"
                type="email"
                label="EMAIL ADDRESS"
                placeholder="alex@editorial.com"
                value={fields.email}
                onChange={handleChange}
                icon={<MailIcon />}
                error={errors.email}
              />

              <InputField
                id="phone"
                name="phone"
                type="tel"
                label="PHONE NUMBER"
                placeholder="+1 (555) 000-0000"
                value={fields.phone}
                onChange={handleChange}
                icon={<PhoneIcon />}
                error={errors.phone}
              />

              <div className="password-grid">
                <InputField
                  id="password"
                  name="password"
                  type="password"
                  label="PASSWORD"
                  placeholder="••••••••"
                  value={fields.password}
                  onChange={handleChange}
                  icon={<LockIcon />}
                  error={errors.password}
                />

                <InputField
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="CONFIRM PASSWORD"
                  placeholder="••••••••"
                  value={fields.confirmPassword}
                  onChange={handleChange}
                  icon={<LockIcon />}
                  error={errors.confirmPassword}
                />
              </div>

              <div className="terms-checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="agreed"
                    checked={fields.agreed}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">
                    I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.agreed && <p className="error-message">{errors.agreed}</p>}
              </div>

              <Button type="submit" loading={loading} className="register-btn">
                Create Account
              </Button>

              <p className="auth-footer-text">
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </form>

            {success && (
              <div className="success-overlay">
                <div className="success-content">
                  <h2>Welcome aboard!</h2>
                  <p>Your account has been created successfully.</p>
                  <Button onClick={() => setSuccess(false)}>Dismiss</Button>
                </div>
              </div>
            )}
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
